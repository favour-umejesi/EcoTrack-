import { getAuth } from "@/lib/auth/server";
import { latestWeeklyLog } from "@/db/queries";
import { monthKey, monthName, toIso } from "@/lib/rules";
import InsightsView from "./InsightsView";

/** Members see their latest logged week from the database; guests see what is saved in their browser. */
export const dynamic = "force-dynamic";

async function currentUserId() {
  try { return (await getAuth().getSession()).data?.user?.id ?? null; } catch { return null; }
}

export default async function Insights() {
  const userId = await currentUserId();
  const latest = userId ? await latestWeeklyLog(userId) : null;
  const now = new Date();
  return <InsightsView memberInputs={latest?.inputs ?? null} title={`Ledger for ${monthName(monthKey(toIso(now)))} ${now.getUTCFullYear()}`} />;
}
