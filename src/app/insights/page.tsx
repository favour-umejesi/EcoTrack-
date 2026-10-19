import { getAuth } from "@/lib/auth/server";
import { latestWeeklyLog } from "@/db/queries";
import { listAdopted } from "@/db/community-queries";
import { monthKey, monthName, toIso } from "@/lib/rules";
import { today } from "@/lib/today";
import { normalise } from "@/lib/engine";
import InsightsView from "./InsightsView";

/** Members see their latest logged week from the database; guests see what is saved in their browser. */
export const dynamic = "force-dynamic";

async function currentUserId() {
  try { return (await getAuth().getSession()).data?.user?.id ?? null; } catch { return null; }
}

export default async function Insights() {
  const userId = await currentUserId();
  const [latest, adopted] = userId ? await Promise.all([latestWeeklyLog(userId), listAdopted(userId)]) : [null, []];
  const now = await today();
  return <InsightsView memberInputs={latest ? normalise(latest.inputs) : null} adopted={adopted.map((a) => a.action)} member={!!userId} title={`Ledger for ${monthName(monthKey(toIso(now)))} ${now.getUTCFullYear()}`} />;
}
