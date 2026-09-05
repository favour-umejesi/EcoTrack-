/**
 * Ledger and gamification rules. Pure functions over ISO dates ("YYYY-MM-DD"); weeks start on Monday, in UTC.
 * Kept apart from the database so they can be tuned and tested on their own (ENGINEERING.md, section 8).
 */

export const POINTS = { logWeek: 10 } as const;
export const REASON_LABELS: Record<string, string> = { log_week: "Logged a week" };

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const toIso = (d: Date) => d.toISOString().slice(0, 10);
export const fromIso = (iso: string) => new Date(`${iso}T00:00:00Z`);
export const monthKey = (iso: string) => iso.slice(0, 7);
export const monthLabel = (key: string) => MONTHS[Number(key.slice(5, 7)) - 1];
export const monthName = (key: string) => MONTHS_LONG[Number(key.slice(5, 7)) - 1];
/** "28 Aug" */
export const dayLabel = (iso: string) => `${Number(iso.slice(8, 10))} ${monthLabel(monthKey(iso))}`;

/** Monday of the UTC week containing `d`, as an ISO date. */
export function weekStart(d: Date): string {
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  u.setUTCDate(u.getUTCDate() - ((u.getUTCDay() + 6) % 7));
  return toIso(u);
}
export const addWeeks = (iso: string, n: number) => toIso(new Date(fromIso(iso).getTime() + n * 7 * DAY));

export type WeekLog = { weekStart: string; annualKg: number; lines: { key: string; label: string; kg: number }[] };
export type MonthTotal = { key: string; month: string; kg: number; weeks: number; byCategory: Record<string, { label: string; kg: number }> };

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

/** A month's footprint is the mean annual pace of the weeks logged in it, divided by twelve. Oldest first. */
export function monthlyTotals(logs: WeekLog[]): MonthTotal[] {
  const byMonth = new Map<string, WeekLog[]>();
  for (const l of logs) {
    const k = monthKey(l.weekStart);
    if (!byMonth.has(k)) byMonth.set(k, []);
    byMonth.get(k)!.push(l);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, ws]) => {
      const byCategory: MonthTotal["byCategory"] = {};
      for (const w of ws) for (const line of w.lines) {
        const c = (byCategory[line.key] ??= { label: line.label, kg: 0 });
        c.kg += line.kg / 12 / ws.length;
      }
      for (const c of Object.values(byCategory)) c.kg = Math.round(c.kg);
      return { key, month: monthLabel(key), kg: Math.round(mean(ws.map((w) => w.annualKg)) / 12), weeks: ws.length, byCategory };
    });
}

export type Change = { key: string; name: string; deltaPct: number; good: boolean };

/** Category changes between the last two logged months, biggest movers first. Down is good. */
export function changes(months: MonthTotal[], limit = 3): Change[] {
  if (months.length < 2) return [];
  const [prev, curr] = months.slice(-2);
  const out: Change[] = [];
  for (const [key, c] of Object.entries(curr.byCategory)) {
    const p = prev.byCategory[key]?.kg ?? 0;
    if (p < 1) continue;
    const deltaPct = Math.round(((c.kg - p) / p) * 100);
    if (deltaPct !== 0) out.push({ key, name: c.label, deltaPct, good: deltaPct < 0 });
  }
  return out.sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct)).slice(0, limit);
}

export type WeekMark = "done" | "grace" | "miss" | "now";
export type Streak = { weeks: number; graceLeft: boolean; pattern: WeekMark[] };

/**
 * Consecutive weeks logged, counting back from this week. This week not being logged yet does not break the
 * streak. One missed week per calendar month is forgiven (a grace skip), but only when the streak continues
 * on the far side of the gap. `pattern` is the last `span` weeks, oldest first, ending with this week.
 */
export function streak(loggedWeeks: Iterable<string>, today: Date, span = 8): Streak {
  const logged = new Set(loggedWeeks);
  const now = weekStart(today);
  const marks = new Map<string, WeekMark>();
  const graceUsed = new Set<string>();
  let weeks = 0;
  if (logged.has(now)) { weeks = 1; marks.set(now, "done"); } else marks.set(now, "now");
  for (let w = addWeeks(now, -1), guard = 0; guard < 600; w = addWeeks(w, -1), guard++) {
    if (logged.has(w)) { weeks++; marks.set(w, "done"); continue; }
    const m = monthKey(w);
    if (!graceUsed.has(m) && logged.has(addWeeks(w, -1))) { graceUsed.add(m); marks.set(w, "grace"); continue; }
    break;
  }
  const pattern: WeekMark[] = [];
  for (let k = span - 1; k >= 0; k--) pattern.push(marks.get(addWeeks(now, -k)) ?? "miss");
  return { weeks, graceLeft: !graceUsed.has(monthKey(now)), pattern };
}

/** Ledger line for a points entry. */
export const pointsLabel = (p: { reason: string; ref: string }) => (p.reason === "log_week" ? `Logged the week of ${dayLabel(p.ref)}` : (REASON_LABELS[p.reason] ?? p.reason));
