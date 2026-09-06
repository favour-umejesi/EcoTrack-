import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { challengeMembers, challenges, personas, postPhotos, posts, reactions, reports, userActions, type PostStatus } from "@/db/schema";
import { CHALLENGE_ROTATION } from "@/lib/moderation";
import { fromIso } from "@/lib/rules";

/** Read side of the community. Everything a page needs arrives as plain data, scoped to the viewer where it matters. */

export type FeedPhoto = { id: string; width: number; height: number; alt: string };
export type FeedPost = {
  id: string; category: string; title: string; body: string; impactKg: number; status: PostStatus; createdAt: string;
  persona: { name: string; character: string }; photos: FeedPhoto[];
  helpful: number; didIt: number; reacted: { helpful: boolean; did_it: boolean }; mine: boolean; openReports: number;
};

export async function listFeed(viewerId: string | null, opts: { statuses?: PostStatus[]; limit?: number } = {}): Promise<FeedPost[]> {
  const db = getDb();
  const statuses = opts.statuses ?? ["visible"];
  const rows = await db
    .select({ post: posts, name: personas.displayName, character: personas.character })
    .from(posts)
    .leftJoin(personas, eq(personas.userId, posts.userId))
    .where(inArray(posts.status, statuses))
    .orderBy(desc(posts.createdAt))
    .limit(opts.limit ?? 50);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.post.id);
  const [photos, reacts, openReports] = await Promise.all([
    db.select({ id: postPhotos.id, postId: postPhotos.postId, width: postPhotos.width, height: postPhotos.height, alt: postPhotos.alt, position: postPhotos.position }).from(postPhotos).where(inArray(postPhotos.postId, ids)),
    db.select({ postId: reactions.postId, userId: reactions.userId, kind: reactions.kind }).from(reactions).where(inArray(reactions.postId, ids)),
    db.select({ postId: reports.postId, n: sql<number>`count(*)::int` }).from(reports).where(and(inArray(reports.postId, ids), eq(reports.resolved, false))).groupBy(reports.postId),
  ]);
  return rows.map(({ post, name, character }) => ({
    id: post.id, category: post.category, title: post.title, body: post.body, impactKg: post.impactKg, status: post.status, createdAt: post.createdAt.toISOString(),
    persona: { name: name ?? "A member", character: character ?? "fern" },
    photos: photos.filter((p) => p.postId === post.id).sort((a, b) => a.position - b.position).map(({ id, width, height, alt }) => ({ id, width, height, alt })),
    helpful: reacts.filter((r) => r.postId === post.id && r.kind === "helpful").length,
    didIt: reacts.filter((r) => r.postId === post.id && r.kind === "did_it").length,
    reacted: {
      helpful: !!viewerId && reacts.some((r) => r.postId === post.id && r.userId === viewerId && r.kind === "helpful"),
      did_it: !!viewerId && reacts.some((r) => r.postId === post.id && r.userId === viewerId && r.kind === "did_it"),
    },
    mine: post.userId === viewerId,
    openReports: openReports.find((o) => o.postId === post.id)?.n ?? 0,
  }));
}

export async function getPhoto(id: string, size: "large" | "thumb") {
  const [row] = await getDb().select({ bytes: size === "thumb" ? postPhotos.thumb : postPhotos.large, postId: postPhotos.postId }).from(postPhotos).where(eq(postPhotos.id, id)).limit(1);
  if (!row) return null;
  const [post] = await getDb().select({ status: posts.status }).from(posts).where(eq(posts.id, row.postId)).limit(1);
  return { bytes: row.bytes, status: post?.status ?? "hidden" };
}

export type ChallengeView = { id: string; title: string; text: string; joined: number; done: number; mine: "none" | "joined" | "done" };

/** This week's challenge, created from the rotation the first time anyone looks at it. */
export async function getChallenge(weekStart: string, viewerId: string | null): Promise<ChallengeView> {
  const db = getDb();
  let [row] = await db.select().from(challenges).where(eq(challenges.weekStart, weekStart)).limit(1);
  if (!row) {
    const weekIndex = Math.floor(fromIso(weekStart).getTime() / (7 * 86_400_000));
    const pick = CHALLENGE_ROTATION[weekIndex % CHALLENGE_ROTATION.length];
    [row] = await db.insert(challenges).values({ weekStart, ...pick }).onConflictDoNothing().returning();
    if (!row) [row] = await db.select().from(challenges).where(eq(challenges.weekStart, weekStart)).limit(1);
  }
  const members = await db.select({ userId: challengeMembers.userId, status: challengeMembers.status }).from(challengeMembers).where(eq(challengeMembers.challengeId, row.id));
  const mine = members.find((m) => m.userId === viewerId)?.status ?? "none";
  return { id: row.id, title: row.title, text: row.text, joined: members.length, done: members.filter((m) => m.status === "done").length, mine };
}

export async function listAdopted(userId: string) {
  return getDb().select({ action: userActions.action, adoptedAt: userActions.adoptedAt }).from(userActions).where(eq(userActions.userId, userId)).orderBy(desc(userActions.adoptedAt));
}

export type OpenReport = { id: string; postId: string; reason: string; createdAt: string };

export async function listOpenReports(): Promise<OpenReport[]> {
  const rows = await getDb().select({ id: reports.id, postId: reports.postId, reason: reports.reason, createdAt: reports.createdAt }).from(reports).where(eq(reports.resolved, false)).orderBy(desc(reports.createdAt)).limit(200);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}
