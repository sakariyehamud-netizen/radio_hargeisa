import crypto from "node:crypto";
import { desc, eq, inArray } from "drizzle-orm";
import { db, withDbRetry } from "./index.ts";
import { ensureSeeded } from "./seed.ts";
import {
  advertisements,
  aiJobs,
  analyticsEvents,
  appPreferences,
  auditLogs,
  broadcasts,
  categories,
  downloads,
  episodes,
  favorites,
  follows,
  listeningHistory,
  liveStreams,
  mediaAssets,
  mediaClips,
  newsArticles,
  notifications,
  organizations,
  playlists,
  presenters,
  programs,
  recordings,
  schedules,
  staffInvitations,
  stations,
  users,
  videos,
} from "./schema.ts";

export const ENTITY_TABLES = {
  Organization: organizations,
  Station: stations,
  Category: categories,
  Program: programs,
  Episode: episodes,
  Video: videos,
  NewsArticle: newsArticles,
  Presenter: presenters,
  Schedule: schedules,
  MediaAsset: mediaAssets,
  MediaClip: mediaClips,
  LiveStream: liveStreams,
  Broadcast: broadcasts,
  Recording: recordings,
  Favorite: favorites,
  Follow: follows,
  ListeningHistory: listeningHistory,
  Download: downloads,
  Playlist: playlists,
  AppPreference: appPreferences,
  AiJob: aiJobs,
  Advertisement: advertisements,
  Notification: notifications,
  AnalyticsEvent: analyticsEvents,
  AuditLog: auditLogs,
  StaffInvitation: staffInvitations,
  User: users,
} as const;

export type EntityName = keyof typeof ENTITY_TABLES;

export interface DbUser {
  id: string;
  uid: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string | null;
  role: string;
  staff_role: string | null;
  account_status: string;
  station_id: string | null;
  verified: boolean;
  otp_code?: string | null;
  reset_token?: string | null;
  last_active_at?: string | null;
  created_date: string;
  updated_date: string;
  created_by_id: string;
}

export function newId(prefix = "rec"): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 12)}`;
}

function pickTableColumns(table: any, data: Record<string, any>): Record<string, any> {
  const allowedKeys = new Set(Object.keys(table));
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowedKeys.has(k) && v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

export async function listEntity<K extends EntityName>(name: K): Promise<any[]> {
  try {
    return await withDbRetry(async () => {
      await ensureSeeded();
      const table = ENTITY_TABLES[name] as any;
      return await db.select().from(table).orderBy(desc(table.created_date));
    });
  } catch (error) {
    console.error(`Database query failed (list ${name}):`, error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function getEntityById<K extends EntityName>(
  name: K,
  id: string
): Promise<any | undefined> {
  try {
    return await withDbRetry(async () => {
      await ensureSeeded();
      const table = ENTITY_TABLES[name] as any;
      const rows = await db.select().from(table).where(eq(table.id, id)).limit(1);
      return rows[0];
    });
  } catch (error) {
    console.error(`Database query failed (get ${name}):`, error);
    throw new Error("Database query failed. Please try again later.", { cause: error });
  }
}

export async function createEntity<K extends EntityName>(
  name: K,
  record: Record<string, any>,
  createdById: string = "system"
): Promise<any> {
  try {
    return await withDbRetry(async () => {
      await ensureSeeded();
      const table = ENTITY_TABLES[name] as any;
      const now = new Date().toISOString();
      const id = record.id || newId(name.slice(0, 3).toLowerCase());
      const payload: Record<string, any> = {
        ...record,
        id,
        created_date: record.created_date || now,
        updated_date: now,
        created_by_id: record.created_by_id || createdById,
      };
      if (name === "User" && !payload.uid) {
        payload.uid = id;
      }
      const clean = pickTableColumns(table, payload);
      const inserted = (await db.insert(table).values(clean).returning()) as any[];
      return inserted[0];
    });
  } catch (error) {
    console.error(`Database query failed (create ${name}):`, error);
    throw new Error("Database write failed. Please try again later.", { cause: error });
  }
}

export async function updateEntity<K extends EntityName>(
  name: K,
  id: string,
  patch: Record<string, any>
): Promise<any | null> {
  try {
    return await withDbRetry(async () => {
      await ensureSeeded();
      const table = ENTITY_TABLES[name] as any;
      const { id: _ignored, ...rest } = patch || {};
      const clean = pickTableColumns(table, {
        ...rest,
        updated_date: new Date().toISOString(),
      });
      const updated = await db
        .update(table)
        .set(clean)
        .where(eq(table.id, id))
        .returning();
      return updated[0] || null;
    });
  } catch (error) {
    console.error(`Database query failed (update ${name}):`, error);
    throw new Error("Database update failed. Please try again later.", { cause: error });
  }
}

export async function deleteEntity<K extends EntityName>(
  name: K,
  id: string
): Promise<boolean> {
  try {
    return await withDbRetry(async () => {
      await ensureSeeded();
      const table = ENTITY_TABLES[name] as any;
      const deleted = await db
        .delete(table)
        .where(eq(table.id, id))
        .returning({ id: table.id });
      return deleted.length > 0;
    });
  } catch (error) {
    console.error(`Database query failed (delete ${name}):`, error);
    throw new Error("Database delete failed. Please try again later.", { cause: error });
  }
}

export async function deleteWhere<K extends EntityName>(
  name: K,
  predicate: (row: any) => boolean
): Promise<number> {
  try {
    return await withDbRetry(async () => {
      await ensureSeeded();
      const table = ENTITY_TABLES[name] as any;
      const rows = await db.select().from(table);
      const idsToDelete = rows.filter(predicate).map((r: any) => r.id);
      if (idsToDelete.length === 0) return 0;
      const deleted = await db
        .delete(table)
        .where(inArray(table.id, idsToDelete))
        .returning({ id: table.id });
      return deleted.length;
    });
  } catch (error) {
    console.error(`Database query failed (deleteWhere ${name}):`, error);
    throw new Error("Database delete failed. Please try again later.", { cause: error });
  }
}
