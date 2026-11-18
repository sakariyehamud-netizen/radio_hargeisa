import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME || "postgres";
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER || "postgres";
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "";
const port = Number(process.env.SQL_PORT) || 5432;

const isRemote = connectionString
  ? !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1")
  : Boolean(sqlHost && sqlHost !== "localhost" && sqlHost !== "127.0.0.1");

const ssl =
  process.env.SQL_SSL === "true" ||
  (process.env.SQL_SSL !== "false" && isRemote);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: connectionString
    ? ({
        url: connectionString,
        ssl: ssl ? { rejectUnauthorized: false } : false,
      } as any)
    : ({
        host: sqlHost || "localhost",
        port,
        user,
        password,
        database: sqlDbName,
        ssl: ssl ? { rejectUnauthorized: false } : false,
      } as any),
  verbose: true,
});
