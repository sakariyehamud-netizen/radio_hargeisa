import express, { type NextFunction, type Request, type Response } from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  listEntity,
  getEntityById,
  createEntity,
  updateEntity,
  deleteEntity,
  deleteWhere,
  type DbUser,
  type EntityName,
} from "../src/db/repo.ts";
import { hashPassword, verifyPassword } from "../src/db/seed.ts";
import {
  attachAuthUser,
  requireAdmin,
  requireAuth,
  requireStaff,
  signSessionToken,
  type AuthRequest,
} from "../src/middleware/auth.ts";
import { runStudioAiTask } from "./ai.ts";
import { resolveRole, isAdminRole, hasPermission, type AppRole } from "../src/lib/rbac.ts";
import { stationNow, hhmmToMinutes } from "../src/lib/format.ts";

function asyncRoute(
  fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch((error: any) => {
      console.error("API route error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: error?.message || "An unexpected error occurred.",
        });
      }
    });
  };
}

function sanitizeUser(u: DbUser) {
  const { password_hash, otp_code, reset_token, ...safe } = u;
  return safe;
}

function assertPermission(role: AppRole, perm: string, res: Response): boolean {
  if (!hasPermission(role, perm)) {
    res.status(403).json({ error: `Missing permission: ${perm}` });
    return false;
  }
  return true;
}

