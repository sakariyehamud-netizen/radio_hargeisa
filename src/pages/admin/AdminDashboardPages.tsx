import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Radio,
  Waves,
  Video,
  Newspaper,
  Plus,
  Play,
  Pause,
  Square,
  Loader2,
  BarChart3,
  Calendar,
  ArrowRight,
  Smartphone,
  Search,
  Filter,
  RotateCcw,
  Download,
  Headphones,
  Disc,
  AlertTriangle,
  History,
  Activity,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";
import {
  formatDuration,
  formatTimeRange,
  hhmmToMinutes,
  relativeTime,
} from "../../lib/format";
import {
  PageHeader,
  SectionCard,
  StatCard,
  ToolbarButton,
} from "../../components/shared/Surface";
import { StatusBadge } from "../../components/shared/StatusBadge";
import {
  BroadcastOverviewChart,
  RankedBars,
  TrendChart,
} from "../../components/shared/Charts";
import { StreamForm } from "../../components/admin/StreamForm";
import { DataTable, TablePill } from "../../components/shared/DataTable";
import { EmptyState } from "../../components/shared/EmptyState";
import { BrandLogo } from "../../components/shared/Brand";
import {
  ConfirmDeleteDialog,
  FieldDef,
  RecordActions,
  RecordEditDialog,
  RecordViewDialog,
} from "../../components/studio/RecordActions";
import { cn } from "../../lib/utils";

