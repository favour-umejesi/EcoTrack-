"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@/lib/auth/server";
import { getDb } from "@/db";
import { personas, pointsLedger, userActions, weeklyLogs } from "@/db/schema";
import { compute } from "@/lib/engine";
import { inputsSchema } from "@/lib/inputs";
import { POINTS, streak, weekStart } from "@/lib/rules";
import { ACTION_LABELS, CHARACTERS } from "@/data/mock";

/**
 * Write-side entry points, callable from client components. Each one is an untrusted POST: it re-checks the
 * session and validates its input. Failures come back as `{ ok: false, error }` so the page can show them.
 */

type Fail = { ok: false; error: string };
const fail = (error: string): Fail => ({ ok: false, error });

async function currentUser() {
  const { data } = await getAuth().getSession();
  return data?.user ?? null;
}

const explainError = (e: unknown, fallback: string) => (e instanceof z.ZodError ? "Those numbers do not look right. Check the form and try again." : fallback);

export type SaveLogResult = { ok: true; weekStart: string; annualKg: number; saved: boolean; pointsAwarded: number } | Fail;

/** Saves this week's calculator answers for the signed-in member. `keepExisting` leaves an already-logged week alone (used when importing guest data). */
export async function saveWeeklyLog(raw: unknown, keepExisting = false): Promise<SaveLogResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in to keep a ledger.");
    const inputs = inputsSchema.parse(raw);
    const r = compute(inputs);
    const week = weekStart(new Date());
    const lines = r.lines.map(({ key, label, kg }) => ({ key, label, kg }));
    const db = getDb();
    const target = [weeklyLogs.userId, weeklyLogs.weekStart];
    const insert = db.insert(weeklyLogs).values({ userId: user.id, weekStart: week, inputs, factorSet: r.factorSet, annualKg: r.totalKg, lines });
    const saved = await (keepExisting
      ? insert.onConflictDoNothing({ target })
      : insert.onConflictDoUpdate({ target, set: { inputs, factorSet: r.factorSet, annualKg: r.totalKg, lines, updatedAt: new Date() } })
    ).returning({ id: weeklyLogs.id });
    let pointsAwarded = 0;
    if (saved.length) {
      const awarded = await db.insert(pointsLedger).values({ userId: user.id, points: POINTS.logWeek, reason: "log_week", ref: week }).onConflictDoNothing().returning({ id: pointsLedger.id });
      pointsAwarded = awarded.length ? POINTS.logWeek : 0;
      // Every fourth consecutive week earns a bonus, once per milestone week.
      const weeks = await db.select({ weekStart: weeklyLogs.weekStart }).from(weeklyLogs).where(eq(weeklyLogs.userId, user.id));
      const s = streak(weeks.map((w) => w.weekStart), new Date());
      if (s.weeks > 0 && s.weeks % 4 === 0) {
        const bonus = await db.insert(pointsLedger).values({ userId: user.id, points: POINTS.fourWeeks, reason: "four_weeks", ref: `streak-${week}` }).onConflictDoNothing().returning({ id: pointsLedger.id });
        if (bonus.length) pointsAwarded += POINTS.fourWeeks;
      }
    }
    revalidatePath("/track");
    revalidatePath("/profile");
    return { ok: true, weekStart: week, annualKg: r.totalKg, saved: saved.length > 0, pointsAwarded };
  } catch (e) {
    return fail(explainError(e, "Could not reach your ledger. Your answers are still in this browser; try again in a moment."));
  }
}

const characterNames = CHARACTERS.map(([c]) => c) as [string, ...string[]];
const personaSchema = z.object({ displayName: z.string().trim().min(2).max(40), character: z.enum(characterNames) });
export type SavePersonaResult = { ok: true; displayName: string; character: string } | Fail;

/** Upserts the public identity. The client mirrors the display name onto the auth user afterwards, so the nav stays in step. */
export async function savePersona(raw: unknown): Promise<SavePersonaResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in first.");
    const p = personaSchema.parse(raw);
    await getDb().insert(personas).values({ userId: user.id, ...p }).onConflictDoUpdate({ target: personas.userId, set: { ...p, updatedAt: new Date() } });
    revalidatePath("/profile");
    return { ok: true, ...p };
  } catch (e) {
    return fail(explainError(e, "Could not save your character. Try again in a moment."));
  }
}

export type DeleteLogResult = { ok: true; removed: boolean } | Fail;

/** Removes one of the member's logged weeks. Points already awarded stay, by the positive-only rule. */
export async function deleteWeeklyLog(weekStart: unknown): Promise<DeleteLogResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in first.");
    const week = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(weekStart);
    const gone = await getDb().delete(weeklyLogs).where(and(eq(weeklyLogs.userId, user.id), eq(weeklyLogs.weekStart, week))).returning({ id: weeklyLogs.id });
    revalidatePath("/track");
    revalidatePath("/profile");
    return { ok: true, removed: gone.length > 0 };
  } catch (e) {
    return fail(explainError(e, "Could not remove that week. Try again in a moment."));
  }
}

export type ToggleActionResult = { ok: true; adopted: boolean; pointsAwarded: number } | Fail;

/** Adopts or un-adopts an action from the insights catalog. Points come once, the first time. */
export async function toggleAction(action: unknown): Promise<ToggleActionResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in to adopt an action.");
    const key = z.enum(Object.keys(ACTION_LABELS) as [string, ...string[]]).parse(action);
    const db = getDb();
    const gone = await db.delete(userActions).where(and(eq(userActions.userId, user.id), eq(userActions.action, key))).returning({ id: userActions.id });
    let pointsAwarded = 0;
    if (!gone.length) {
      await db.insert(userActions).values({ userId: user.id, action: key }).onConflictDoNothing();
      const awarded = await db.insert(pointsLedger).values({ userId: user.id, points: POINTS.adoptAction, reason: "adopt_action", ref: key }).onConflictDoNothing().returning({ id: pointsLedger.id });
      pointsAwarded = awarded.length ? POINTS.adoptAction : 0;
    }
    revalidatePath("/insights");
    revalidatePath("/profile");
    return { ok: true, adopted: !gone.length, pointsAwarded };
  } catch (e) {
    return fail(explainError(e, "Could not save that. Try again in a moment."));
  }
}