async function audit(
  req: AuthRequest,
  action: string,
  entity_type?: string,
  entity_id?: string,
  details?: string
) {
  try {
    await createEntity(
      "AuditLog",
      {
        actor_email: req.currentUser?.email || "system",
        actor_role: req.currentRole,
        action,
        entity_type: entity_type || "",
        entity_id: entity_id || "",
        details: details || "",
      },
      req.currentUser?.id || "system"
    );
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

async function getPrimaryStation() {
  const stations = await listEntity("Station");
  return stations.find((s: any) => s.is_primary) || stations[0] || null;
}

async function computeOnAir() {
  const now = stationNow();
  const [station, allSchedules, streams, broadcasts] = await Promise.all([
    getPrimaryStation(),
    listEntity("Schedule"),
    listEntity("LiveStream"),
    listEntity("Broadcast"),
  ]);

  const schedules = allSchedules.filter(
    (s: any) => s.day_of_week === now.dayOfWeek && s.status !== "CANCELLED"
  );
  const sorted = [...schedules].sort(
    (a: any, b: any) => hhmmToMinutes(a.start_time) - hhmmToMinutes(b.start_time)
  );
  const curMin = now.minutesSinceMidnight;
  const currentProgram =
    sorted.find(
      (s: any) =>
        curMin >= hhmmToMinutes(s.start_time) && curMin < hhmmToMinutes(s.end_time)
    ) || null;
  const nextProgram =
    sorted.find((s: any) => hhmmToMinutes(s.start_time) > curMin) || null;

  const audioStream =
    streams.find((s: any) => s.kind === "AUDIO" && s.is_primary) ||
    streams.find((s: any) => s.kind === "AUDIO") ||
    null;
  const videoStream = streams.find((s: any) => s.kind === "VIDEO") || null;

  const activeBroadcast =
    broadcasts.find(
      (b: any) => b.status === "LIVE" || b.status === "PAUSED" || b.status === "EMERGENCY"
    ) || null;

  return {
    now,
    station,
    audioStream,
    videoStream,
    broadcast: activeBroadcast,
    currentProgram,
    nextProgram,
    todaySchedule: sorted,
  };
}

const WHITELISTED_STUDIO_ENTITIES = new Set<EntityName>([
  "Category",
  "Program",
  "Episode",
  "Video",
  "NewsArticle",
  "Presenter",
  "Schedule",
  "MediaAsset",
  "MediaClip",
  "Recording",
  "LiveStream",
  "Broadcast",
  "AiJob",
  "Notification",
  "AnalyticsEvent",
  "Station",
]);

const WHITELISTED_ADMIN_ENTITIES = new Set<EntityName>([
  "Organization",
  "Station",
  "Category",
  "Program",
  "Episode",
  "Video",
  "NewsArticle",
  "Presenter",
  "Schedule",
  "MediaAsset",
  "MediaClip",
  "Recording",
  "LiveStream",
  "Broadcast",
  "Advertisement",
  "AiJob",
  "Notification",
  "StaffInvitation",
  "AnalyticsEvent",
  "AuditLog",
]);

export function createApiRouter() {
  const router = express.Router();
  router.use(express.json({ limit: "25mb" }));
  router.use(attachAuthUser as any);

  // Health / station time probe
  router.get("/time", (_req, res) => {
    res.json({ now: new Date().toISOString(), stationNow: stationNow() });
  });

  // ---------------- AUTH ----------------
  router.get(
    "/auth/me",
    asyncRoute(async (req, res) => {
      if (!req.currentUser) {
        return res.json({ user: null, role: "USER" });
      }
      res.json({ user: sanitizeUser(req.currentUser), role: req.currentRole });
    })
  );

  router.post(
    "/auth/login",
    asyncRoute(async (req, res) => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Enter a valid email and password." });
      }
      const email = parsed.data.email.trim().toLowerCase();
      const users = (await listEntity("User")) as DbUser[];
      const user = users.find((u) => u.email.toLowerCase() === email);
      if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
        return res.status(401).json({ error: "Invalid email or password." });
      }
      if (user.account_status === "SUSPENDED") {
        return res.status(403).json({ error: "Your account has been suspended." });
      }
      if (!user.verified) {
        return res.status(403).json({
          error: "Please verify your email with the 6-digit code first.",
          requiresOtp: true,
        });
      }
      await updateEntity("User", user.id, { last_active_at: new Date().toISOString() });
      const token = signSessionToken(user.id);
      res.json({ token, user: sanitizeUser(user), role: resolveRole(user as any) });
    })
  );

  router.post(
    "/auth/demo-login",
    asyncRoute(async (req, res) => {
      const schema = z.object({
        area: z.enum(["admin", "studio", "mobile"]),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid workspace area." });
      }
      const emailMap = {
        admin: "admin@radiohargeysa.so",
        studio: "studio@radiohargeysa.so",
        mobile: "listener@radiohargeysa.so",
      };
      const users = (await listEntity("User")) as DbUser[];
      const user = users.find(
        (u) => u.email.toLowerCase() === emailMap[parsed.data.area]
      );
      if (!user) {
        return res.status(404).json({ error: "Demo account not found." });
      }
      await updateEntity("User", user.id, { last_active_at: new Date().toISOString() });
      const token = signSessionToken(user.id);
      res.json({ token, user: sanitizeUser(user), role: resolveRole(user as any) });
    })
  );

  router.post(
    "/auth/register",
    asyncRoute(async (req, res) => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        full_name: z.string().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "Invalid input" });
      }
      const email = parsed.data.email.trim().toLowerCase();
      const users = (await listEntity("User")) as DbUser[];
      const existing = users.find((u) => u.email.toLowerCase() === email);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const [station, invites] = await Promise.all([
        getPrimaryStation(),
        listEntity("StaffInvitation"),
      ]);
      const invitation = invites.find(
        (inv: any) => inv.email.toLowerCase() === email && inv.status === "PENDING"
      );
      const created = await createEntity(
        "User",
        {
          email,
          password_hash: hashPassword(parsed.data.password),
          full_name: parsed.data.full_name || email.split("@")[0],
          role: "user",
          staff_role: invitation ? invitation.staff_role : null,
          account_status: "ACTIVE",
          station_id: station?.id || null,
          verified: false,
          otp_code: otp,
        },
        "self"
      );
      if (invitation) {
        await updateEntity("StaffInvitation", invitation.id, { status: "ACCEPTED" });
      }
      res.json({
        ok: true,
        email: created.email,
        devOtpHint: otp,
      });
    })
  );

  router.post(
    "/auth/verify-otp",
    asyncRoute(async (req, res) => {
      const schema = z.object({
        email: z.string().email(),
        code: z.string().length(6),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Enter the 6-digit verification code." });
      }
      const email = parsed.data.email.trim().toLowerCase();
      const users = (await listEntity("User")) as DbUser[];
      const user = users.find((u) => u.email.toLowerCase() === email);
      if (!user) {
        return res.status(404).json({ error: "Account not found." });
      }
      if (user.otp_code !== parsed.data.code) {
        return res.status(400).json({ error: "Incorrect verification code." });
      }
      const updated = (await updateEntity("User", user.id, {
        verified: true,
        otp_code: null,
        last_active_at: new Date().toISOString(),
      })) as DbUser;
      const token = signSessionToken(updated.id);
      res.json({ token, user: sanitizeUser(updated), role: resolveRole(updated as any) });
    })
  );

  router.post(
    "/auth/resend-otp",
    asyncRoute(async (req, res) => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const users = (await listEntity("User")) as DbUser[];
      const user = users.find((u) => u.email.toLowerCase() === email);
      if (!user) {
        return res.json({ ok: true });
      }
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      await updateEntity("User", user.id, { otp_code: otp });
      res.json({ ok: true, devOtpHint: otp });
    })
  );

  router.post(
    "/auth/forgot-password",
    asyncRoute(async (req, res) => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const users = (await listEntity("User")) as DbUser[];
      const user = users.find((u) => u.email.toLowerCase() === email);
      if (user) {
        const resetToken = crypto.randomBytes(20).toString("hex");
        await updateEntity("User", user.id, { reset_token: resetToken });
        return res.json({ ok: true, devResetToken: resetToken });
      }
      res.json({ ok: true });
    })
  );

  router.post(
    "/auth/reset-password",
    asyncRoute(async (req, res) => {
      const schema = z.object({
        token: z.string().min(4),
        password: z.string().min(6),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid reset token or password too short." });
      }
      const users = (await listEntity("User")) as DbUser[];
      const user = users.find((u) => u.reset_token === parsed.data.token);
      if (!user) {
        return res.status(400).json({ error: "This reset link is invalid or expired." });
      }
      await updateEntity("User", user.id, {
        password_hash: hashPassword(parsed.data.password),
        reset_token: null,
      });
      res.json({ ok: true });
    })
  );

  router.post("/auth/logout", (_req, res) => {
    res.json({ ok: true });
  });

  // ---------------- PUBLIC CONTENT ----------------
  router.get(
    "/content/home",
    asyncRoute(async (_req, res) => {
      const [onAir, allCategories, allPrograms, allEpisodes, allVideos, allNews, allAds] =
        await Promise.all([
          computeOnAir(),
          listEntity("Category"),
          listEntity("Program"),
          listEntity("Episode"),
          listEntity("Video"),
          listEntity("NewsArticle"),
          listEntity("Advertisement"),
        ]);
      const categoriesList = allCategories
        .filter((c: any) => c.status === "ACTIVE")
        .sort(
          (a: any, b: any) =>
            (a.sort_order ?? 999) - (b.sort_order ?? 999) ||
            String(a.name).localeCompare(String(b.name))
        );
      const programs = allPrograms.filter((p: any) => p.status === "PUBLISHED");
      const featuredPrograms = programs.filter((p: any) => p.is_featured);
      const episodes = allEpisodes.filter((e: any) => e.status === "PUBLISHED");
      const videos = allVideos.filter((v: any) => v.status === "PUBLISHED");
      const news = allNews.filter((n: any) => n.status === "PUBLISHED");
      const popular = [...episodes]
        .sort((a: any, b: any) => (b.play_count || 0) - (a.play_count || 0))
        .slice(0, 10);

      const nowMs = Date.now();
      const parseAdTimestamp = (val?: string | null): number => {
        if (!val) return Number.NaN;
        const trimmed = String(val).trim();
        if (!trimmed) return Number.NaN;
        const hasTz = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
        return Date.parse(hasTz ? trimmed : `${trimmed}+03:00`);
      };
      const activeAds = allAds.filter((ad: any) => {
        if (ad.status !== "ACTIVE") return false;
        if (ad.starts_at) {
          const s = parseAdTimestamp(ad.starts_at);
          if (!Number.isNaN(s) && s > nowMs) return false;
        }
        if (ad.ends_at) {
          const e = parseAdTimestamp(ad.ends_at);
          if (!Number.isNaN(e) && e < nowMs) return false;
        }
        return true;
      });
      const homeAds = activeAds.filter(
        (ad: any) => ad.placement === "MOBILE_HOME" || ad.placement === "LANDING_SLIDES"
      );
      const advertisements = homeAds.length > 0 ? homeAds : activeAds;
      const landingAds =
        activeAds.length > 0
          ? [...activeAds].sort((a: any, b: any) => {
              const rank = (p?: string) =>
                p === "LANDING_SLIDES" ? 0 : p === "MOBILE_HOME" ? 1 : 2;
              return rank(a.placement) - rank(b.placement);
            })
          : [];

      res.json({
        ...onAir,
        categories: categoriesList,
        advertisements,
        landingAds,
        featuredPrograms: featuredPrograms.length ? featuredPrograms : programs.slice(0, 6),
        programs,
        latestEpisodes: episodes.slice(0, 12),
        latestVideos: videos.slice(0, 12),
        latestNews: news.slice(0, 12),
        popular,
      });
    })
  );

  router.get(
    "/content/categories",
    asyncRoute(async (_req, res) => {
      const list = (await listEntity("Category"))
        .filter((c: any) => c.status === "ACTIVE")
        .sort(
          (a: any, b: any) =>
            (a.sort_order ?? 999) - (b.sort_order ?? 999) ||
            String(a.name).localeCompare(String(b.name))
        );
      res.json(list);
    })
  );

  router.post(
    "/content/ads/:id/impression",
    asyncRoute(async (req, res) => {
      const ad = await getEntityById("Advertisement", req.params.id);
      if (!ad) return res.status(404).json({ error: "Advertisement not found" });
      await updateEntity("Advertisement", ad.id, {
        impressions: (ad.impressions || 0) + 1,
      });
      res.json({ ok: true });
    })
  );

  router.post(
    "/content/ads/:id/click",
    asyncRoute(async (req, res) => {
      const ad = await getEntityById("Advertisement", req.params.id);
      if (!ad) return res.status(404).json({ error: "Advertisement not found" });
      await updateEntity("Advertisement", ad.id, {
        clicks: (ad.clicks || 0) + 1,
      });
      res.json({ ok: true });
    })
  );

  router.get(
    "/content/live",
    asyncRoute(async (_req, res) => {
      res.json(await computeOnAir());
    })
  );

  router.get(
    "/content/programs",
    asyncRoute(async (req, res) => {
      const category = String(req.query.category || "").toUpperCase();
      const q = String(req.query.q || "").trim().toLowerCase();
      let list = (await listEntity("Program")).filter((p: any) => p.status === "PUBLISHED");
      if (category && category !== "ALL") {
        list = list.filter((p: any) => p.category === category);
      }
      if (q) {
        list = list.filter(
          (p: any) =>
            p.title?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
        );
      }
      res.json(list.slice(0, 60));
    })
  );

  router.get(
    "/content/programs/:id",
    asyncRoute(async (req, res) => {
      const program = await getEntityById("Program", req.params.id);
      if (!program || program.status !== "PUBLISHED") {
        return res.json(null);
      }
      const [allEpisodes, allSchedules, allPresenters] = await Promise.all([
        listEntity("Episode"),
        listEntity("Schedule"),
        listEntity("Presenter"),
      ]);
      const episodes = allEpisodes.filter(
        (e: any) => e.program_id === program.id && e.status === "PUBLISHED"
      );
      const schedule = allSchedules.filter(
        (s: any) => s.program_id === program.id && s.status !== "CANCELLED"
      );
      const presenters = allPresenters.filter((p: any) =>
        (program.presenter_names || []).includes(p.full_name)
      );
      res.json({ program, episodes, schedule, presenters });
    })
  );

  router.get(
    "/content/episodes",
    asyncRoute(async (req, res) => {
      const programId = String(req.query.programId || "");
      const q = String(req.query.q || "").trim().toLowerCase();
      let list = (await listEntity("Episode")).filter((e: any) => e.status === "PUBLISHED");
      if (programId) list = list.filter((e: any) => e.program_id === programId);
      if (q) {
        list = list.filter(
          (e: any) =>
            e.title?.toLowerCase().includes(q) ||
            e.program_title?.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q)
        );
      }
      res.json(list);
    })
  );

  router.get(
    "/content/episodes/:id",
    asyncRoute(async (req, res) => {
      const episode = await getEntityById("Episode", req.params.id);
      if (!episode || episode.status !== "PUBLISHED") return res.json(null);
      const [program, allEpisodes] = await Promise.all([
        episode.program_id ? getEntityById("Program", episode.program_id) : Promise.resolve(null),
        listEntity("Episode"),
      ]);
      const related = allEpisodes
        .filter((e: any) => e.status === "PUBLISHED" && e.id !== episode.id)
        .slice(0, 6);
      res.json({ episode, program: program || null, related });
    })
  );

  router.get(
    "/content/videos",
    asyncRoute(async (req, res) => {
      const kind = String(req.query.kind || "").toUpperCase();
      const q = String(req.query.q || "").trim().toLowerCase();
      let list = (await listEntity("Video")).filter((v: any) => v.status === "PUBLISHED");
      if (kind && kind !== "ALL") list = list.filter((v: any) => v.kind === kind);
      if (q) {
        list = list.filter((v: any) => v.title?.toLowerCase().includes(q));
      }
      res.json(list);
    })
  );

  router.get(
    "/content/videos/:id",
    asyncRoute(async (req, res) => {
      const video = await getEntityById("Video", req.params.id);
      if (!video || video.status !== "PUBLISHED") return res.json(null);
      const related = (await listEntity("Video"))
        .filter((v: any) => v.status === "PUBLISHED" && v.id !== video.id)
        .slice(0, 6);
      res.json({ video, related });
    })
  );

  router.get(
    "/content/news",
    asyncRoute(async (req, res) => {
      const category = String(req.query.category || "").toUpperCase();
      const q = String(req.query.q || "").trim().toLowerCase();
      let list = (await listEntity("NewsArticle")).filter((n: any) => n.status === "PUBLISHED");
      if (category && category !== "ALL") {
        list = list.filter((n: any) => n.category === category);
      }
      if (q) {
        list = list.filter(
          (n: any) =>
            n.title?.toLowerCase().includes(q) || n.summary?.toLowerCase().includes(q)
        );
      }
      res.json(list);
    })
  );

  router.get(
    "/content/news/:id",
    asyncRoute(async (req, res) => {
      const article = await getEntityById("NewsArticle", req.params.id);
      if (!article || article.status !== "PUBLISHED") return res.json(null);
      const related = (await listEntity("NewsArticle"))
        .filter((n: any) => n.status === "PUBLISHED" && n.id !== article.id)
        .slice(0, 4);
      res.json({ article, related });
    })
  );

  router.get(
    "/content/presenters",
    asyncRoute(async (_req, res) => {
      res.json((await listEntity("Presenter")).filter((p: any) => p.status === "ACTIVE"));
    })
  );

  router.get(
    "/content/presenters/:id",
    asyncRoute(async (req, res) => {
      const presenter = await getEntityById("Presenter", req.params.id);
      if (!presenter) return res.json(null);
      const [allPrograms, allEpisodes, onAir] = await Promise.all([
        listEntity("Program"),
        listEntity("Episode"),
        computeOnAir(),
      ]);
      const programs = allPrograms.filter(
        (p: any) =>
          p.status === "PUBLISHED" &&
          (p.presenter_names || []).includes(presenter.full_name)
      );
      const recentEpisodes = allEpisodes
        .filter(
          (e: any) =>
            e.status === "PUBLISHED" &&
            (e.presenter_names || []).includes(presenter.full_name)
        )
        .slice(0, 8);
      const isLiveNow =
        onAir.currentProgram?.presenter_name === presenter.full_name ||
        onAir.broadcast?.presenter_name === presenter.full_name;
      res.json({ presenter, programs, recentEpisodes, isLiveNow });
    })
  );

  router.get(
    "/content/schedule",
    asyncRoute(async (_req, res) => {
      const [station, allSchedules] = await Promise.all([
        getPrimaryStation(),
        listEntity("Schedule"),
      ]);
      const items = allSchedules.filter(
        (s: any) =>
          (!station || s.station_id === station.id) && s.status !== "CANCELLED"
      );
      res.json({ now: stationNow(), items });
    })
  );

  router.get(
    "/content/search",
    asyncRoute(async (req, res) => {
      const q = String(req.query.q || "").trim().slice(0, 120).toLowerCase();
      if (!q) {
        return res.json({
          programs: [],
          episodes: [],
          videos: [],
          news: [],
          presenters: [],
        });
      }
      const match = (text?: string) => (text || "").toLowerCase().includes(q);
      const [programs, episodes, videos, news, presenters] = await Promise.all([
        listEntity("Program"),
        listEntity("Episode"),
        listEntity("Video"),
        listEntity("NewsArticle"),
        listEntity("Presenter"),
      ]);
      res.json({
        programs: programs
          .filter((p: any) => p.status === "PUBLISHED" && (match(p.title) || match(p.description)))
          .slice(0, 12),
        episodes: episodes
          .filter((e: any) => e.status === "PUBLISHED" && (match(e.title) || match(e.program_title)))
          .slice(0, 12),
        videos: videos
          .filter((v: any) => v.status === "PUBLISHED" && (match(v.title) || match(v.description)))
          .slice(0, 12),
        news: news
          .filter((n: any) => n.status === "PUBLISHED" && (match(n.title) || match(n.summary)))
          .slice(0, 12),
        presenters: presenters
          .filter((p: any) => p.status === "ACTIVE" && (match(p.full_name) || match(p.role_title)))
          .slice(0, 12),
      });
    })
  );

  router.post(
    "/content/track",
    asyncRoute(async (req, res) => {
      const schema = z.object({
        event_type: z.enum([
          "APP_OPEN",
          "LIVE_PLAY",
          "AUDIO_PLAY",
          "VIDEO_PLAY",
          "EPISODE_PLAY",
          "DOWNLOAD",
          "FAVORITE",
          "FOLLOW",
          "SHARE",
          "SEARCH",
          "LISTEN_DURATION",
          "WATCH_DURATION",
        ]),
        item_type: z.string().optional(),
        item_id: z.string().optional(),
        label: z.string().optional(),
        duration_seconds: z.number().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid event" });
      const station = await getPrimaryStation();
      await createEntity(
        "AnalyticsEvent",
        {
          ...parsed.data,
          station_id: station?.id || null,
          platform: "web",
        },
        req.currentUser?.id || "anonymous"
      );
      if (parsed.data.event_type === "EPISODE_PLAY" && parsed.data.item_id) {
        const ep = await getEntityById("Episode", parsed.data.item_id);
        if (ep) {
          await updateEntity("Episode", ep.id, { play_count: (ep.play_count || 0) + 1 });
        }
      }
      res.json({ ok: true });
    })
  );

  // ---------------- LISTENER PERSONAL DATA (OWNER-SCOPED) ----------------
  router.get(
    "/listener/library",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const uid = req.currentUser!.id;
      const [favorites, follows, history, downloads, playlists] = await Promise.all([
        listEntity("Favorite"),
        listEntity("Follow"),
        listEntity("ListeningHistory"),
        listEntity("Download"),
        listEntity("Playlist"),
      ]);
      res.json({
        favorites: favorites.filter((r: any) => r.created_by_id === uid),
        follows: follows.filter((r: any) => r.created_by_id === uid),
        history: history.filter((r: any) => r.created_by_id === uid),
        downloads: downloads.filter((r: any) => r.created_by_id === uid),
        playlists: playlists.filter((r: any) => r.created_by_id === uid),
      });
    })
  );

  router.post(
    "/listener/favorites/toggle",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const schema = z.object({
        item_type: z.enum(["PROGRAM", "EPISODE", "VIDEO", "NEWS", "PRESENTER"]),
        item_id: z.string(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        image_url: z.string().optional(),
        href: z.string().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid favorite" });
      const uid = req.currentUser!.id;
      const existing = (await listEntity("Favorite")).find(
        (f: any) =>
          f.created_by_id === uid &&
          f.item_type === parsed.data.item_type &&
          f.item_id === parsed.data.item_id
      );
      if (existing) {
        await deleteEntity("Favorite", existing.id);
        return res.json({ saved: false });
      }
      const created = await createEntity("Favorite", parsed.data, uid);
      res.json({ saved: true, item: created });
    })
  );

  router.post(
    "/listener/follows/toggle",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const schema = z.object({
        target_type: z.enum(["PROGRAM", "PRESENTER"]),
        target_id: z.string(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        image_url: z.string().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid follow" });
      const uid = req.currentUser!.id;
      const existing = (await listEntity("Follow")).find(
        (f: any) =>
          f.created_by_id === uid &&
          f.target_type === parsed.data.target_type &&
          f.target_id === parsed.data.target_id
      );
      if (existing) {
        await deleteEntity("Follow", existing.id);
        if (parsed.data.target_type === "PROGRAM") {
          const prg = await getEntityById("Program", parsed.data.target_id);
          if (prg) {
            await updateEntity("Program", prg.id, {
              follower_count: Math.max(0, (prg.follower_count || 0) - 1),
            });
          }
        }
        return res.json({ following: false });
      }
      const created = await createEntity("Follow", parsed.data, uid);
      if (parsed.data.target_type === "PROGRAM") {
        const prg = await getEntityById("Program", parsed.data.target_id);
        if (prg) {
          await updateEntity("Program", prg.id, {
            follower_count: (prg.follower_count || 0) + 1,
          });
        }
      }
      res.json({ following: true, item: created });
    })
  );

  router.post(
    "/listener/history",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const schema = z.object({
        item_type: z.enum(["LIVE", "EPISODE", "VIDEO", "NEWS"]),
        item_id: z.string(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        image_url: z.string().optional(),
        href: z.string().optional(),
        progress_seconds: z.number().default(0),
        duration_seconds: z.number().default(0),
        completed: z.boolean().default(false),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid history entry" });
      const uid = req.currentUser!.id;
      const existing = (await listEntity("ListeningHistory")).find(
        (h: any) => h.created_by_id === uid && h.item_id === parsed.data.item_id
      );
      if (existing) {
        const updated = await updateEntity("ListeningHistory", existing.id, {
          ...parsed.data,
          last_played_at: new Date().toISOString(),
        });
        return res.json(updated);
      }
      const created = await createEntity(
        "ListeningHistory",
        { ...parsed.data, last_played_at: new Date().toISOString() },
        uid
      );
      res.json(created);
    })
  );

  router.delete(
    "/listener/history",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      await deleteWhere("ListeningHistory", (r: any) => r.created_by_id === req.currentUser!.id);
      res.json({ ok: true });
    })
  );

  router.post(
    "/listener/downloads",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const schema = z.object({
        item_type: z.enum(["EPISODE", "VIDEO"]),
        item_id: z.string(),
        title: z.string(),
        subtitle: z.string().optional(),
        image_url: z.string().optional(),
        file_uri: z.string().optional(),
        size_mb: z.number().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid download" });
      const uid = req.currentUser!.id;
      const existing = (await listEntity("Download")).find(
        (d: any) => d.created_by_id === uid && d.item_id === parsed.data.item_id
      );
      if (existing) return res.json(existing);
      const created = await createEntity(
        "Download",
        { ...parsed.data, status: "READY", size_mb: parsed.data.size_mb || 14.2 },
        uid
      );
      const ep = await getEntityById("Episode", parsed.data.item_id);
      if (ep) await updateEntity("Episode", ep.id, { download_count: (ep.download_count || 0) + 1 });
      res.json(created);
    })
  );

  router.delete(
    "/listener/downloads/:id",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const row = await getEntityById("Download", req.params.id);
      if (row && row.created_by_id === req.currentUser!.id) {
        await deleteEntity("Download", row.id);
      }
      res.json({ ok: true });
    })
  );

  router.delete(
    "/listener/downloads",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      await deleteWhere("Download", (r: any) => r.created_by_id === req.currentUser!.id);
      res.json({ ok: true });
    })
  );

  router.post(
    "/listener/playlists",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const schema = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Playlist name is required" });
      const created = await createEntity(
        "Playlist",
        { ...parsed.data, items: [] },
        req.currentUser!.id
      );
      res.json(created);
    })
  );

  router.post(
    "/listener/playlists/:id/items",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const pl = await getEntityById("Playlist", req.params.id);
      if (!pl || pl.created_by_id !== req.currentUser!.id) {
        return res.status(404).json({ error: "Playlist not found" });
      }
      const items = Array.isArray(pl.items) ? [...pl.items] : [];
      const { item_id, title, subtitle } = req.body || {};
      if (!item_id) return res.status(400).json({ error: "Missing item_id" });
      if (!items.find((i: any) => i.item_id === item_id)) {
        items.push({ item_id, title: title || "Episode", subtitle: subtitle || "" });
      }
      const updated = await updateEntity("Playlist", pl.id, { items });
      res.json(updated);
    })
  );

  router.delete(
    "/listener/playlists/:id",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const pl = await getEntityById("Playlist", req.params.id);
      if (pl && pl.created_by_id === req.currentUser!.id) {
        await deleteEntity("Playlist", pl.id);
      }
      res.json({ ok: true });
    })
  );

  router.get(
    "/listener/preferences",
    asyncRoute(async (req, res) => {
      if (!req.currentUser) return res.json(null);
      const pref = (await listEntity("AppPreference")).find(
        (p: any) => p.created_by_id === req.currentUser!.id
      );
      res.json(pref || null);
    })
  );

  router.put(
    "/listener/preferences",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const uid = req.currentUser!.id;
      const existing = (await listEntity("AppPreference")).find(
        (p: any) => p.created_by_id === uid
      );
      if (existing) {
        const updated = await updateEntity("AppPreference", existing.id, req.body || {});
        return res.json(updated);
      }
      const created = await createEntity(
        "AppPreference",
        {
          language: "so",
          interests: [],
          data_saver: false,
          audio_quality: "AUTO",
          video_quality: "AUTO",
          autoplay: true,
          notify_live: true,
          notify_news: true,
          notify_programs: true,
          notify_episodes: true,
          notify_videos: true,
          onboarded: false,
          ...(req.body || {}),
        },
        uid
      );
      res.json(created);
    })
  );

  router.get(
    "/listener/notifications",
    asyncRoute(async (req, res) => {
      const uid = req.currentUser?.id;
      const rows = (await listEntity("Notification")).filter(
        (n: any) => n.user_id === null || (uid && n.user_id === uid)
      );
      res.json(rows);
    })
  );

  router.post(
    "/listener/notifications/read-all",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const uid = req.currentUser!.id;
      const all = await listEntity("Notification");
      await Promise.all(
        all
          .filter((n: any) => n.user_id === null || n.user_id === uid)
          .map((n: any) => updateEntity("Notification", n.id, { is_read: true }))
      );
      res.json({ ok: true });
    })
  );

  router.post(
    "/listener/notifications/:id/read",
    requireAuth as any,
    asyncRoute(async (req, res) => {
      const n = await getEntityById("Notification", req.params.id);
      if (n && (n.user_id === null || n.user_id === req.currentUser!.id)) {
        await updateEntity("Notification", n.id, { is_read: true });
      }
      res.json({ ok: true });
    })
  );

  // ---------------- STUDIO ----------------
  router.get(
    "/studio/overview",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      const [onAir, episodes, recordings, videos, news, jobs, streams, events, broadcasts, notifs] =
        await Promise.all([
          computeOnAir(),
          listEntity("Episode"),
          listEntity("Recording"),
          listEntity("Video"),
          listEntity("NewsArticle"),
          listEntity("AiJob"),
          listEntity("LiveStream"),
          listEntity("AnalyticsEvent"),
          listEntity("Broadcast"),
          listEntity("Notification"),
        ]);

      const buildTrend = (days: number) => {
        const out: Array<{ day: string; listeners: number; streams: number }> = [];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const isoDate = d.toISOString().slice(0, 10);
          const dayLabel =
            days <= 7
              ? dayNames[d.getDay()]
              : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const dayEvents = events.filter((e: any) =>
            String(e.created_date || "").startsWith(isoDate)
          );
          const dayBroadcasts = broadcasts.filter((b: any) =>
            String(b.started_at || b.created_date || "").startsWith(isoDate)
          );
          const playEvents = dayEvents.filter((e: any) =>
            ["LIVE_PLAY", "AUDIO_PLAY", "EPISODE_PLAY", "VIDEO_PLAY", "APP_OPEN"].includes(
              e.event_type
            )
          ).length;
          const streamHits = dayBroadcasts.length + dayEvents.filter((e: any) => e.event_type === "LIVE_PLAY").length;
          out.push({
            day: dayLabel,
            listeners: playEvents,
            streams: streamHits,
          });
        }
        return out;
      };

      const queuedEpisodes = episodes
        .filter((e: any) => ["DRAFT", "PENDING_APPROVAL", "SCHEDULED"].includes(e.status))
        .slice(0, 5)
        .map((e: any) => ({
          id: e.id,
          time: e.published_at
            ? new Date(e.published_at).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Queued",
          title: e.title,
          subtitle: e.program_title || "Episode Production",
          status: e.status === "DRAFT" ? "Draft" : e.status === "PENDING_APPROVAL" ? "Approval" : "Queued",
          to: `/studio/episodes`,
        }));

      const scheduleQueue = (onAir.todaySchedule || []).slice(0, 5).map((s: any) => ({
        id: s.id,
        time: s.start_time,
        title: s.program_title,
        subtitle: s.presenter_name || s.studio || "Studio 1",
        status: "Queued",
        to: `/studio/schedule`,
      }));

      res.json({
        ...onAir,
        role: req.currentRole,
        streams,
        recentRecordings: recordings.slice(0, 4),
        productionQueue: queuedEpisodes.length > 0 ? queuedEpisodes : scheduleQueue,
        broadcastTrend7: buildTrend(7),
        broadcastTrend30: buildTrend(30),
        unreadNotifications: notifs.filter((n: any) => !n.is_read).length,
        counts: {
          episodes: episodes.length,
          publishedEpisodes: episodes.filter((e: any) => e.status === "PUBLISHED").length,
          drafts: episodes.filter((e: any) => e.status === "DRAFT").length,
          pendingApproval: episodes.filter((e: any) => e.status === "PENDING_APPROVAL").length,
          scheduled: episodes.filter((e: any) => e.status === "SCHEDULED").length,
          recordings: recordings.length,
          videos: videos.length,
          news: news.length,
          publishedNews: news.filter((n: any) => n.status === "PUBLISHED").length,
          pendingAi: jobs.filter((j: any) => j.status === "COMPLETE").length,
          runningAi: jobs.filter((j: any) => j.status === "PROCESSING" || j.status === "QUEUED")
            .length,
        },
      });
    })
  );

  router.post(
    "/studio/broadcast/start",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      const isEmergency = Boolean(req.body?.is_emergency);
      const perm = isEmergency ? "broadcast.emergency" : "broadcast.control";
      if (!assertPermission(req.currentRole, perm, res)) return;

      const existing = (await listEntity("Broadcast")).find(
        (b: any) => b.status === "LIVE" || b.status === "PAUSED" || b.status === "EMERGENCY"
      );
      if (existing) {
        return res.status(409).json({
          error: "A broadcast is already live. Stop it first.",
        });
      }

      const [station, streams] = await Promise.all([
        getPrimaryStation(),
        listEntity("LiveStream"),
      ]);
      const audioStream = streams.find((s: any) => s.kind === "AUDIO");
      const programTitle = String(req.body?.program_title || "").trim();
      if (!programTitle) {
        return res.status(400).json({ error: "Program or broadcast title is required." });
      }

      const nowIso = new Date().toISOString();
      const broadcast = await createEntity(
        "Broadcast",
        {
          station_id: station?.id || null,
          program_id: req.body?.program_id || null,
          program_title: programTitle,
          presenter_name: req.body?.presenter_name || req.currentUser!.full_name,
          stream_id: audioStream?.id || null,
          status: isEmergency ? "EMERGENCY" : "LIVE",
          started_at: nowIso,
          ended_at: null,
          duration_seconds: 0,
          listener_count: audioStream?.listener_count || 18,
          listener_peak: audioStream?.listener_count || 18,
          is_emergency: isEmergency,
          recording_status: "RECORDING",
          notes: req.body?.notes || "",
          started_by: req.currentUser!.email,
        },
        req.currentUser!.id
      );

      if (audioStream) {
        await updateEntity("LiveStream", audioStream.id, {
          status: "LIVE",
          recording_status: "RECORDING",
          listener_count: broadcast.listener_count,
        });
      }

      if (isEmergency && req.body?.send_notification) {
        await createEntity(
          "Notification",
          {
            type: "LIVE_STARTED",
            title: `Emergency Broadcast: ${programTitle}`,
            body: req.body?.notes || "Tune in to Radio Hargeysa for an urgent broadcast.",
            href: "/mobile/live",
            station_id: station?.id || null,
            user_id: null,
            is_read: false,
          },
          req.currentUser!.id
        );
      }

      await audit(
        req,
        isEmergency ? "EMERGENCY_BROADCAST_STARTED" : "BROADCAST_STARTED",
        "Broadcast",
        broadcast.id,
        programTitle
      );
      res.json(broadcast);
    })
  );

  router.post(
    "/studio/broadcast/:id/pause",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "broadcast.control", res)) return;
      const b = await getEntityById("Broadcast", req.params.id);
      if (!b) return res.status(404).json({ error: "Broadcast not found" });
      const updated = await updateEntity("Broadcast", b.id, { status: "PAUSED" });
      if (b.stream_id) await updateEntity("LiveStream", b.stream_id, { status: "PAUSED" });
      await audit(req, "BROADCAST_PAUSED", "Broadcast", b.id, b.program_title);
      res.json(updated);
    })
  );

  router.post(
    "/studio/broadcast/:id/resume",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "broadcast.control", res)) return;
      const b = await getEntityById("Broadcast", req.params.id);
      if (!b) return res.status(404).json({ error: "Broadcast not found" });
      const status = b.is_emergency ? "EMERGENCY" : "LIVE";
      const updated = await updateEntity("Broadcast", b.id, { status });
      if (b.stream_id) await updateEntity("LiveStream", b.stream_id, { status: "LIVE" });
      await audit(req, "BROADCAST_RESUMED", "Broadcast", b.id, b.program_title);
      res.json(updated);
    })
  );

  router.post(
    "/studio/broadcast/:id/stop",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "broadcast.control", res)) return;
      const b = await getEntityById("Broadcast", req.params.id);
      if (!b) return res.status(404).json({ error: "Broadcast not found" });
      const endedAt = new Date().toISOString();
      const durationSeconds = Math.max(
        1,
        Math.floor((Date.now() - new Date(b.started_at).getTime()) / 1000)
      );
      const updated = await updateEntity("Broadcast", b.id, {
        status: "ENDED",
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        recording_status: "SAVED",
      });
      if (b.stream_id) {
        await updateEntity("LiveStream", b.stream_id, {
          status: "OFFLINE",
          recording_status: "IDLE",
        });
      }
      const rec = await createEntity(
        "Recording",
        {
          station_id: b.station_id,
          broadcast_id: b.id,
          program_id: b.program_id,
          program_title: b.program_title,
          title: `${b.program_title} — Live Recording`,
          file_uri: "",
          duration_seconds: durationSeconds,
          size_mb: Number(((durationSeconds * 8) / 1024).toFixed(2)) || 0.4,
          status: "SAVED",
          is_automatic: true,
          episode_id: null,
        },
        req.currentUser!.id
      );
      await audit(req, "BROADCAST_STOPPED", "Broadcast", b.id, b.program_title);
      res.json({ broadcast: updated, recording: rec });
    })
  );

  router.get(
    "/studio/broadcast/history",
    requireStaff as any,
    asyncRoute(async (_req, res) => {
      res.json(await listEntity("Broadcast"));
    })
  );

  router.get(
    "/studio/streams",
    requireStaff as any,
    asyncRoute(async (_req, res) => {
      res.json(await listEntity("LiveStream"));
    })
  );

  router.post(
    "/studio/streams/save",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "streams.manage", res)) return;
      const schema = z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        kind: z.enum(["AUDIO", "VIDEO"]),
        primary_url: z.string().optional().default(""),
        backup_url: z.string().optional().default(""),
        hls_output_url: z.string().optional().default(""),
        rtmp_ingest_url: z.string().optional().default(""),
        bitrate_kbps: z.coerce.number().min(16).max(10000).default(64),
        codec: z.string().default("AAC"),
        provider: z.string().default("icecast"),
        is_primary: z.boolean().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "Invalid stream fields" });
      }
      const urlFields = [
        parsed.data.primary_url,
        parsed.data.backup_url,
        parsed.data.hls_output_url,
      ].filter(Boolean);
      for (const u of urlFields) {
        if (!/^https?:\/\/.+/.test(u)) {
          return res
            .status(400)
            .json({ error: `Stream URL must start with http:// or https:// (${u})` });
        }
      }
      if (parsed.data.rtmp_ingest_url && !/^rtmps?:\/\/.+/.test(parsed.data.rtmp_ingest_url)) {
        return res
          .status(400)
          .json({ error: "RTMP ingest URL must start with rtmp:// or rtmps://" });
      }

      const station = await getPrimaryStation();
      if (parsed.data.id) {
        const updated = await updateEntity("LiveStream", parsed.data.id, {
          ...parsed.data,
          is_placeholder: !parsed.data.primary_url,
        });
        await audit(req, "STREAM_UPDATED", "LiveStream", parsed.data.id, parsed.data.name);
        return res.json(updated);
      }
      const created = await createEntity(
        "LiveStream",
        {
          station_id: station?.id || null,
          ...parsed.data,
          qualities:
            parsed.data.kind === "AUDIO" ? ["32", "64", "128"] : ["360", "720", "1080"],
          status: "OFFLINE",
          health: "GOOD",
          listener_count: 0,
          viewer_count: 0,
          latency_ms: 0,
          uptime_seconds: 0,
          backup_status: parsed.data.backup_url ? "READY" : "OFFLINE",
          recording_status: "IDLE",
          is_placeholder: !parsed.data.primary_url,
        },
        req.currentUser!.id
      );
      await audit(req, "STREAM_CREATED", "LiveStream", created.id, created.name);
      res.json(created);
    })
  );

  router.get(
    "/studio/production",
    requireStaff as any,
    asyncRoute(async (_req, res) => {
      const [
        programs,
        episodes,
        recordings,
        videos,
        news,
        presenters,
        media,
        schedules,
        jobs,
        clips,
        notifications,
        stations,
        broadcasts,
      ] = await Promise.all([
        listEntity("Program"),
        listEntity("Episode"),
        listEntity("Recording"),
        listEntity("Video"),
        listEntity("NewsArticle"),
        listEntity("Presenter"),
        listEntity("MediaAsset"),
        listEntity("Schedule"),
        listEntity("AiJob"),
        listEntity("MediaClip"),
        listEntity("Notification"),
        listEntity("Station"),
        listEntity("Broadcast"),
      ]);
      res.json({
        programs,
        episodes,
        recordings,
        videos,
        news,
        presenters,
        media,
        schedules,
        jobs,
        clips,
        notifications,
        stations,
        broadcasts,
      });
    })
  );

  router.post(
    "/studio/upload-file",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "content.write", res)) return;
      const { filename, dataUrl } = req.body || {};
      if (!filename || !dataUrl || typeof dataUrl !== "string") {
        return res.status(400).json({ error: "Missing file data" });
      }
      const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: "Invalid file encoding" });
      }
      const buf = Buffer.from(match[2], "base64");
      const safeName = `${Date.now()}_${String(filename).replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, safeName), buf);
      res.json({
        url: `/uploads/${safeName}`,
        size_mb: Number((buf.length / (1024 * 1024)).toFixed(2)),
      });
    })
  );

  router.post(
    "/studio/episodes",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      const status = req.body?.status || "DRAFT";
      const needPublish = status === "PUBLISHED" || status === "SCHEDULED";
      if (!assertPermission(req.currentRole, needPublish ? "content.publish" : "content.write", res)) {
        return;
      }
      const schema = z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional().default(""),
        program_id: z.string().optional().nullable(),
        program_title: z.string().optional().default(""),
        presenter_names: z.array(z.string()).optional().default([]),
        category: z.string().optional().default("NEWS"),
        language: z.string().optional().default("so"),
        tags: z.array(z.string()).optional().default([]),
        cover_url: z.string().optional().default("/media/radio-studio.jpg"),
        audio_url: z.string().optional().default(""),
        duration_seconds: z.coerce.number().optional().default(0),
        download_allowed: z.boolean().optional().default(true),
        status: z.string().optional().default("DRAFT"),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "Invalid episode data" });
      }
      const [station, program] = await Promise.all([
        getPrimaryStation(),
        parsed.data.program_id ? getEntityById("Program", parsed.data.program_id) : Promise.resolve(null),
      ]);
      const ep = await createEntity(
        "Episode",
        {
          station_id: station?.id || null,
          ...parsed.data,
          program_title: program?.title || parsed.data.program_title || "Unassigned",
          cover_url: parsed.data.cover_url || program?.cover_url || "/media/radio-studio.jpg",
          published_at: status === "PUBLISHED" ? new Date().toISOString() : null,
          transcript: "",
          summary: "",
          chapters: [],
          play_count: 0,
          download_count: 0,
        },
        req.currentUser!.id
      );
      if (ep.audio_url) {
        await createEntity(
          "MediaAsset",
          {
            station_id: station?.id || null,
            title: ep.title,
            type: "AUDIO",
            file_uri: ep.audio_url,
            program_id: ep.program_id,
            program_title: ep.program_title,
            presenter_name: ep.presenter_names?.[0] || "",
            duration_seconds: ep.duration_seconds,
            size_mb: 12.4,
            status: "READY",
            tags: ep.tags,
            uploaded_by: req.currentUser!.email,
          },
          req.currentUser!.id
        );
      }
      await audit(req, `EPISODE_${ep.status}`, "Episode", ep.id, ep.title);
      res.json(ep);
    })
  );

  router.post(
    "/studio/episodes/:id/status",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      const status = String(req.body?.status || "");
      const needPublish = status === "PUBLISHED" || status === "SCHEDULED";
      if (!assertPermission(req.currentRole, needPublish ? "content.publish" : "content.write", res)) {
        return;
      }
      const ep = await getEntityById("Episode", req.params.id);
      if (!ep) return res.status(404).json({ error: "Episode not found" });
      const updated = await updateEntity("Episode", ep.id, {
        status,
        published_at:
          status === "PUBLISHED" ? ep.published_at || new Date().toISOString() : ep.published_at,
      });
      await audit(req, `EPISODE_${status}`, "Episode", ep.id, ep.title);
      res.json(updated);
    })
  );

  router.post(
    "/studio/videos",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      const status = req.body?.status || "DRAFT";
      const needPublish = status === "PUBLISHED" || status === "SCHEDULED";
      if (!assertPermission(req.currentRole, needPublish ? "content.publish" : "content.write", res)) {
        return;
      }
      const schema = z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional().default(""),
        program_id: z.string().optional().nullable(),
        program_title: z.string().optional().default(""),
        thumbnail_url: z.string().optional().default("/media/radio-studio.jpg"),
        video_url: z.string().optional().default(""),
        kind: z.enum(["LIVE", "RECORDED", "INTERVIEW", "NEWS", "STUDIO"]).default("RECORDED"),
        duration_seconds: z.coerce.number().optional().default(0),
        status: z.string().optional().default("DRAFT"),
        tags: z.array(z.string()).optional().default([]),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "Invalid video data" });
      }
      const [station, program] = await Promise.all([
        getPrimaryStation(),
        parsed.data.program_id ? getEntityById("Program", parsed.data.program_id) : Promise.resolve(null),
      ]);
      const vid = await createEntity(
        "Video",
        {
          station_id: station?.id || null,
          ...parsed.data,
          program_title: program?.title || parsed.data.program_title || "",
          published_at: status === "PUBLISHED" ? new Date().toISOString() : null,
          view_count: 0,
        },
        req.currentUser!.id
      );
      await audit(req, `VIDEO_${vid.status}`, "Video", vid.id, vid.title);
      res.json(vid);
    })
  );

  router.post(
    "/studio/news",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      const status = req.body?.status || "DRAFT";
      const needPublish = status === "PUBLISHED" || status === "SCHEDULED";
      if (!assertPermission(req.currentRole, needPublish ? "content.publish" : "content.write", res)) {
        return;
      }
      const schema = z.object({
        title: z.string().min(1, "Headline is required"),
        category: z.string().min(1, "Category is required"),
        summary: z.string().optional().default(""),
        body: z.string().optional().default(""),
        image_url: z.string().optional().default("/media/hargeisa-sunset.jpg"),
        audio_url: z.string().optional().default(""),
        is_breaking: z.boolean().optional().default(false),
        status: z.string().optional().default("DRAFT"),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "Invalid news story" });
      }
      const station = await getPrimaryStation();
      const article = await createEntity(
        "NewsArticle",
        {
          station_id: station?.id || null,
          ...parsed.data,
          slug: parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          author: req.currentUser!.full_name || "Radio Hargeysa Newsroom",
          language: "en",
          published_at: status === "PUBLISHED" ? new Date().toISOString() : null,
          view_count: 0,
        },
        req.currentUser!.id
      );
      await audit(req, `NEWS_${article.status}`, "NewsArticle", article.id, article.title);
      res.json(article);
    })
  );

  router.post(
    "/studio/programs",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "programs.manage", res)) return;
      const schema = z.object({
        title: z.string().min(1, "Title is required"),
        category: z.string().min(1),
        description: z.string().optional().default(""),
        presenter_names: z.array(z.string()).optional().default([]),
        schedule_text: z.string().optional().default(""),
        cover_url: z.string().optional().default("/media/radio-studio.jpg"),
        language: z.string().optional().default("so"),
        is_featured: z.boolean().optional().default(false),
        status: z.string().optional().default("DRAFT"),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid program" });
      }
      const station = await getPrimaryStation();
      const prg = await createEntity(
        "Program",
        {
          station_id: station?.id || null,
          ...parsed.data,
          slug: parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          follower_count: 0,
        },
        req.currentUser!.id
      );
      await audit(req, "PROGRAM_CREATED", "Program", prg.id, prg.title);
      res.json(prg);
    })
  );

  router.post(
    "/studio/presenters",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "content.write", res)) return;
      const schema = z.object({
        full_name: z.string().min(1, "Full name is required"),
        role_title: z.string().optional().default("Presenter"),
        bio: z.string().optional().default(""),
        photo_url: z.string().optional().default("/media/radio-studio.jpg"),
        email: z.string().optional().default(""),
        program_titles: z.array(z.string()).optional().default([]),
        languages: z.array(z.string()).optional().default(["so"]),
        years_at_station: z.coerce.number().optional().default(1),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "Invalid presenter" });
      }
      const station = await getPrimaryStation();
      const prs = await createEntity(
        "Presenter",
        { station_id: station?.id || null, ...parsed.data },
        req.currentUser!.id
      );
      await audit(req, "PRESENTER_CREATED", "Presenter", prs.id, prs.full_name);
      res.json(prs);
    })
  );

  router.post(
    "/studio/schedule",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "schedules.manage", res)) return;
      const schema = z.object({
        program_id: z.string().optional().nullable(),
        program_title: z.string().min(1, "Program is required"),
        presenter_name: z.string().optional().default(""),
        day_of_week: z.string().min(1),
        start_time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
        end_time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
        studio: z.string().optional().default("Studio 1"),
        is_recurring: z.boolean().optional().default(true),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid slot" });
      }
      const station = await getPrimaryStation();
      const slot = await createEntity(
        "Schedule",
        { station_id: station?.id || null, ...parsed.data, status: "SCHEDULED" },
        req.currentUser!.id
      );
      await audit(req, "SCHEDULE_SLOT_ADDED", "Schedule", slot.id, `${slot.day_of_week} ${slot.start_time}`);
      res.json(slot);
    })
  );

  router.post(
    "/studio/media/upload",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "media.manage", res)) return;
      const schema = z.object({
        title: z.string().min(1),
        type: z.enum([
          "AUDIO",
          "VIDEO",
          "IMAGE",
          "RECORDING",
          "CLIP",
          "THUMBNAIL",
          "DOCUMENT",
        ]),
        file_uri: z.string().min(1),
        program_id: z.string().optional().nullable(),
        program_title: z.string().optional().default(""),
        presenter_name: z.string().optional().default(""),
        duration_seconds: z.coerce.number().optional().default(0),
        size_mb: z.coerce.number().optional().default(0),
        tags: z.array(z.string()).optional().default([]),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "Invalid media asset" });
      }
      const station = await getPrimaryStation();
      const asset = await createEntity(
        "MediaAsset",
        {
          station_id: station?.id || null,
          ...parsed.data,
          status: "READY",
          uploaded_by: req.currentUser!.email,
        },
        req.currentUser!.id
      );
      await audit(req, "MEDIA_UPLOADED", "MediaAsset", asset.id, asset.title);
      res.json(asset);
    })
  );

  router.post(
    "/studio/recordings/:id/to-episode",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "content.write", res)) return;
      const rec = await getEntityById("Recording", req.params.id);
      if (!rec) return res.status(404).json({ error: "Recording not found" });
      const ep = await createEntity(
        "Episode",
        {
          station_id: rec.station_id,
          program_id: rec.program_id,
          program_title: rec.program_title,
          title: rec.title.replace(" — Live Recording", ""),
          description: `Recorded broadcast from ${rec.program_title}.`,
          cover_url: "/media/radio-studio.jpg",
          audio_url: rec.file_uri || "",
          duration_seconds: rec.duration_seconds || 0,
          presenter_names: [],
          category: "NEWS",
          language: "so",
          tags: ["recording"],
          status: "DRAFT",
          download_allowed: true,
          source_recording_id: rec.id,
          play_count: 0,
          download_count: 0,
        },
        req.currentUser!.id
      );
      await updateEntity("Recording", rec.id, { episode_id: ep.id, status: "PROCESSED" });
      await audit(req, "RECORDING_TO_EPISODE", "Episode", ep.id, ep.title);
      res.json(ep);
    })
  );

  // AI Operations
  router.post(
    "/studio/ai/run",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "ai.run", res)) return;
      const schema = z.object({
        kind: z.enum([
          "TRANSCRIPT",
          "SUMMARY",
          "CHAPTERS",
          "TITLE",
          "DESCRIPTION",
          "KEYWORDS",
          "CAPTION",
        ]),
        target_type: z.enum(["EPISODE", "RECORDING", "VIDEO", "NEWS"]),
        target_id: z.string().min(1),
        language: z.enum(["so", "en", "ar"]).default("so"),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Select a valid tool and target item." });
      }
      const entityMap: Record<string, EntityName> = {
        EPISODE: "Episode",
        RECORDING: "Recording",
        VIDEO: "Video",
        NEWS: "NewsArticle",
      };
      const target = await getEntityById(entityMap[parsed.data.target_type], parsed.data.target_id);
      if (!target) {
        return res.status(404).json({ error: "Target record not found." });
      }

      const station = await getPrimaryStation();
      const job = await createEntity(
        "AiJob",
        {
          station_id: station?.id || null,
          ...parsed.data,
          target_title: target.title || "Untitled",
          status: "PROCESSING",
          output: "",
          approved_by: null,
          approved_at: null,
        },
        req.currentUser!.id
      );

      try {
        const output = await runStudioAiTask({
          kind: parsed.data.kind,
          targetType: parsed.data.target_type,
          targetTitle: target.title,
          targetDescription: target.description || target.summary || target.body,
          transcript: target.transcript,
          language: parsed.data.language,
        });
        const done = await updateEntity("AiJob", job.id, {
          status: "COMPLETE",
          output,
        });
        await audit(req, "AI_JOB_COMPLETE", "AiJob", job.id, `${parsed.data.kind} on ${target.title}`);
        res.json(done);
      } catch (err: any) {
        const failed = await updateEntity("AiJob", job.id, {
          status: "ERROR",
          output: err?.message || "AI execution failed",
        });
        res.status(500).json({ error: err?.message || "AI job failed", job: failed });
      }
    })
  );

  router.post(
    "/studio/ai/:id/approve",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "ai.approve", res)) return;
      const job = await getEntityById("AiJob", req.params.id);
      if (!job) return res.status(404).json({ error: "AI job not found" });

      const entityMap: Record<string, EntityName> = {
        EPISODE: "Episode",
        RECORDING: "Recording",
        VIDEO: "Video",
        NEWS: "NewsArticle",
      };
      const entityName = entityMap[job.target_type];
      if (entityName && job.target_id) {
        const target = await getEntityById(entityName, job.target_id);
        if (target) {
          const patch: Record<string, any> = {};
          if (job.kind === "TRANSCRIPT") patch.transcript = job.output;
          else if (job.kind === "SUMMARY") patch.summary = job.output;
          else if (job.kind === "DESCRIPTION") patch.description = job.output;
          else if (job.kind === "KEYWORDS") {
            patch.tags = String(job.output)
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
          } else if (job.kind === "CHAPTERS") {
            patch.chapters = String(job.output)
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => {
                const [time, ...rest] = line.split("-");
                return { time: (time || "").trim(), title: rest.join("-").trim() || line };
              });
          }
          if (Object.keys(patch).length > 0) {
            await updateEntity(entityName, target.id, patch);
          }
        }
      }

      const updated = await updateEntity("AiJob", job.id, {
        status: "APPROVED",
        approved_by: req.currentUser!.email,
        approved_at: new Date().toISOString(),
      });
      await audit(req, "AI_JOB_APPROVED", "AiJob", job.id, job.kind);
      res.json(updated);
    })
  );

  router.post(
    "/studio/ai/:id/reject",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "ai.approve", res)) return;
      const job = await getEntityById("AiJob", req.params.id);
      if (!job) return res.status(404).json({ error: "AI job not found" });
      const updated = await updateEntity("AiJob", job.id, { status: "REJECTED" });
      await audit(req, "AI_JOB_REJECTED", "AiJob", job.id, job.kind);
      res.json(updated);
    })
  );

  router.post(
    "/studio/notifications/broadcast",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "notifications.send", res)) return;
      const schema = z.object({
        type: z.enum([
          "LIVE_STARTED",
          "NEW_EPISODE",
          "NEW_VIDEO",
          "BREAKING_NEWS",
          "PROGRAM_STARTING",
          "NEW_PROGRAM",
          "AI_PROCESSING_COMPLETE",
        ]),
        title: z.string().min(1, "Title is required"),
        body: z.string().optional().default(""),
        href: z.string().optional().default("/mobile/home"),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "Invalid notification" });
      }
      const station = await getPrimaryStation();
      const n = await createEntity(
        "Notification",
        {
          ...parsed.data,
          station_id: station?.id || null,
          user_id: null,
          is_read: false,
        },
        req.currentUser!.id
      );
      await audit(req, "NOTIFICATION_BROADCAST", "Notification", n.id, n.title);
      res.json(n);
    })
  );

  router.get(
    "/studio/analytics",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      const days = Math.min(180, Math.max(1, Number(req.query.days) || 14));
      const [events, episodes, jobs] = await Promise.all([
        listEntity("AnalyticsEvent"),
        listEntity("Episode"),
        listEntity("AiJob"),
      ]);
      const series = buildDailySeries(days, events);
      const topEpisodes = [...episodes]
        .sort((a: any, b: any) => (b.play_count || 0) - (a.play_count || 0))
        .slice(0, 8);
      res.json({
        days,
        totals: {
          plays: events.filter((e: any) => e.event_type.includes("PLAY")).length,
          downloads: events.filter((e: any) => e.event_type === "DOWNLOAD").length,
          aiApproved: jobs.filter((j: any) => j.status === "APPROVED").length,
          episodesCount: episodes.length,
        },
        series,
        topEpisodes,
        events: events.slice(0, 120),
      });
    })
  );

  router.get(
    "/studio/record/:entity",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      const entity = req.params.entity as EntityName;
      if (!WHITELISTED_STUDIO_ENTITIES.has(entity)) {
        return res.status(400).json({ error: "Entity cannot be listed here." });
      }
      res.json(await listEntity(entity));
    })
  );

  router.post(
    "/studio/record/:entity",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "content.write", res)) return;
      const entity = req.params.entity as EntityName;
      if (!WHITELISTED_STUDIO_ENTITIES.has(entity)) {
        return res.status(400).json({ error: "Entity cannot be created here." });
      }
      const station = await getPrimaryStation();
      const payload: Record<string, any> = {
        ...(req.body || {}),
      };
      if (!("station_id" in payload) && entity !== "Station") {
        payload.station_id = station?.id || null;
      }
      if (entity === "Broadcast" && !payload.started_at) {
        payload.started_at = new Date().toISOString();
      }
      if (entity === "Broadcast" && !payload.started_by) {
        payload.started_by = req.currentUser!.email;
      }
      const created = await createEntity(entity, payload, req.currentUser!.id);
      await audit(
        req,
        `${entity.toUpperCase()}_CREATED`,
        entity,
        created.id,
        created.title || created.name || created.program_title || ""
      );
      res.json(created);
    })
  );

  router.patch(
    "/studio/record/:entity/:id",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "content.write", res)) return;
      const entity = req.params.entity as EntityName;
      if (!WHITELISTED_STUDIO_ENTITIES.has(entity)) {
        return res.status(400).json({ error: "Entity cannot be edited here." });
      }
      const updated = await updateEntity(entity, req.params.id, req.body || {});
      if (!updated) return res.status(404).json({ error: "Record not found" });
      await audit(
        req,
        `${entity.toUpperCase()}_UPDATED`,
        entity,
        req.params.id,
        updated.title || updated.name || updated.program_title || ""
      );
      res.json(updated);
    })
  );

  router.delete(
    "/studio/record/:entity/:id",
    requireStaff as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "content.write", res)) return;
      const entity = req.params.entity as EntityName;
      if (!WHITELISTED_STUDIO_ENTITIES.has(entity)) {
        return res.status(400).json({ error: "Entity cannot be deleted here." });
      }
      const ok = await deleteEntity(entity, req.params.id);
      if (!ok) return res.status(404).json({ error: "Record not found" });
      await audit(req, `${entity.toUpperCase()}_DELETED`, entity, req.params.id);
      res.json({ ok: true });
    })
  );

  // ---------------- ADMIN ----------------
  router.get(
    "/admin/overview",
    requireAdmin as any,
    asyncRoute(async (_req, res) => {
      const [
        onAir,
        programs,
        episodes,
        videos,
        news,
        presenters,
        users,
        streams,
        broadcasts,
        events,
        favorites,
        follows,
        downloads,
        ads,
        auditLogsAll,
        recordings,
        jobs,
        categories,
        notifs,
      ] = await Promise.all([
        computeOnAir(),
        listEntity("Program"),
        listEntity("Episode"),
        listEntity("Video"),
        listEntity("NewsArticle"),
        listEntity("Presenter"),
        listEntity("User"),
        listEntity("LiveStream"),
        listEntity("Broadcast"),
        listEntity("AnalyticsEvent"),
        listEntity("Favorite"),
        listEntity("Follow"),
        listEntity("Download"),
        listEntity("Advertisement"),
        listEntity("AuditLog"),
        listEntity("Recording"),
        listEntity("AiJob"),
        listEntity("Category"),
        listEntity("Notification"),
      ]);

      const buildTrend = (days: number) => {
        const out: Array<{ day: string; listeners: number; streams: number }> = [];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const isoDate = d.toISOString().slice(0, 10);
          const dayLabel =
            days <= 7
              ? dayNames[d.getDay()]
              : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const dayEvents = events.filter((e: any) =>
            String(e.created_date || "").startsWith(isoDate)
          );
          const dayBroadcasts = broadcasts.filter((b: any) =>
            String(b.started_at || b.created_date || "").startsWith(isoDate)
          );
          const playEvents = dayEvents.filter((e: any) =>
            ["LIVE_PLAY", "AUDIO_PLAY", "EPISODE_PLAY", "VIDEO_PLAY", "APP_OPEN"].includes(
              e.event_type
            )
          ).length;
          const streamHits =
            dayBroadcasts.length +
            dayEvents.filter((e: any) => e.event_type === "LIVE_PLAY").length;
          out.push({
            day: dayLabel,
            listeners: playEvents,
            streams: streamHits,
          });
        }
        return out;
      };

      const auditLogs = auditLogsAll.slice(0, 12);
      const activeBroadcast =
        broadcasts.find(
          (b: any) => b.status === "LIVE" || b.status === "PAUSED" || b.status === "EMERGENCY"
        ) || null;

      const totalPlays = episodes.reduce((acc: number, e: any) => acc + (e.play_count || 0), 0);
      const totalDownloads = episodes.reduce(
        (acc: number, e: any) => acc + (e.download_count || 0),
        downloads.length
      );

      const pendingAiQueue = jobs
        .filter((j: any) => j.status === "COMPLETE")
        .slice(0, 4)
        .map((j: any) => ({
          id: j.id,
          time: j.kind,
          title: j.target_title || "AI Output",
          subtitle: "Awaiting Admin Approval",
          status: "Review",
          to: "/admin/ai",
        }));

      const draftEpisodesQueue = episodes
        .filter((e: any) => ["DRAFT", "PENDING_APPROVAL", "SCHEDULED"].includes(e.status))
        .slice(0, 4)
        .map((e: any) => ({
          id: e.id,
          time: "Draft",
          title: e.title,
          subtitle: e.program_title || "Episode Queue",
          status: e.status === "PENDING_APPROVAL" ? "Approval" : "Queued",
          to: "/admin/episodes",
        }));

      const productionQueue =
        pendingAiQueue.length > 0
          ? [...pendingAiQueue, ...draftEpisodesQueue].slice(0, 4)
          : draftEpisodesQueue.length > 0
            ? draftEpisodesQueue
            : (onAir.todaySchedule || []).slice(0, 4).map((s: any) => ({
                id: s.id,
                time: s.start_time,
                title: s.program_title,
                subtitle: s.presenter_name || s.studio || "Studio 1",
                status: "Scheduled",
                to: "/admin/schedules",
              }));

      res.json({
        ...onAir,
        counts: {
          listeners: users.filter((u: any) => !u.staff_role && u.role !== "admin").length || 1,
          liveListeners: activeBroadcast?.listener_count || 0,
          totalPlays,
          downloads: totalDownloads,
          programs: programs.length,
          episodes: episodes.length,
          publishedEpisodes: episodes.filter((e: any) => e.status === "PUBLISHED").length,
          videos: videos.length,
          news: news.length,
          publishedNews: news.filter((n: any) => n.status === "PUBLISHED").length,
          presenters: presenters.length,
          categories: categories.length,
          recordings: recordings.length,
          pendingAi: jobs.filter((j: any) => j.status === "COMPLETE").length,
          users: users.length,
          followers:
            programs.reduce((a: number, p: any) => a + (p.follower_count || 0), 0) +
            follows.length,
          favorites: favorites.length,
          adCampaigns: ads.length,
        },
        unreadNotifications: notifs.filter((n: any) => !n.is_read).length,
        series: buildDailySeries(14, events),
        broadcastTrend7: buildTrend(7),
        broadcastTrend30: buildTrend(30),
        productionQueue,
        recentRecordings: recordings.slice(0, 4),
        topPrograms: [...programs]
          .sort((a: any, b: any) => (b.follower_count || 0) - (a.follower_count || 0))
          .slice(0, 5),
        topEpisodes: [...episodes]
          .sort((a: any, b: any) => (b.play_count || 0) - (a.play_count || 0))
          .slice(0, 5),
        topVideos: [...videos]
          .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
          .slice(0, 5),
        topNews: [...news]
          .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
          .slice(0, 5),
        streams,
        activeBroadcast,
        auditLogs,
      });
    })
  );

  router.get(
    "/admin/analytics",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      const days = Math.min(180, Math.max(1, Number(req.query.days) || 30));
      const [events, episodes, programs] = await Promise.all([
        listEntity("AnalyticsEvent"),
        listEntity("Episode"),
        listEntity("Program"),
      ]);
      const catMap: Record<string, number> = {};
      programs.forEach((p: any) => {
        catMap[p.category] = (catMap[p.category] || 0) + (p.follower_count || 1);
      });
      res.json({
        days,
        totals: {
          opens: events.filter((e: any) => e.event_type === "APP_OPEN").length,
          plays: events.filter((e: any) => e.event_type.includes("PLAY")).length,
          listens: events.filter((e: any) => e.event_type === "LIVE_PLAY").length,
          downloads: events.filter((e: any) => e.event_type === "DOWNLOAD").length,
        },
        series: buildDailySeries(days, events),
        topContent: [...episodes]
          .sort((a: any, b: any) => (b.play_count || 0) - (a.play_count || 0))
          .slice(0, 10),
        categories: Object.entries(catMap).map(([name, value]) => ({ name, value })),
      });
    })
  );

  router.get(
    "/admin/users",
    requireAdmin as any,
    asyncRoute(async (_req, res) => {
      const users = (await listEntity("User")) as DbUser[];
      res.json(users.map(sanitizeUser));
    })
  );

  router.post(
    "/admin/users",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "users.manage", res)) return;
      const schema = z.object({
        email: z.string().email("Enter a valid email"),
        full_name: z.string().min(1, "Full name is required"),
        phone: z.string().optional().default(""),
        password: z.string().optional().default("RadioHargeysa@2026"),
        staff_role: z.string().optional().nullable(),
        account_status: z.enum(["ACTIVE", "SUSPENDED"]).optional().default("ACTIVE"),
        station_id: z.string().optional().nullable(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "Invalid user details" });
      }
      const email = parsed.data.email.trim().toLowerCase();
      const users = (await listEntity("User")) as DbUser[];
      if (users.some((u) => u.email.toLowerCase() === email)) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }
      const station = await getPrimaryStation();
      const staffRole = parsed.data.staff_role || null;
      const created = (await createEntity(
        "User",
        {
          email,
          full_name: parsed.data.full_name.trim(),
          phone: parsed.data.phone || "",
          password_hash: hashPassword(parsed.data.password || "RadioHargeysa@2026"),
          role: staffRole === "SUPER_ADMIN" ? "admin" : "user",
          staff_role: staffRole,
          account_status: parsed.data.account_status,
          station_id: parsed.data.station_id || station?.id || null,
          verified: true,
        },
        req.currentUser!.id
      )) as DbUser;
      await audit(req, "USER_CREATED", "User", created.id, created.email);
      res.json(sanitizeUser(created));
    })
  );

  router.patch(
    "/admin/users/:id",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "users.manage", res)) return;
      const target = (await getEntityById("User", req.params.id)) as DbUser | undefined;
      if (!target) return res.status(404).json({ error: "User not found" });
      if (
        target.id === req.currentUser!.id &&
        "staff_role" in (req.body || {}) &&
        req.body.staff_role !== null &&
        !isAdminRole(req.body.staff_role)
      ) {
        return res
          .status(400)
          .json({ error: "You cannot demote your own administrator role." });
      }
      const patch: Record<string, any> = {};
      if (req.body?.full_name !== undefined) patch.full_name = String(req.body.full_name).trim();
      if (req.body?.phone !== undefined) patch.phone = String(req.body.phone);
      if (req.body?.email !== undefined && String(req.body.email).trim()) {
        patch.email = String(req.body.email).trim().toLowerCase();
      }
      if ("staff_role" in (req.body || {})) {
        patch.staff_role = req.body.staff_role || null;
        patch.role = req.body.staff_role === "SUPER_ADMIN" ? "admin" : "user";
      }
      if (req.body?.account_status) patch.account_status = req.body.account_status;
      if ("station_id" in (req.body || {})) patch.station_id = req.body.station_id || null;
      if (req.body?.password && String(req.body.password).length >= 6) {
        patch.password_hash = hashPassword(String(req.body.password));
      }

      const updated = (await updateEntity("User", target.id, patch)) as DbUser;
      await audit(req, "USER_UPDATED", "User", target.id, updated.email);
      res.json(sanitizeUser(updated));
    })
  );

  router.delete(
    "/admin/users/:id",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "users.manage", res)) return;
      const target = (await getEntityById("User", req.params.id)) as DbUser | undefined;
      if (!target) return res.status(404).json({ error: "User not found" });
      if (target.id === req.currentUser!.id) {
        return res.status(400).json({ error: "You cannot delete your own active session account." });
      }
      const ok = await deleteEntity("User", target.id);
      if (!ok) return res.status(404).json({ error: "User not found" });
      await audit(req, "USER_DELETED", "User", target.id, target.email);
      res.json({ ok: true });
    })
  );

  router.post(
    "/admin/users/:id/access",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "users.manage", res)) return;
      const target = (await getEntityById("User", req.params.id)) as DbUser | undefined;
      if (!target) return res.status(404).json({ error: "User not found" });
      if (
        target.id === req.currentUser!.id &&
        req.body?.staff_role &&
        !isAdminRole(req.body.staff_role)
      ) {
        return res
          .status(400)
          .json({ error: "You cannot demote your own administrator role." });
      }
      const patch: Record<string, any> = {};
      if ("staff_role" in req.body) {
        patch.staff_role = req.body.staff_role || null;
        patch.role = req.body.staff_role === "SUPER_ADMIN" ? "admin" : "user";
      }
      if (req.body?.account_status) patch.account_status = req.body.account_status;
      if ("station_id" in req.body) patch.station_id = req.body.station_id;

      const updated = (await updateEntity("User", target.id, patch)) as DbUser;
      await audit(req, "USER_ACCESS_UPDATED", "User", target.id, target.email);
      res.json(sanitizeUser(updated));
    })
  );

  router.get(
    "/admin/invitations",
    requireAdmin as any,
    asyncRoute(async (_req, res) => {
      res.json(await listEntity("StaffInvitation"));
    })
  );

  router.post(
    "/admin/invitations",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "users.manage", res)) return;
      const schema = z.object({
        email: z.string().email("Enter a valid email"),
        staff_role: z.enum([
          "SUPER_ADMIN",
          "ADMIN",
          "RADIO_MANAGER",
          "PRODUCER",
          "EDITOR",
          "PRESENTER",
        ]),
        station_id: z.string().optional().nullable(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "Invalid invitation" });
      }
      const inv = await createEntity(
        "StaffInvitation",
        {
          ...parsed.data,
          email: parsed.data.email.trim().toLowerCase(),
          status: "PENDING",
          invited_by: req.currentUser!.email,
        },
        req.currentUser!.id
      );
      await audit(req, "STAFF_INVITED", "StaffInvitation", inv.id, `${inv.email} (${inv.staff_role})`);
      res.json(inv);
    })
  );

  router.post(
    "/admin/invitations/:id/revoke",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "users.manage", res)) return;
      const updated = await updateEntity("StaffInvitation", req.params.id, { status: "REVOKED" });
      if (!updated) return res.status(404).json({ error: "Invitation not found" });
      await audit(req, "STAFF_INVITE_REVOKED", "StaffInvitation", req.params.id, updated.email);
      res.json(updated);
    })
  );

  router.get(
    "/admin/audit-logs",
    requireAdmin as any,
    asyncRoute(async (_req, res) => {
      res.json((await listEntity("AuditLog")).slice(0, 200));
    })
  );

  router.get(
    "/admin/advertisements",
    requireAdmin as any,
    asyncRoute(async (_req, res) => {
      const ads = (await listEntity("Advertisement")).map((ad: any) => ({
        ...ad,
        ctr:
          ad.impressions > 0
            ? Number(((ad.clicks / ad.impressions) * 100).toFixed(2))
            : 0,
      }));
      res.json(ads);
    })
  );

  router.post(
    "/admin/advertisements/save",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "ads.manage", res)) return;
      const schema = z.object({
        id: z.string().optional(),
        name: z.string().min(1, "Campaign name is required"),
        advertiser: z.string().optional().default(""),
        placement: z.enum([
          "MOBILE_HOME",
          "LANDING_SLIDES",
          "AUDIO_PREROLL",
          "VIDEO_PREROLL",
          "NEWS_INLINE",
        ]),
        status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ENDED"]).default("DRAFT"),
        creative_url: z.string().optional().default(""),
        target_url: z.string().optional().default(""),
        starts_at: z.string().optional().default(""),
        ends_at: z.string().optional().default(""),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: parsed.error.issues[0]?.message || "Invalid campaign" });
      }
      const station = await getPrimaryStation();
      if (parsed.data.id) {
        const updated = await updateEntity("Advertisement", parsed.data.id, parsed.data);
        await audit(req, "AD_UPDATED", "Advertisement", parsed.data.id, parsed.data.name);
        return res.json(updated);
      }
      const created = await createEntity(
        "Advertisement",
        {
          station_id: station?.id || null,
          ...parsed.data,
          impressions: 0,
          clicks: 0,
        },
        req.currentUser!.id
      );
      await audit(req, "AD_CREATED", "Advertisement", created.id, created.name);
      res.json(created);
    })
  );

  router.post(
    "/admin/stations/save",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      if (!assertPermission(req.currentRole, "stations.manage", res)) return;
      const { id, ...rest } = req.body || {};
      if (id) {
        const updated = await updateEntity("Station", id, rest);
        await audit(req, "STATION_UPDATED", "Station", id, rest.name || "");
        return res.json(updated);
      }
      const created = await createEntity("Station", rest, req.currentUser!.id);
      await audit(req, "STATION_CREATED", "Station", created.id, created.name);
      res.json(created);
    })
  );

  router.post(
    "/admin/settings/audit",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      await audit(
        req,
        req.body?.action || "SETTINGS_UPDATED",
        req.body?.entity_type || "Station",
        req.body?.entity_id || "",
        req.body?.details || "Updated platform settings"
      );
      res.json({ ok: true });
    })
  );

  router.get(
    "/admin/entities/:entity",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      const entity = req.params.entity as EntityName;
      if (!WHITELISTED_ADMIN_ENTITIES.has(entity)) {
        return res.status(400).json({ error: "Unsupported entity" });
      }
      res.json(await listEntity(entity));
    })
  );

  router.post(
    "/admin/entities/:entity",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      const entity = req.params.entity as EntityName;
      if (!WHITELISTED_ADMIN_ENTITIES.has(entity)) {
        return res.status(400).json({ error: "Unsupported entity" });
      }
      const station = await getPrimaryStation();
      const bodyPayload: Record<string, any> = { ...(req.body || {}) };
      if (entity === "Category" && typeof bodyPayload.slug === "string") {
        bodyPayload.slug = bodyPayload.slug
          .trim()
          .toUpperCase()
          .replace(/[\s-]+/g, "_");
      }
      const created = await createEntity(
        entity,
        { station_id: station?.id || null, ...bodyPayload },
        req.currentUser!.id
      );
      await audit(
        req,
        `${entity.toUpperCase()}_CREATED`,
        entity,
        created.id,
        created.title || created.name || ""
      );
      res.json(created);
    })
  );

  router.patch(
    "/admin/entities/:entity/:id",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      const entity = req.params.entity as EntityName;
      if (!WHITELISTED_ADMIN_ENTITIES.has(entity)) {
        return res.status(400).json({ error: "Unsupported entity" });
      }
      const patchPayload: Record<string, any> = { ...(req.body || {}) };
      if (entity === "Category" && typeof patchPayload.slug === "string") {
        patchPayload.slug = patchPayload.slug
          .trim()
          .toUpperCase()
          .replace(/[\s-]+/g, "_");
      }
      const updated = await updateEntity(entity, req.params.id, patchPayload);
      if (!updated) return res.status(404).json({ error: "Not found" });
      await audit(
        req,
        `${entity.toUpperCase()}_UPDATED`,
        entity,
        req.params.id,
        updated.title || updated.name || ""
      );
      res.json(updated);
    })
  );

  router.delete(
    "/admin/entities/:entity/:id",
    requireAdmin as any,
    asyncRoute(async (req, res) => {
      const entity = req.params.entity as EntityName;
      if (!WHITELISTED_ADMIN_ENTITIES.has(entity)) {
        return res.status(400).json({ error: "Unsupported entity" });
      }
      const ok = await deleteEntity(entity, req.params.id);
      if (!ok) return res.status(404).json({ error: "Not found" });
      await audit(req, `${entity.toUpperCase()}_DELETED`, entity, req.params.id);
      res.json({ ok: true });
    })
  );

  return router;
}

function buildDailySeries(days: number, events: any[]) {
  const result: Array<{ date: string; plays: number; downloads: number; opens: number }> = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400_000);
    const key = d.toISOString().slice(0, 10);
    const label = `${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getDate()).padStart(2, "0")}`;
    const dayEvents = events.filter((e) => (e.created_date || "").startsWith(key));
    result.push({
      date: label,
      plays: dayEvents.filter((e) => e.event_type.includes("PLAY")).length,
      downloads: dayEvents.filter((e) => e.event_type === "DOWNLOAD").length,
      opens: dayEvents.filter((e) => e.event_type === "APP_OPEN").length,
    });
  }
  return result;
}
