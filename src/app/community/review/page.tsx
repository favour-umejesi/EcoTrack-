import { notFound } from "next/navigation";
import { getAuth } from "@/lib/auth/server";
import { listFeed, listOpenReports } from "@/db/community-queries";
import { isModerator } from "@/lib/moderation";
import ReviewView from "./ReviewView";

/** Moderation queue. Anyone who is not on the moderator list sees a 404, not a locked door. */
export const dynamic = "force-dynamic";

export default async function Review() {
  const session = await getAuth().getSession().catch(() => null);
  const user = session?.data?.user;
  if (!user || !isModerator(user.email)) notFound();
  const [reports, posts] = await Promise.all([listOpenReports(), listFeed(user.id, { statuses: ["visible", "pending", "hidden"], limit: 200 })]);
  const flagged = posts.filter((p) => p.openReports > 0 || p.status !== "visible");
  return <ReviewView posts={flagged} reports={reports} />;
}
