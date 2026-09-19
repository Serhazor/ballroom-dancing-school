import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pg from "pg";
import ws from "ws";
import * as schema from "./schema";

// Node 22+ has a global WebSocket; older runtimes need the `ws` package.
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const url = process.env.DATABASE_URL ?? "";
/** A plain Postgres on this machine (for local development) uses the standard driver. */
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

type Db = NeonDatabase<typeof schema>;
const g = globalThis as unknown as { __db?: Db };

function create(): Db {
  if (isLocal) {
    return drizzlePg(new pg.Pool({ connectionString: url }), { schema }) as unknown as Db;
  }
  return drizzleNeon(new NeonPool({ connectionString: url }), { schema });
}

export const db: Db = g.__db ?? create();
if (process.env.NODE_ENV !== "production") g.__db = db;

export { schema };
