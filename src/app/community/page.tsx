import { getAuth } from "@/lib/auth/server";
import { getChallenge, listFeed } from "@/db/community-queries";
import { isModerator } from "@/lib/moderation";
import { weekStart } from "@/lib/rules";
import CommunityView from "./CommunityView";

/** The board: real posts, reactions and this week's challenge, read on the server for the signed-in member. */
export const dynamic = "force-dynamic";

export default async function Community() {
  const session = await getAuth().getSession().catch(() => null);
  const user = session?.data?.user ?? null;
  const [posts, challenge] = await Promise.all([listFeed(user?.id ?? null), getChallenge(weekStart(new Date()), user?.id ?? null)]);
  return <CommunityView posts={posts} challenge={challenge} member={!!user} moderator={isModerator(user?.email)} />;
}
