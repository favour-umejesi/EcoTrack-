import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/** Drizzle over Neon's HTTP driver, which suits serverless hosting. Built lazily so builds pass without secrets. */
let db: ReturnType<typeof connect> | undefined;
function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL in .env (see .env.example).");
  return drizzle(neon(url), { schema });
}
export function getDb() {
  return (db ??= connect());
}