export function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"activity" | "overview">("activity");
  const [trendDays, setTrendDays] = useState<7 | 30>(7);
  const [broadcastBusy, setBroadcastBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/admin/overview");
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const c = data?.counts || {};
  const todaySchedule: any[] = data?.todaySchedule || [];
  const activeBroadcast = data?.activeBroadcast || data?.broadcast || null;
  const currentProgram = data?.currentProgram || null;
  const streams: any[] = data?.streams || [];
  const topPrograms: any[] = data?.topPrograms || [];
  const topEpisodes: any[] = data?.topEpisodes || [];
  const topVideos: any[] = data?.topVideos || [];
  const topNews: any[] = data?.topNews || [];
  const auditLogs: any[] = data?.auditLogs || [];
  const activitySeries: any[] = data?.series || [];
  const trendSeries =
    trendDays === 30 ? data?.broadcastTrend30 || [] : data?.broadcastTrend7 || [];

  const isOnAir = Boolean(activeBroadcast);
  const slotLabel = currentProgram
    ? formatTimeRange(currentProgram.start_time, currentProgram.end_time)
    : "07:00 – 09:00";

  const handleToggleBroadcast = async () => {
    setBroadcastBusy(true);
    try {
      if (activeBroadcast?.id) {
        await apiFetch(`/api/studio/broadcast/${activeBroadcast.id}/stop`, {
          method: "POST",
        });
        toast.success("Broadcast ended and recording saved");
      } else {
        await apiFetch("/api/studio/broadcast/start", {
          method: "POST",
          body: JSON.stringify({
            program_id: currentProgram?.program_id || null,
            program_title:
              currentProgram?.program_title || "Radio Hargeysa Live",
            presenter_name: currentProgram?.presenter_name || "Admin Broadcast Desk",
          }),
        });
        toast.success("Broadcast is now On Air");
      }
      await load();
    } catch (err: any) {
      toast.error(err.message || "Broadcast action failed");
    } finally {
      setBroadcastBusy(false);
    }
  };

  // All 8 KPI cards matching image_34545be0.png in Studio's pastel green/rose design
  const kpiCards = [
    {
      label: "Total Listeners",
      value: c.listeners ?? 0,
      sub: "Registered audience",
      to: "/admin/users",
      icon: Users,
      tone: "green" as const,
    },
    {
      label: "Live Listeners",
      value: c.liveListeners ?? 0,
      sub: "On air right now",
      to: "/admin/live",
      icon: Radio,
      tone: "rose" as const,
    },
    {
      label: "Total Plays",
      value: c.totalPlays ?? 0,
      sub: "All episodes",
      to: "/admin/analytics",
      icon: Headphones,
      tone: "green" as const,
    },
    {
      label: "Downloads",
      value: c.downloads ?? 0,
      sub: "Offline listens",
      to: "/admin/analytics",
      icon: Download,
      tone: "rose" as const,
    },
    {
      label: "Programs",
      value: c.programs ?? 0,
      sub: "Across the schedule",
      to: "/admin/programs",
      icon: Waves,
      tone: "green" as const,
    },
    {
      label: "Episodes",
      value: c.episodes ?? 0,
      sub: "Recorded catalogue",
      to: "/admin/episodes",
      icon: Disc,
      tone: "rose" as const,
    },
    {
      label: "Videos",
      value: c.videos ?? 0,
      sub: "Studio & news",
      to: "/admin/videos",
      icon: Video,
      tone: "green" as const,
    },
    {
      label: "News Stories",
      value: c.news ?? 0,
      sub: "Published articles",
      to: "/admin/news",
      icon: Newspaper,
      tone: "rose" as const,
    },
  ];

  const engagementItems = [
    { label: "Followers", value: c.followers ?? 0 },
    { label: "Favourites", value: c.favorites ?? 0 },
    { label: "Downloads", value: c.downloads ?? 0 },
    { label: "Ad campaigns", value: c.adCampaigns ?? 0 },
  ];

  const eqHeights = [32, 46, 38, 60, 48, 72, 42, 64, 52, 86];
  const curMin = data?.now?.minutesSinceMidnight ?? 0;

  return (
    <div className="space-y-4">
      {/* Row 1: Hero Broadcast Banner + Network Broadcast Status Card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-3xl border border-[#D4E6D9] bg-gradient-to-r from-[#EEF7F0] via-[#F9FCFA] to-[#E5F4E9] p-5 sm:p-6 lg:col-span-9 shadow-[0_12px_30px_-20px_rgba(4,116,34,0.28)]">
          <svg
            aria-hidden="true"
            viewBox="0 0 900 220"
            preserveAspectRatio="xMidYMid slice"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="admSkyFade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#E6F4EA" stopOpacity="0.4" />
                <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#D7EEDF" stopOpacity="0.45" />
              </linearGradient>
              <linearGradient id="admRibbonGreen" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#047422" />
                <stop offset="100%" stopColor="#0EA63B" />
              </linearGradient>
              <linearGradient id="admRibbonRed" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#B80B0D" />
                <stop offset="100%" stopColor="#E11D20" />
              </linearGradient>
            </defs>
            <rect width="900" height="220" fill="url(#admSkyFade)" />
            <path
              d="M 0 220 L 0 185 L 40 175 L 95 190 L 140 182 L 195 170 L 250 185 L 290 172 L 320 172 L 320 155 L 350 155 L 350 178 L 410 178 L 410 162 L 455 162 L 455 182 L 515 182 L 515 150 L 555 150 L 555 176 L 610 176 L 610 160 L 660 160 L 660 185 L 725 185 L 725 168 L 780 168 L 780 184 L 845 172 L 900 182 L 900 220 Z"
              fill="#CBD5E1"
              fillOpacity="0.42"
            />
            <g stroke="#94A3B8" strokeOpacity="0.55" strokeWidth="1.6" fill="none">
              <path d="M 388 188 L 398 52 L 408 188" />
              <path d="M 391 150 L 405 150 M 393 120 L 403 120 M 395 90 L 401 90" />
              <circle cx="398" cy="48" r="3.5" fill="#94A3B8" fillOpacity="0.6" />
              <path d="M 384 38 A 18 18 0 0 0 384 58 M 412 38 A 18 18 0 0 1 412 58" />
            </g>
            <path
              d="M 480 220 C 650 212 790 185 900 140 L 900 176 C 790 205 660 220 530 220 Z"
              fill="url(#admRibbonGreen)"
              fillOpacity="0.88"
            />
            <path
              d="M 555 220 C 710 216 820 198 900 172 L 900 220 Z"
              fill="url(#admRibbonRed)"
              fillOpacity="0.9"
            />
          </svg>

          <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-md">
              <h2 className="text-[28px] sm:text-[34px] font-extrabold leading-none tracking-[-0.03em] text-[#045E1C]">
                Radio Hargeysa
              </h2>
              <p className="mt-1.5 font-display italic text-[18px] sm:text-[21px] text-[#050505]">
                Codka Jamhuuriyadda Somaliland
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <Link
                  to="/admin/live"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-white shadow-sm transition-transform active:scale-95",
                    isOnAir ? "bg-[#C40D0F]" : "bg-[#C40D0F]/90 hover:bg-[#C40D0F]"
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>{isOnAir ? "LIVE ON AIR" : "OPEN LIVE CONTROL"}</span>
                </Link>
                <span className="inline-flex items-center rounded-full bg-[#044F19] px-4 py-2 text-[11.5px] font-bold text-white tabular-nums shadow-sm">
                  {slotLabel}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 pr-2">
              <svg
                aria-hidden="true"
                viewBox="0 0 180 165"
                className="h-36 w-40 shrink-0 drop-shadow-md"
              >
                <defs>
                  <linearGradient id="admMic" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#141619" />
                    <stop offset="45%" stopColor="#3B4048" />
                    <stop offset="100%" stopColor="#0A0B0C" />
                  </linearGradient>
                  <clipPath id="admRhClip">
                    <circle cx="90" cy="88" r="24" />
                  </clipPath>
                </defs>
                <ellipse
                  cx="90"
                  cy="74"
                  rx="62"
                  ry="20"
                  transform="rotate(-14 90 74)"
                  fill="none"
                  stroke="#047422"
                  strokeWidth="9"
                />
                <ellipse
                  cx="90"
                  cy="102"
                  rx="60"
                  ry="20"
                  transform="rotate(14 90 102)"
                  fill="none"
                  stroke="#D91618"
                  strokeWidth="9"
                />
                <rect x="86" y="120" width="8" height="32" rx="3" fill="#1F2937" />
                <ellipse cx="90" cy="153" rx="34" ry="7" fill="#111827" />
                <rect x="66" y="14" width="48" height="58" rx="24" fill="url(#admMic)" />
                <rect x="65" y="70" width="50" height="7" rx="2" fill="#D1D5DB" />
                <rect x="67" y="77" width="46" height="46" rx="12" fill="url(#admMic)" />
                <circle cx="90" cy="88" r="25" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
                <g clipPath="url(#admRhClip)">
                  <rect x="64" y="62" width="52" height="12" fill="#047422" />
                  <rect x="64" y="74" width="52" height="24" fill="#FFFFFF" />
                  <rect x="64" y="98" width="52" height="16" fill="#C40D0F" />
                  <text
                    x="90"
                    y="93"
                    textAnchor="middle"
                    fill="#050505"
                    fontFamily="Georgia, serif"
                    fontWeight="800"
                    fontSize="18"
                  >
                    RH
                  </text>
                  <text
                    x="90"
                    y="108"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontFamily="Manrope, sans-serif"
                    fontWeight="800"
                    fontSize="7"
                  >
                    1942
                  </text>
                </g>
              </svg>

              <div className="text-right">
                <p className="font-display italic text-[22px] font-semibold leading-snug text-[#050505]">
                  Wadajir,
                  <br />
                  War iyo Wacyi
                </p>
                <div className="mt-1.5 ml-auto h-1 w-24 rounded-full bg-gradient-to-r from-[#047422] to-[#C40D0F]" />
              </div>
            </div>
          </div>
        </div>

        {/* Network Broadcast Status Control Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-3 shadow-[0_10px_28px_-20px_rgba(5,5,5,0.25)]">
          <div>
            <p className="text-[12.5px] font-bold text-[#374151]">
              Network Status
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full",
                  isOnAir ? "bg-[#047422]/15" : "bg-[#9CA3AF]/15"
                )}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    isOnAir ? "bg-[#047422] live-dot" : "bg-[#9CA3AF]"
                  )}
                />
              </span>
              <span className="text-[22px] font-extrabold tracking-tight text-[#050505]">
                {isOnAir ? "On Air" : "Standby"}
              </span>
            </div>
            <p className="mt-0.5 pl-7 text-[11.5px] font-medium text-[#6B7280] truncate">
              {isOnAir
                ? activeBroadcast?.program_title || "Now Broadcasting"
                : currentProgram?.program_title || "Ready to broadcast"}
            </p>
          </div>

          <div className="my-4 flex h-10 items-end justify-between gap-1.5 px-1">
            {eqHeights.map((h, idx) => (
              <div
                key={idx}
                className="flex flex-1 flex-col justify-end gap-[2px] h-full"
              >
                <span
                  className={cn(
                    "w-full rounded-sm transition-all",
                    isOnAir ? "bg-[#047422]" : "bg-[#D1D5DB]"
                  )}
                  style={{ height: `${isOnAir ? h : Math.max(20, h - 25)}%` }}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={broadcastBusy}
            onClick={handleToggleBroadcast}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[12.5px] font-extrabold text-white shadow-sm transition-colors disabled:opacity-50",
              isOnAir
                ? "bg-[#C40D0F] hover:bg-[#A10B0D]"
                : "bg-[#047422] hover:bg-[#035A1B]"
            )}
          >
            {broadcastBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isOnAir ? (
              <Square className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            <span>{isOnAir ? "End Broadcast" : "Start Broadcast"}</span>
          </button>
        </div>
      </div>

      {/* Row 2: 8 Pastel KPI Cards (2 x 4 grid preserving Studio pastel aesthetic + all screenshot metrics) */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isGreen = card.tone === "green";
          return (
            <Link
              key={card.label}
              to={card.to}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-4 transition-transform hover:-translate-y-0.5",
                isGreen
                  ? "border-[#D5EBD9] bg-gradient-to-br from-[#F3FBF5] to-[#E6F4E9]"
                  : "border-[#F7DCE0] bg-gradient-to-br from-[#FFF6F7] to-[#FCE9EC]"
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute -bottom-2 -right-2 h-16 w-16 opacity-10 transition-transform group-hover:scale-105",
                  isGreen ? "text-[#047422]" : "text-[#C40D0F]"
                )}
              />
              <div className="relative z-10 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs",
                    isGreen ? "bg-[#047422]" : "bg-[#D91618]"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-bold text-[#374151]">
                    {card.label}
                  </p>
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-[22px] font-extrabold leading-none text-[#050505] tabular-nums">
                      {Number(card.value).toLocaleString()}
                    </span>
                    <span className="truncate text-[10.5px] font-semibold text-[#047422]">
                      {card.sub}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Row 3: Daily Listening Activity (14d) / Broadcast Overview + Live Status & Streams */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-8 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#047422]" />
                <h2 className="text-[14.5px] font-extrabold text-[#050505]">
                  {chartMode === "activity"
                    ? "Daily listening activity"
                    : "Broadcast Overview"}
                </h2>
              </div>
              <p className="mt-0.5 text-[11.5px] text-[#6B7280]">
                {chartMode === "activity"
                  ? "Plays, downloads and app opens over the last 14 days."
                  : "Listeners & active broadcast streams telemetry."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-[#F4F5F7] p-1">
                <button
                  type="button"
                  onClick={() => setChartMode("activity")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors",
                    chartMode === "activity"
                      ? "bg-white text-[#047422] shadow-xs"
                      : "text-[#6B7280] hover:text-[#050505]"
                  )}
                >
                  14d Activity
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("overview")}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors",
                    chartMode === "overview"
                      ? "bg-white text-[#047422] shadow-xs"
                      : "text-[#6B7280] hover:text-[#050505]"
                  )}
                >
                  Listeners &amp; Streams
                </button>
              </div>

              {chartMode === "overview" && (
                <select
                  value={trendDays}
                  onChange={(e) => setTrendDays(Number(e.target.value) as 7 | 30)}
                  aria-label="Select date range"
                  className="rounded-xl border border-[#E7E9EC] bg-[#FAFBFC] px-2.5 py-1 text-[11.5px] font-bold text-[#374151] focus:border-[#047422] focus:outline-none"
                >
                  <option value={7}>Last 7 Days</option>
                  <option value={30}>Last 30 Days</option>
                </select>
              )}
            </div>
          </div>

          <div className="mt-4">
            {chartMode === "activity" ? (
              <TrendChart data={activitySeries} dataKey="plays" height={225} />
            ) : (
              <BroadcastOverviewChart data={trendSeries} height={225} />
            )}
          </div>
        </div>

        {/* Live status + Streams Card (exact screenshot section) */}
        <div className="flex flex-col justify-between rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-4 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[14.5px] font-extrabold text-[#050505]">
                  Live status
                </h2>
                <p className="text-[11.5px] text-[#6B7280]">
                  Current broadcast state
                </p>
              </div>
              <Link
                to="/admin/live"
                className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#047422] hover:underline whitespace-nowrap"
              >
                <span>Open live</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-3 rounded-2xl border border-dashed border-[#E2E5E9] bg-[#FAFBFC] p-4 text-center">
              <div className="flex justify-center">
                <StatusBadge
                  status={activeBroadcast ? activeBroadcast.status : "OFFLINE"}
                />
              </div>
              <p className="mt-2 text-[13.5px] font-extrabold text-[#050505]">
                {activeBroadcast
                  ? activeBroadcast.program_title
                  : "Not broadcasting"}
              </p>
              <p className="mt-0.5 text-[11.5px] text-[#6B7280]">
                {activeBroadcast
                  ? `${activeBroadcast.presenter_name || "On Air"} · ${activeBroadcast.listener_count || 0} listening`
                  : "Start a broadcast from Live Control."}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {streams.length > 0 ? (
              streams.slice(0, 3).map((st: any) => (
                <Link
                  key={st.id}
                  to="/admin/streams"
                  className="flex items-center justify-between rounded-xl border border-[#F0F1F3] bg-[#FAFBFC] px-3 py-2 text-[12px] transition-colors hover:border-[#047422]/40"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-[#050505] truncate block">
                      {st.name}
                    </span>
                  </div>
                  <StatusBadge status={st.status || "OFFLINE"} />
                </Link>
              ))
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-[#F0F1F3] bg-[#FAFBFC] px-3 py-2 text-[12px]">
                <span className="font-bold text-[#050505]">Audio stream</span>
                <StatusBadge status="OFFLINE" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Most Popular Programs + Top Episodes */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-6 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="flex items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-[14.5px] font-extrabold text-[#050505]">
                Most popular programs
              </h2>
              <p className="text-[11.5px] text-[#6B7280]">
                By episode plays &amp; followers
              </p>
            </div>
            <Link
              to="/admin/programs"
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#047422] hover:underline whitespace-nowrap"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <RankedBars
            data={topPrograms.map((p: any) => ({
              title: p.title,
              value: p.follower_count || 0,
            }))}
            height={210}
            emptyText="No program popularity data yet."
          />
        </div>

        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-6 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="flex items-center justify-between gap-2 pb-3">
            <div>
              <h2 className="text-[14.5px] font-extrabold text-[#050505]">
                Top episodes
              </h2>
              <p className="text-[11.5px] text-[#6B7280]">
                Most played this period
              </p>
            </div>
            <Link
              to="/admin/episodes"
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#047422] hover:underline whitespace-nowrap"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-[#F0F1F3]" />
              ))}
            </div>
          ) : topEpisodes.length > 0 ? (
            <div className="divide-y divide-[#F0F1F3]">
              {topEpisodes.map((ep: any) => (
                <div
                  key={ep.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-[12.5px]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#050505]">
                      {ep.title}
                    </p>
                    <p className="truncate text-[11px] text-[#6B7280]">
                      {ep.program_title || "Radio Hargeysa"}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[11.5px] font-bold text-[#047422] tabular-nums">
                    {ep.play_count || 0} plays
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-[12px] text-[#9CA3AF]">
              No episode plays recorded yet.
            </p>
          )}
        </div>
      </div>

      {/* Row 5: Top Videos + Top News + Engagement */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="flex items-center justify-between gap-2 pb-3">
            <h2 className="text-[14.5px] font-extrabold text-[#050505]">
              Top videos
            </h2>
            <Link
              to="/admin/videos"
              className="text-[11.5px] font-bold text-[#047422] hover:underline"
            >
              All →
            </Link>
          </div>
          {topVideos.length > 0 ? (
            <div className="divide-y divide-[#F0F1F3]">
              {topVideos.map((v: any) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-[12px]"
                >
                  <span className="truncate font-semibold text-[#111827]">
                    {v.title}
                  </span>
                  <span className="shrink-0 font-mono text-[11.5px] font-bold text-[#6B7280] tabular-nums">
                    {v.view_count || 0}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-[12px] text-[#9CA3AF]">
              No video views yet.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="flex items-center justify-between gap-2 pb-3">
            <h2 className="text-[14.5px] font-extrabold text-[#050505]">
              Top news
            </h2>
            <Link
              to="/admin/news"
              className="text-[11.5px] font-bold text-[#047422] hover:underline"
            >
              All →
            </Link>
          </div>
          {topNews.length > 0 ? (
            <div className="divide-y divide-[#F0F1F3]">
              {topNews.map((n: any) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between gap-3 py-2.5 text-[12px]"
                >
                  <span className="truncate font-semibold text-[#111827]">
                    {n.title}
                  </span>
                  <span className="shrink-0 font-mono text-[11.5px] font-bold text-[#6B7280] tabular-nums">
                    {n.view_count || 0}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-[12px] text-[#9CA3AF]">
              No news views yet.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="pb-3">
            <h2 className="text-[14.5px] font-extrabold text-[#050505]">
              Engagement
            </h2>
            <p className="text-[11.5px] text-[#6B7280]">Audience actions</p>
          </div>
          <div className="divide-y divide-[#F0F1F3]">
            {engagementItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2.5 text-[12.5px]"
              >
                <span className="font-medium text-[#4B5563]">{item.label}</span>
                <span className="font-mono font-extrabold text-[#050505] tabular-nums">
                  {Number(item.value).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 6: Recent Staff Activity + Today's Schedule + Radio Hargeysa App Banner */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-5 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="flex items-center justify-between gap-2 pb-3">
            <div>
              <h2 className="text-[14.5px] font-extrabold text-[#050505]">
                Recent staff activity
              </h2>
              <p className="text-[11.5px] text-[#6B7280]">
                Latest governance and editorial actions
              </p>
            </div>
            <Link
              to="/admin/audit-logs"
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#047422] hover:underline whitespace-nowrap"
            >
              <span>Audit logs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {auditLogs.length > 0 ? (
            <div className="divide-y divide-[#F0F1F3]">
              {auditLogs.slice(0, 6).map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-2 py-2 text-[12px]"
                >
                  <div className="min-w-0">
                    <span className="font-extrabold text-[#050505] mr-1.5">
                      {log.action}
                    </span>
                    <span className="text-[#6B7280] break-all">
                      {log.actor_email}
                      {log.details ? ` — ${log.details}` : ""}
                    </span>
                  </div>
                  <span className="shrink-0 text-[10.5px] text-[#9CA3AF] whitespace-nowrap">
                    {relativeTime(log.created_date)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-[12px] text-[#9CA3AF]">
              No staff activity logged yet.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-[#E7E9EC] bg-white p-5 lg:col-span-4 shadow-[0_8px_24px_-18px_rgba(5,5,5,0.2)]">
          <div className="flex items-center justify-between gap-2 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#047422]" />
              <h2 className="text-[14.5px] font-extrabold text-[#050505]">
                Today&apos;s Schedule
              </h2>
            </div>
            <Link
              to="/admin/schedules"
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#047422] hover:underline whitespace-nowrap"
            >
              <span>Full Schedule</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {todaySchedule.length > 0 ? (
            <div className="divide-y divide-[#F0F1F3]">
              {todaySchedule.slice(0, 5).map((slot: any) => {
                const startM = hhmmToMinutes(slot.start_time);
                const endM = hhmmToMinutes(slot.end_time);
                const slotLive = curMin >= startM && curMin < endM;
                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between gap-2 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="shrink-0 text-[11.5px] font-extrabold text-[#050505] tabular-nums">
                        {slot.start_time} – {slot.end_time}
                      </span>
                      <span className="truncate text-[12px] font-semibold text-[#374151]">
                        {slot.program_title}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                        slotLive
                          ? "bg-[#FDE7E7] text-[#C40D0F]"
                          : "bg-[#E8F1FD] text-[#1D4ED8]"
                      )}
                    >
                      {slotLive ? "Live" : "Upcoming"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-[12px] text-[#9CA3AF]">
              Nothing scheduled today.
            </p>
          )}
        </div>

        {/* Radio Hargeysa App Promo Card */}
        <div className="relative flex items-center justify-between gap-3 overflow-hidden rounded-3xl border border-[#D4E6D9] bg-gradient-to-br from-[#EAF6ED] via-[#F7FBF8] to-[#D8EEDF] p-5 lg:col-span-3 shadow-[0_10px_28px_-20px_rgba(4,116,34,0.3)]">
          <svg
            aria-hidden="true"
            viewBox="0 0 200 100"
            className="pointer-events-none absolute bottom-0 right-0 h-20 w-44"
          >
            <path d="M 40 100 L 200 35 L 200 68 L 95 100 Z" fill="#047422" />
            <path d="M 95 100 L 200 68 L 200 100 Z" fill="#C40D0F" />
          </svg>

          <div className="relative z-10">
            <h2 className="text-[17px] font-extrabold leading-tight tracking-tight text-[#045E1C]">
              Radio Hargeysa App
            </h2>
            <p className="mt-1 font-display italic text-[12.5px] text-[#1F2937]">
              Listen Live, Anytime, Anywhere
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#050505] px-2 py-1 text-[10px] font-bold text-white">
                <Smartphone className="h-3 w-3 text-[#4ADE80]" />
                <span>Mobile</span>
              </span>
              <span className="inline-flex items-center rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-[#047422] ring-1 ring-[#DCE8DF]">
                PWA
              </span>
            </div>
            <Link
              to="/mobile/splash"
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#045E1C] px-3.5 py-2 text-[11.5px] font-extrabold text-white shadow-sm hover:bg-[#047422]"
            >
              <span>Open Mobile App</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative z-10 hidden xl:flex h-32 w-20 shrink-0 rotate-6 flex-col items-center justify-between rounded-[18px] border-[3px] border-[#1F2937] bg-white p-1.5 shadow-xl">
            <div className="h-1 w-6 rounded-full bg-[#1F2937]" />
            <BrandLogo size={32} />
            <div className="w-full space-y-1">
              <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#047422] text-white">
                <Play className="h-2 w-2 fill-current ml-0.5" />
              </div>
              <div className="h-1 w-full rounded-full bg-[#E5E7EB]">
                <div className="h-1 w-2/3 rounded-full bg-[#047422]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BROADCAST_FIELDS: FieldDef[] = [
  { key: "program_title", label: "Program Title", required: true },
  { key: "presenter_name", label: "Presenter", placeholder: "Desk Host" },
  {
    key: "status",
    label: "Broadcast Status",
    type: "select",
    options: ["LIVE", "PAUSED", "EMERGENCY", "ENDED"].map((s) => ({
      value: s,
      label: s,
    })),
  },
  {
    key: "recording_status",
    label: "Recording Status",
    type: "select",
    options: ["RECORDING", "SAVED", "IDLE"].map((s) => ({
      value: s,
      label: s,
    })),
  },
  { key: "listener_count", label: "Active Listeners", type: "number" },
  { key: "listener_peak", label: "Peak Listeners", type: "number" },
  { key: "duration_seconds", label: "Duration (sec)", type: "number" },
  { key: "started_by", label: "Started By (email)" },
  { key: "is_emergency", label: "Emergency Override", type: "checkbox" },
  { key: "notes", label: "Operator Notes", type: "textarea", fullWidth: true },
];

export function AdminLivePage() {
  const [overview, setOverview] = useState<any>(null);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [programTitle, setProgramTitle] = useState("");
  const [presenterName, setPresenterName] = useState("");
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideTitle, setOverrideTitle] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, bList, pList] = await Promise.all([
        apiFetch<any>("/api/admin/overview"),
        apiFetch<any[]>("/api/admin/entities/Broadcast"),
        apiFetch<any[]>("/api/admin/entities/Program"),
      ]);
      setOverview(ov);
      setBroadcasts(bList);
      setPrograms(pList);
    } catch (err: any) {
      toast.error(err.message || "Failed to load live control");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = useMemo(
    () =>
      broadcasts.find(
        (b) => b.status === "LIVE" || b.status === "PAUSED" || b.status === "EMERGENCY"
      ) || null,
    [broadcasts]
  );

  const streams: any[] = overview?.streams || [];
  const onlineStreams = streams.filter((s) => s.status === "LIVE").length;
  const activeListeners = active?.listener_count || overview?.counts?.liveListeners || 0;
  const emergencyCount = broadcasts.filter((b) => b.is_emergency).length;

  const filtered = useMemo(() => {
    return broadcasts.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (typeFilter === "EMERGENCY" && !b.is_emergency) return false;
      if (typeFilter === "STANDARD" && b.is_emergency) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          b.program_title?.toLowerCase().includes(q) ||
          b.presenter_name?.toLowerCase().includes(q) ||
          b.started_by?.toLowerCase().includes(q) ||
          b.notes?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [broadcasts, statusFilter, typeFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || statusFilter !== "ALL" || typeFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
  };

  const handleStartLive = async () => {
    setBusy(true);
    try {
      await apiFetch("/api/studio/broadcast/start", {
        method: "POST",
        body: JSON.stringify({
          program_title:
            programTitle.trim() ||
            overview?.currentProgram?.program_title ||
            "Network Live Broadcast",
          presenter_name:
            presenterName.trim() ||
            overview?.currentProgram?.presenter_name ||
            "Admin Desk",
        }),
      });
      toast.success("Network broadcast is LIVE");
      setProgramTitle("");
      setPresenterName("");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not start broadcast");
    } finally {
      setBusy(false);
    }
  };

  const handleBroadcastAction = async (action: "pause" | "resume" | "stop") => {
    if (!active?.id) return;
    setBusy(true);
    try {
      await apiFetch(`/api/studio/broadcast/${active.id}/${action}`, {
        method: "POST",
      });
      toast.success(
        action === "pause"
          ? "Network broadcast paused"
          : action === "resume"
            ? "Network broadcast resumed"
            : "Network broadcast ended & archived"
      );
      await load();
    } catch (err: any) {
      toast.error(err.message || "Broadcast command failed");
    } finally {
      setBusy(false);
    }
  };

  const handleEmergencyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideTitle.trim()) return;
    setBusy(true);
    try {
      await apiFetch("/api/studio/broadcast/start", {
        method: "POST",
        body: JSON.stringify({
          program_title: overrideTitle.trim(),
          notes: overrideNotes.trim(),
          is_emergency: true,
          send_notification: true,
        }),
      });
      toast.success("Emergency network override activated");
      setOverrideModal(false);
      setOverrideTitle("");
      setOverrideNotes("");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Override failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="NETWORK LIVE CONTROL"
        title="Executive Live Control"
        description="Command network-wide live sessions, dispatch emergency overrides, and audit broadcast streams."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton variant="danger" onClick={() => setOverrideModal(true)}>
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Emergency override</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => setCreating(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span>Add session</span>
            </ToolbarButton>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="NETWORK STATUS"
          value={active ? active.status : "STANDBY"}
          hint={active ? active.program_title : "Ready for dispatch"}
          icon={Radio}
          tone={active ? "brand" : "default"}
        />
        <StatCard
          label="LIVE LISTENERS"
          value={activeListeners}
          hint="Connected audience"
          icon={Users}
        />
        <StatCard
          label="ACTIVE STREAMS"
          value={`${onlineStreams}/${streams.length}`}
          hint="Audio & video endpoints"
          icon={Activity}
        />
        <StatCard
          label="EMERGENCY LOGS"
          value={emergencyCount}
          hint="Priority overrides"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SectionCard
          title="Network On-Air Command"
          description="Dispatch a station-wide live feed or manage the active master broadcast."
          className="lg:col-span-7"
        >
          {active ? (
            <div className="rounded-2xl bg-[#050505] p-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge status={active.status} />
                <span className="font-mono text-[11px] text-white/60">
                  Started {relativeTime(active.started_at)} by{" "}
                  {active.started_by || "Admin"}
                </span>
              </div>
              <h3 className="mt-3 text-[18px] font-extrabold text-white">
                {active.program_title}
              </h3>
              <p className="mt-0.5 text-[12px] text-white/65">
                {active.presenter_name || "Radio Hargeysa Desk"} ·{" "}
                <span className="tabular-nums">
                  {active.listener_count || 0} active listeners
                </span>
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                {active.status === "PAUSED" ? (
                  <ToolbarButton
                    disabled={busy}
                    onClick={() => handleBroadcastAction("resume")}
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Resume live</span>
                  </ToolbarButton>
                ) : (
                  <ToolbarButton
                    variant="outline"
                    disabled={busy}
                    onClick={() => handleBroadcastAction("pause")}
                  >
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause live</span>
                  </ToolbarButton>
                )}
                <ToolbarButton
                  variant="danger"
                  disabled={busy}
                  onClick={() => handleBroadcastAction("stop")}
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop &amp; save recording</span>
                </ToolbarButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                    Program or Show
                  </label>
                  <input
                    list="admin-live-programs"
                    value={programTitle}
                    onChange={(e) => setProgramTitle(e.target.value)}
                    placeholder={
                      overview?.currentProgram?.program_title ||
                      "Network Live Broadcast"
                    }
                    className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
                  />
                  <datalist id="admin-live-programs">
                    {programs.map((p) => (
                      <option key={p.id} value={p.title} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                    Presenter / Host
                  </label>
                  <input
                    value={presenterName}
                    onChange={(e) => setPresenterName(e.target.value)}
                    placeholder={
                      overview?.currentProgram?.presenter_name || "Admin Desk"
                    }
                    className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#047422] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ToolbarButton disabled={busy} onClick={handleStartLive}>
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                  <span>Go Live Now</span>
                </ToolbarButton>
                <Link
                  to="/admin/broadcast-history"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E9EC] bg-white px-3.5 py-2 text-[12px] font-bold text-[#050505] hover:bg-[#F5F6F7]"
                >
                  <History className="h-3.5 w-3.5 text-[#047422]" />
                  <span>Full broadcast history</span>
                </Link>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Station Stream Matrix"
          description="Live feed endpoints assigned to this control desk."
          className="lg:col-span-5"
          actions={
            <Link
              to="/admin/streams"
              className="text-[11.5px] font-bold text-[#047422] hover:underline"
            >
              Configure →
            </Link>
          }
        >
          {streams.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-[#9CA3AF]">
              No stream endpoints registered.
            </p>
          ) : (
            <div className="space-y-2.5">
              {streams.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#F0F1F3] bg-[#FAFBFC] px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] font-bold text-[#050505]">
                        {s.name}
                      </span>
                      <TablePill tone={s.kind === "AUDIO" ? "brand" : "neutral"}>
                        {s.kind}
                      </TablePill>
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[10.5px] text-[#6B7280]">
                      {(s.provider || "icecast").toUpperCase()} ·{" "}
                      {s.bitrate_kbps || 64} kbps ·{" "}
                      <span className="tabular-nums">{s.latency_ms || 0} ms</span>
                    </p>
                  </div>
                  <StatusBadge status={s.status || "OFFLINE"} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Live Sessions DataTable with Filters + Add / View / Edit / Delete */}
      <SectionCard title="Live & Recorded Sessions" padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search program, presenter, operator…"
                className="w-56 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by session status"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="LIVE">LIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="EMERGENCY">EMERGENCY</option>
                <option value="ENDED">ENDED</option>
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by broadcast type"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="STANDARD">Standard Broadcast</option>
              <option value="EMERGENCY">Emergency Override</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {broadcasts.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "program_title",
                label: "Program",
                render: (r) => (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#050505]">
                        {r.program_title}
                      </span>
                      {r.is_emergency && (
                        <TablePill tone="live">EMERGENCY</TablePill>
                      )}
                    </div>
                    {r.notes && (
                      <p className="mt-0.5 max-w-xs truncate text-[11px] text-[#6B7280]">
                        {r.notes}
                      </p>
                    )}
                  </div>
                ),
              },
              { key: "presenter_name", label: "Presenter" },
              {
                key: "started_at",
                label: "Started",
                render: (r) => (
                  <span className="tabular-nums">{relativeTime(r.started_at)}</span>
                ),
              },
              {
                key: "listener_count",
                label: "Listeners",
                align: "right",
                render: (r) => (
                  <span className="font-mono font-bold tabular-nums">
                    {r.listener_count || 0}
                  </span>
                ),
              },
              {
                key: "duration_seconds",
                label: "Duration",
                render: (r) => (
                  <span className="tabular-nums">
                    {formatDuration(r.duration_seconds)}
                  </span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status || "ENDED"} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={Radio}
                title={hasFilters ? "No matching sessions" : "No broadcast sessions yet"}
                description="Start a live session above or log a network broadcast."
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add session</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-[#C40D0F]">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-[16px] font-extrabold text-[#050505]">
                Network Emergency Override
              </h3>
            </div>
            <p className="mt-1 text-[12px] text-[#6B7280]">
              Immediately interrupts active programming, flags all dashboards as
              EMERGENCY, and pushes an alert to listeners.
            </p>
            <form onSubmit={handleEmergencyOverride} className="mt-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  Emergency Bulletin Title <span className="text-[#C40D0F]">*</span>
                </label>
                <input
                  required
                  value={overrideTitle}
                  onChange={(e) => setOverrideTitle(e.target.value)}
                  placeholder="Urgent Civil Weather Advisory"
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#C40D0F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-[#9CA3AF]">
                  Alert Message
                </label>
                <textarea
                  rows={3}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Broadcast notice for mobile & studio listeners…"
                  className="mt-1 w-full rounded-xl border border-[#E7E9EC] px-3 py-2 text-[12.5px] focus:border-[#C40D0F] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <ToolbarButton
                  type="button"
                  variant="outline"
                  onClick={() => setOverrideModal(false)}
                >
                  Cancel
                </ToolbarButton>
                <ToolbarButton
                  type="submit"
                  variant="danger"
                  disabled={busy || !overrideTitle.trim()}
                >
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Trigger Override</span>
                </ToolbarButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.program_title || "Broadcast Session"}
        record={viewing}
        fields={BROADCAST_FIELDS}
        extraFields={[
          { key: "started_at", label: "Started At" },
          { key: "ended_at", label: "Ended At" },
        ]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title="Add Broadcast Session"
        fields={BROADCAST_FIELDS}
        initialValues={{
          status: "LIVE",
          recording_status: "RECORDING",
          listener_count: 0,
          listener_peak: 0,
          duration_seconds: 0,
          is_emergency: false,
        }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          await apiFetch("/api/admin/entities/Broadcast", {
            method: "POST",
            body: JSON.stringify({
              ...vals,
              started_at: new Date().toISOString(),
            }),
          });
          toast.success("Broadcast session created");
          await load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit Broadcast Session"
        fields={BROADCAST_FIELDS}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/admin/entities/Broadcast/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Broadcast session updated");
          await load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete broadcast session"
        description={`Are you sure you want to delete "${deleting?.program_title || "this session"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/admin/entities/Broadcast/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Broadcast session deleted");
            await load();
          }
        }}
      />
    </div>
  );
}

export function AdminStreamsPage() {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiFetch<any[]>("/api/studio/streams");
      setStreams(list);
    } catch (err: any) {
      toast.error(err.message || "Failed to load streams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return streams.filter((s) => {
      if (kindFilter !== "ALL" && s.kind !== kindFilter) return false;
      if (statusFilter !== "ALL" && (s.status || "OFFLINE") !== statusFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          s.name?.toLowerCase().includes(q) ||
          s.provider?.toLowerCase().includes(q) ||
          s.primary_url?.toLowerCase().includes(q) ||
          s.hls_output_url?.toLowerCase().includes(q) ||
          s.rtmp_ingest_url?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [streams, kindFilter, statusFilter, query]);

  const hasFilters =
    Boolean(query.trim()) || kindFilter !== "ALL" || statusFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setKindFilter("ALL");
    setStatusFilter("ALL");
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/entities/LiveStream/${id}`, { method: "DELETE" });
      toast.success("Stream deleted");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Could not delete stream");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="NETWORK INFRASTRUCTURE"
        title="CDN & Stream Endpoints"
        description="Provision Icecast, HLS, and RTMP ingest pipelines, primary routing, and failover URLs."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add stream</span>
          </ToolbarButton>
        }
      />

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stream, provider, RTMP/HLS…"
                className="w-56 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value)}
                aria-label="Filter by stream kind"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Kinds</option>
                <option value="AUDIO">AUDIO</option>
                <option value="VIDEO">VIDEO</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by stream status"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="LIVE">LIVE</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="PAUSED">PAUSED</option>
              <option value="ERROR">ERROR</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {streams.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "name",
                label: "Stream Endpoint",
                render: (s) => (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#050505]">{s.name}</span>
                      {s.is_primary && <TablePill tone="brand">Primary</TablePill>}
                    </div>
                    <p className="mt-0.5 max-w-xs truncate font-mono text-[11px] text-[#6B7280]">
                      {s.primary_url || s.hls_output_url || "No endpoint configured"}
                    </p>
                  </div>
                ),
              },
              {
                key: "kind",
                label: "Kind",
                render: (s) => (
                  <TablePill tone={s.kind === "AUDIO" ? "brand" : "neutral"}>
                    {s.kind}
                  </TablePill>
                ),
              },
              {
                key: "backup_url",
                label: "Failover",
                render: (s) => (
                  <span className="font-mono text-[11px] text-[#4B5563]">
                    {s.backup_url ? "Configured" : "None"}
                  </span>
                ),
              },
              {
                key: "provider",
                label: "Pipeline",
                render: (s) => (
                  <span className="text-[12px] font-semibold text-[#374151]">
                    {(s.provider || "icecast").toUpperCase()} · {s.bitrate_kbps || 64} kbps {s.codec || "AAC"}
                  </span>
                ),
              },
              {
                key: "health",
                label: "Health",
                render: (s) => <StatusBadge status={s.health || "GOOD"} />,
              },
              {
                key: "status",
                label: "Status",
                render: (s) => <StatusBadge status={s.status || "OFFLINE"} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (s) => (
                  <RecordActions
                    onView={() => setViewing(s)}
                    onEdit={() => setEditing(s)}
                    onDelete={() => setDeleting(s)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(s) => setViewing(s)}
            empty={
              <EmptyState
                icon={Radio}
                title={hasFilters ? "No matching streams" : "No streams configured"}
                description="Add an Icecast, HLS, or RTMP endpoint to power live broadcasts."
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add stream</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.name || "Stream Details"}
        record={viewing}
        extraFields={[
          { key: "name", label: "Stream Name" },
          { key: "kind", label: "Kind" },
          { key: "provider", label: "Provider" },
          { key: "codec", label: "Codec" },
          { key: "bitrate_kbps", label: "Bitrate (kbps)" },
          { key: "health", label: "Health" },
          { key: "primary_url", label: "Primary URL" },
          { key: "backup_url", label: "Backup URL" },
          { key: "hls_output_url", label: "HLS Output URL" },
          { key: "rtmp_ingest_url", label: "RTMP Ingest URL" },
          { key: "is_primary", label: "Primary Station Stream" },
        ]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <StreamForm
        open={creating || Boolean(editing)}
        stream={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={load}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete stream"
        description={`Are you sure you want to delete "${deleting?.name || "this stream"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) await handleDelete(deleting.id);
        }}
      />
    </div>
  );
}

export function AdminBroadcastHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [recordingFilter, setRecordingFilter] = useState("ALL");

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiFetch<any[]>("/api/admin/entities/Broadcast");
      setRows(list);
    } catch (err: any) {
      toast.error(err.message || "Failed to load broadcast history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (modeFilter === "EMERGENCY" && !r.is_emergency) return false;
      if (modeFilter === "STANDARD" && r.is_emergency) return false;
      if (recordingFilter !== "ALL" && (r.recording_status || "IDLE") !== recordingFilter) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          r.program_title?.toLowerCase().includes(q) ||
          r.presenter_name?.toLowerCase().includes(q) ||
          r.started_by?.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, statusFilter, modeFilter, recordingFilter, query]);

  const hasFilters =
    Boolean(query.trim()) ||
    statusFilter !== "ALL" ||
    modeFilter !== "ALL" ||
    recordingFilter !== "ALL";

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setModeFilter("ALL");
    setRecordingFilter("ALL");
  };

  const completedCount = rows.filter((r) => r.status === "ENDED").length;
  const emergencyCount = rows.filter((r) => r.is_emergency).length;
  const totalSeconds = rows.reduce(
    (sum, r) => sum + (Number(r.duration_seconds) || 0),
    0
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="COMPLIANCE & ARCHIVE"
        title="Broadcast History"
        description="Complete station transmission ledger, session air-time logs, and recording compliance."
        actions={
          <ToolbarButton onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
            <span>Log broadcast</span>
          </ToolbarButton>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard label="TOTAL SESSIONS" value={rows.length} icon={History} tone="brand" />
        <StatCard label="COMPLETED" value={completedCount} icon={Radio} />
        <StatCard label="EMERGENCY LOGS" value={emergencyCount} icon={AlertTriangle} />
        <StatCard
          label="TOTAL AIR TIME"
          value={formatDuration(totalSeconds)}
          icon={Clock}
        />
      </div>

      <SectionCard padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F3] bg-[#FAFBFC] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search program, presenter, operator…"
                className="w-56 rounded-xl border border-[#E7E9EC] bg-white py-1.5 pl-8 pr-3 text-[12px] text-[#050505] placeholder:text-[#B0B6BE] focus:border-[#047422] focus:outline-none"
              />
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#9CA3AF]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ENDED">ENDED</option>
                <option value="LIVE">LIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </select>
            </div>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              aria-label="Filter by broadcast mode"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Modes</option>
              <option value="STANDARD">Standard</option>
              <option value="EMERGENCY">Emergency</option>
            </select>

            <select
              value={recordingFilter}
              onChange={(e) => setRecordingFilter(e.target.value)}
              aria-label="Filter by recording state"
              className="rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] focus:border-[#047422] focus:outline-none"
            >
              <option value="ALL">All Recordings</option>
              <option value="SAVED">SAVED</option>
              <option value="RECORDING">RECORDING</option>
              <option value="IDLE">IDLE</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-[#E7E9EC] bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[#6B7280] hover:text-[#050505]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="text-[11.5px] font-semibold text-[#6B7280] tabular-nums">
            Showing {filtered.length} of {rows.length}
          </span>
        </div>

        <div className="p-4">
          <DataTable
            loading={loading}
            columns={[
              {
                key: "program_title",
                label: "Program",
                render: (r) => (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#050505]">
                        {r.program_title}
                      </span>
                      {r.is_emergency && (
                        <TablePill tone="live">EMERGENCY</TablePill>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B7280]">
                      {r.started_by || "Studio Operator"}
                    </p>
                  </div>
                ),
              },
              { key: "presenter_name", label: "Presenter" },
              {
                key: "started_at",
                label: "Started",
                render: (r) => (
                  <span className="tabular-nums">
                    {r.started_at ? new Date(r.started_at).toLocaleString() : "—"}
                  </span>
                ),
              },
              {
                key: "duration_seconds",
                label: "Air Time",
                render: (r) => (
                  <span className="font-mono tabular-nums">
                    {formatDuration(r.duration_seconds)}
                  </span>
                ),
              },
              {
                key: "listener_peak",
                label: "Peak",
                align: "right",
                render: (r) => (
                  <span className="font-mono font-bold tabular-nums">
                    {r.listener_peak || r.listener_count || 0}
                  </span>
                ),
              },
              {
                key: "recording_status",
                label: "Recording",
                render: (r) => (
                  <StatusBadge status={r.recording_status || "IDLE"} />
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => <StatusBadge status={r.status || "ENDED"} />,
              },
              {
                key: "_actions",
                label: "Actions",
                align: "right",
                render: (r) => (
                  <RecordActions
                    onView={() => setViewing(r)}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setDeleting(r)}
                  />
                ),
              },
            ]}
            rows={filtered}
            onRowClick={(r) => setViewing(r)}
            empty={
              <EmptyState
                icon={History}
                title={hasFilters ? "No matching broadcast records" : "No broadcast history yet"}
                description="Live broadcasts automatically archive here once concluded."
                action={
                  hasFilters ? (
                    <ToolbarButton variant="outline" onClick={resetFilters}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset filters</span>
                    </ToolbarButton>
                  ) : (
                    <ToolbarButton onClick={() => setCreating(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Log broadcast</span>
                    </ToolbarButton>
                  )
                }
              />
            }
          />
        </div>
      </SectionCard>

      <RecordViewDialog
        open={Boolean(viewing)}
        title={viewing?.program_title || "Broadcast Record"}
        record={viewing}
        fields={BROADCAST_FIELDS}
        extraFields={[
          { key: "started_at", label: "Started At" },
          { key: "ended_at", label: "Ended At" },
        ]}
        onClose={() => setViewing(null)}
        onEdit={viewing ? () => setEditing(viewing) : undefined}
        onDelete={viewing ? () => setDeleting(viewing) : undefined}
      />

      <RecordEditDialog
        open={creating}
        title="Log Broadcast History Record"
        fields={BROADCAST_FIELDS}
        initialValues={{
          status: "ENDED",
          recording_status: "SAVED",
          listener_count: 24,
          listener_peak: 36,
          duration_seconds: 3600,
          is_emergency: false,
        }}
        onClose={() => setCreating(false)}
        onSave={async (vals) => {
          const now = new Date();
          await apiFetch("/api/admin/entities/Broadcast", {
            method: "POST",
            body: JSON.stringify({
              ...vals,
              started_at: new Date(
                now.getTime() - (Number(vals.duration_seconds) || 0) * 1000
              ).toISOString(),
              ended_at: vals.status === "ENDED" ? now.toISOString() : null,
            }),
          });
          toast.success("Broadcast record logged");
          await load();
        }}
      />

      <RecordEditDialog
        open={Boolean(editing)}
        title="Edit Broadcast Record"
        fields={BROADCAST_FIELDS}
        initialValues={editing || {}}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          await apiFetch(`/api/admin/entities/Broadcast/${editing.id}`, {
            method: "PATCH",
            body: JSON.stringify(vals),
          });
          toast.success("Broadcast record updated");
          await load();
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete broadcast history record"
        description={`Are you sure you want to delete "${deleting?.program_title || "this broadcast record"}"?`}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting?.id) {
            await apiFetch(`/api/admin/entities/Broadcast/${deleting.id}`, {
              method: "DELETE",
            });
            toast.success("Broadcast record deleted");
            await load();
          }
        }}
      />
    </div>
  );
}
