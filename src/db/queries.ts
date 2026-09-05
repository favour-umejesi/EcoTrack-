import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { personas, pointsLedger, weeklyLogs } from "@/db/schema";

/** Read-side helpers for server components. Every query is scoped to one user id. */

export async function listWeeklyLogs(userId: string) {
  return getDb()
    .select({ weekStart: weeklyLogs.weekStart, annualKg: weeklyLogs.annualKg, lines: weeklyLogs.lines, factorSet: weeklyLogs.factorSet })
    .from(weeklyLogs)
    .where(eq(weeklyLogs.userId, userId))
    .orderBy(asc(weeklyLogs.weekStart));
}

export async function listPoints(userId: string, limit = 100) {
  return getDb()
    .select({ points: pointsLedger.points, reason: pointsLedger.reason, ref: pointsLedger.ref, createdAt: pointsLedger.createdAt })
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, userId))
    .orderBy(desc(pointsLedger.createdAt))
    .limit(limit);
}

export async function getPersona(userId: string) {
  const [row] = await getDb().select().from(personas).where(eq(personas.userId, userId)).limit(1);
  return row ?? null;
}

export async function latestWeeklyLog(userId: string) {
  const [row] = await getDb()
    .select({ weekStart: weeklyLogs.weekStart, inputs: weeklyLogs.inputs })
    .from(weeklyLogs)
    .where(eq(weeklyLogs.userId, userId))
    .orderBy(desc(weeklyLogs.weekStart))
    .limit(1);
  return row ?? null;
}
