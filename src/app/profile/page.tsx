import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";
import { getPersona, listPoints, listWeeklyLogs } from "@/db/queries";
import { listAdopted } from "@/db/community-queries";
import { ACTION_LABELS } from "@/data/mock";
import { isModerator } from "@/lib/moderation";
import { dayLabel, monthKey, monthName, pointsLabel, streak, toIso } from "@/lib/rules";
import ProfileView from "./ProfileView";

/** Reads the member's public identity, points and streak on the server. */
export const dynamic = "force-dynamic";

export default async function Profile() {
  const { data } = await getAuth().getSession();
  if (!data?.user) redirect("/sign-in?next=/profile");
  const user = data.user;
  const [persona, points, logs, adopted] = await Promise.all([getPersona(user.id), listPoints(user.id), listWeeklyLogs(user.id), listAdopted(user.id)]);
  const since = new Date(user.createdAt);
  return (
    <ProfileView
      persona={{ displayName: persona?.displayName ?? user.name ?? "Quiet Fern", character: persona?.character ?? "fern" }}
      memberSince={`${monthName(monthKey(toIso(since)))} ${since.getUTCFullYear()}`}
      points={points.map((p) => ({ date: dayLabel(toIso(p.createdAt)), what: pointsLabel(p), pts: p.points }))}
      lifetime={points.reduce((s, p) => s + p.points, 0)}
      streak={streak(logs.map((l) => l.weekStart), new Date())}
      adopted={adopted.map((a) => ({ action: a.action, label: ACTION_LABELS[a.action as keyof typeof ACTION_LABELS] ?? a.action, since: dayLabel(toIso(a.adoptedAt)) }))}
      moderator={isModerator(user.email)}
    />
  );
}
