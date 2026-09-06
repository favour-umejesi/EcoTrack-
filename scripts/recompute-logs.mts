/**
 * Recomputes every stored week with the current engine and factor set.
 * Run after a factor update: `npm run db:recompute` (add `-- --force` to rewrite rows already on the current set).
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { weeklyLogs } from "../src/db/schema";
import { compute, FACTOR_SET } from "../src/lib/engine";
import { inputsSchema } from "../src/lib/inputs";

process.loadEnvFile?.(".env");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const force = process.argv.includes("--force");
const db = drizzle(neon(url));

const rows = await db.select({ id: weeklyLogs.id, inputs: weeklyLogs.inputs, factorSet: weeklyLogs.factorSet, annualKg: weeklyLogs.annualKg }).from(weeklyLogs);
let changed = 0, skipped = 0, bad = 0;
for (const row of rows) {
  if (!force && row.factorSet === FACTOR_SET.version) { skipped++; continue; }
  const parsed = inputsSchema.safeParse(row.inputs);
  if (!parsed.success) { bad++; console.warn(`skipping ${row.id}: inputs no longer validate`); continue; }
  const r = compute(parsed.data);
  await db.update(weeklyLogs).set({ annualKg: r.totalKg, lines: r.lines.map(({ key, label, kg }) => ({ key, label, kg })), factorSet: r.factorSet, updatedAt: new Date() }).where(eq(weeklyLogs.id, row.id));
  changed++;
  if (row.annualKg !== r.totalKg) console.log(`${row.id}: ${row.annualKg} -> ${r.totalKg} kg/yr (${row.factorSet} -> ${r.factorSet})`);
}
console.log(`recomputed ${changed}, already current ${skipped}, invalid ${bad}, total ${rows.length}`);
