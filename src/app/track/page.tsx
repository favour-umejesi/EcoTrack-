import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";
import { listPoints, listWeeklyLogs } from "@/db/queries";
import { changes, monthKey, monthName, monthlyTotals, pointsLabel, streak, toIso, weekStart } from "@/lib/rules";
import TrackView from "./TrackView";

/** Reads the member's ledger on the server and hands plain data to the view. */
export const dynamic = "force-dynamic";

export default async function Track() {
  const { data } = await getAuth().getSession();
  if (!data?.user) redirect("/sign-in?next=/track");
  const [logs, points] = await Promise.all([listWeeklyLogs(data.user.id), listPoints(data.user.id)]);
  const now = new Date();
  const months = monthlyTotals(logs);
  const first = months[0] ?? null;
  const last = months.at(-1) ?? null;
  const prev = months.length >= 2 ? months[months.length - 2] : null;
  const thisMonth = monthKey(toIso(now));
  return (
    <TrackView
      history={months.map((m) => ({ month: m.month, kg: m.kg }))}
      latest={last ? { kg: last.kg, name: monthName(last.key), weeks: last.weeks } : null}
      sincePct={first && last && first !== last ? Math.round(((last.kg - first.kg) / first.kg) * 100) : null}
      firstMonth={first ? monthName(first.key) : null}
      prevMonth={prev ? monthName(prev.key) : null}
      changes={changes(months)}
      streak={streak(logs.map((l) => l.weekStart), now)}
      pointsMonth={points.filter((p) => monthKey(toIso(p.createdAt)) === thisMonth).map((p) => ({ what: pointsLabel(p), pts: p.points }))}
      thisWeek={weekStart(now)}
      thisWeekLogged={logs.some((l) => l.weekStart === weekStart(now))}
    />
  );
}
