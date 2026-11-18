import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    const host = process.env.SQL_HOST || "";
    const isRemote = connectionString
      ? !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1")
      : host !== "" && host !== "localhost" && host !== "127.0.0.1";

    const useSsl =
      process.env.SQL_SSL === "true" ||
      (process.env.SQL_SSL !== "false" && isRemote);

    const sslConfig = useSsl ? { rejectUnauthorized: false } : undefined;

    const poolConfig: any = connectionString
      ? {
          connectionString,
          ssl: sslConfig,
          max: 10,
          idleTimeoutMillis: 5000,
          connectionTimeoutMillis: 25000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 5000,
        }
      : {
          host: host || "localhost",
          port: Number(process.env.SQL_PORT) || 5432,
          user: process.env.SQL_USER || "postgres",
          password: process.env.SQL_PASSWORD || "",
          database: process.env.SQL_DB_NAME || "postgres",
          ssl: sslConfig,
          max: 10,
          idleTimeoutMillis: 5000,
          connectionTimeoutMillis: 25000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 5000,
        };

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });

const TRANSIENT_PG_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
  "EAI_AGAIN",
  "57P01",
  "57P02",
  "57P03",
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "53300",
]);

export function isTransientDbError(error: unknown): boolean {
  const queue: any[] = [error];
  const seen = new Set<any>();
  while (queue.length > 0 && seen.size < 12) {
    const cur = queue.shift();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);

    const code = String(cur.code || cur.errno || "").toUpperCase();
    if (code && TRANSIENT_PG_CODES.has(code)) {
      return true;
    }
    const msg = String(cur.message || "").toLowerCase();
    if (
      msg.includes("connection terminated") ||
      msg.includes("terminating connection") ||
      msg.includes("econnreset") ||
      msg.includes("econnrefused") ||
      msg.includes("etimedout") ||
      msg.includes("epipe") ||
      msg.includes("socket hang up") ||
      msg.includes("connection closed") ||
      msg.includes("server closed the connection") ||
      msg.includes("client has encountered a connection error") ||
      msg.includes("database system is starting up") ||
      msg.includes("too many clients") ||
      msg.includes("connection timeout")
    ) {
      return true;
    }
    if (cur.cause) queue.push(cur.cause);
    if (Array.isArray(cur.errors)) queue.push(...cur.errors);
  }
  return false;
}

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 4
): Promise<T> {
  let lastError: unknown;
  const delays = [200, 500, 1200];
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isTransientDbError(error)) {
        throw error;
      }
      const baseDelay = delays[Math.min(attempt - 1, delays.length - 1)];
      const jitter = Math.floor(Math.random() * 100);
      await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
    }
  }
  throw lastError;
}
