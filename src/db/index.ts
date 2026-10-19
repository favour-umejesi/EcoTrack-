import { neon, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleOverSocket, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

/** Drizzle over Neon's HTTP driver, which suits serverless hosting. Built lazily so builds pass without secrets. */
let db: ReturnType<typeof connect> | undefined;
function url() {
  const u = process.env.DATABASE_URL;
  if (!u) throw new Error("Set DATABASE_URL in .env (see .env.example).");
  return u;
}
function connect() {
  return drizzle(neon(url()), { schema });
}
export function getDb() {
  return (db ??= connect());
}

export type Tx = Parameters<Parameters<NeonDatabase<typeof schema>["transaction"]>[0]>[0];

/**
 * A real transaction for the few writes that must land together or not at all (account deletion). The HTTP driver
 * above has no transactions, so this opens a short-lived WebSocket connection, runs `fn` inside BEGIN/COMMIT and
 * closes it. Node 22 and later provide the WebSocket the driver needs; nothing else is configured.
 */
export async function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: url() });
  try {
    return await drizzleOverSocket(pool, { schema }).transaction(fn);
  } finally {
    await pool.end();
  }
}
