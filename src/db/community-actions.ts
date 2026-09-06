"use server";
import { revalidatePath } from "next/cache";
import { and, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@/lib/auth/server";
import { getDb } from "@/db";
import { challengeMembers, challenges, personas, pointsLedger, postPhotos, posts, reactions, reports, type PostStatus, type ReactionKind } from "@/db/schema";
import { CATEGORIES } from "@/data/mock";
import { hasLink, isModerator } from "@/lib/moderation";
import { processPhoto, sniffImage } from "@/lib/photos";
import { LIMITS, POINTS } from "@/lib/rules";

type Fail = { ok: false; error: string };
const fail = (error: string): Fail => ({ ok: false, error });
const zodOr = (e: unknown, fallback: string) => (e instanceof z.ZodError ? "Something in the form does not look right. Check it and try again." : fallback);

async function currentUser() {
  const { data } = await getAuth().getSession();
  return data?.user ?? null;
}

/** Everyone who posts gets a persona row, so the feed can show a name without touching the auth tables. */
async function ensurePersona(user: { id: string; name: string }) {
  await getDb().insert(personas).values({ userId: user.id, displayName: user.name || "A member" }).onConflictDoNothing();
}

const award = async (userId: string, points: number, reason: string, ref: string) => {
  const rows = await getDb().insert(pointsLedger).values({ userId, points, reason, ref }).onConflictDoNothing().returning({ id: pointsLedger.id });
  return rows.length ? points : 0;
};

const postSchema = z.object({
  category: z.enum(CATEGORIES.filter((c) => c !== "All") as [string, ...string[]]),
  title: z.string().trim().min(5).max(120),
  body: z.string().trim().min(10).max(2000),
  impactKg: z.coerce.number().min(0).max(100000).default(0),
});

export type CreatePostResult = { ok: true; id: string; pointsAwarded: number } | Fail;

/** Creates a post from a form with up to four photos. The browser downsizes photos first; the server re-encodes and strips metadata regardless. */
export async function createPost(form: FormData): Promise<CreatePostResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in to share.");
    const p = postSchema.parse({ category: form.get("category"), title: form.get("title"), body: form.get("body"), impactKg: form.get("impactKg") || 0 });
    const db = getDb();
    const since = new Date(Date.now() - 86_400_000);
    const [{ n }] = await db.select({ n: count() }).from(posts).where(and(eq(posts.userId, user.id), gte(posts.createdAt, since)));
    if (n >= LIMITS.postsPerDay) return fail(`That is ${LIMITS.postsPerDay} posts in a day, which is the limit. Tomorrow is fine.`);
    const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / 86_400_000;
    if (accountAgeDays < LIMITS.newAccountLinkDays && hasLink(`${p.title} ${p.body}`)) return fail("New accounts cannot include links for their first week. Describe it in words for now.");
    const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, LIMITS.photosPerPost);
    const processed: { large: Buffer; thumb: Buffer; width: number; height: number; alt: string }[] = [];
    for (const f of files) {
      if (f.size > LIMITS.photoBytes) return fail("One of the photos is too large. Keep each under 8 MB.");
      const buf = Buffer.from(await f.arrayBuffer());
      if (!sniffImage(buf)) return fail("Photos must be JPG, PNG or WebP.");
      processed.push({ ...(await processPhoto(buf)), alt: p.title });
    }
    await ensurePersona(user);
    const [post] = await db.insert(posts).values({ userId: user.id, category: p.category, title: p.title, body: p.body, impactKg: Math.round(p.impactKg) }).returning({ id: posts.id });
    try {
      for (const [position, ph] of processed.entries()) await db.insert(postPhotos).values({ postId: post.id, position, ...ph });
    } catch (e) {
      await db.delete(posts).where(eq(posts.id, post.id));
      throw e;
    }
    const pointsAwarded = await award(user.id, POINTS.sharePost, "share_post", post.id);
    revalidatePath("/community");
    revalidatePath("/profile");
    return { ok: true, id: post.id, pointsAwarded };
  } catch (e) {
    return fail(zodOr(e, "Could not pin that to the board. Try again in a moment."));
  }
}

export type ReactResult = { ok: true; on: boolean } | Fail;

export async function toggleReaction(postId: unknown, kind: unknown): Promise<ReactResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in first.");
    const id = z.string().uuid().parse(postId);
    const k = z.enum(["helpful", "did_it"]).parse(kind) as ReactionKind;
    const db = getDb();
    const gone = await db.delete(reactions).where(and(eq(reactions.postId, id), eq(reactions.userId, user.id), eq(reactions.kind, k))).returning({ postId: reactions.postId });
    if (!gone.length) await db.insert(reactions).values({ postId: id, userId: user.id, kind: k }).onConflictDoNothing();
    revalidatePath("/community");
    return { ok: true, on: !gone.length };
  } catch (e) {
    return fail(zodOr(e, "Could not save that. Try again."));
  }
}

export type ReportResult = { ok: true; hidden: boolean } | Fail;

/** One report per member per post. Three open reports hide the post until a moderator looks. */
export async function reportPost(postId: unknown, reason: unknown): Promise<ReportResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in first.");
    const id = z.string().uuid().parse(postId);
    const why = z.string().trim().min(3).max(300).parse(reason);
    const db = getDb();
    const since = new Date(Date.now() - 3_600_000);
    const [{ n }] = await db.select({ n: count() }).from(reports).where(and(eq(reports.reporterId, user.id), gte(reports.createdAt, since)));
    if (n >= LIMITS.reportsPerHour) return fail("That is a lot of reports in an hour. A person will look at the ones you sent.");
    await db.insert(reports).values({ postId: id, reporterId: user.id, reason: why }).onConflictDoNothing();
    const [{ open }] = await db.select({ open: count() }).from(reports).where(and(eq(reports.postId, id), eq(reports.resolved, false)));
    let hidden = false;
    if (open >= 3) {
      await db.update(posts).set({ status: "pending", updatedAt: new Date() }).where(and(eq(posts.id, id), eq(posts.status, "visible")));
      hidden = true;
    }
    revalidatePath("/community");
    return { ok: true, hidden };
  } catch (e) {
    return fail(zodOr(e, "Could not send that report. Try again."));
  }
}

export type ChallengeResult = { ok: true; status: "joined" | "done"; pointsAwarded: number } | Fail;

export async function joinChallenge(challengeId: unknown): Promise<ChallengeResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in first.");
    const id = z.string().uuid().parse(challengeId);
    await getDb().insert(challengeMembers).values({ challengeId: id, userId: user.id }).onConflictDoNothing();
    revalidatePath("/community");
    return { ok: true, status: "joined", pointsAwarded: 0 };
  } catch (e) {
    return fail(zodOr(e, "Could not join. Try again."));
  }
}

export async function completeChallenge(challengeId: unknown): Promise<ChallengeResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in first.");
    const id = z.string().uuid().parse(challengeId);
    const db = getDb();
    const [c] = await db.select({ id: challenges.id }).from(challenges).where(eq(challenges.id, id)).limit(1);
    if (!c) return fail("That challenge is gone.");
    await db.insert(challengeMembers).values({ challengeId: id, userId: user.id, status: "done", doneAt: new Date() }).onConflictDoUpdate({ target: [challengeMembers.challengeId, challengeMembers.userId], set: { status: "done", doneAt: new Date() } });
    const pointsAwarded = await award(user.id, POINTS.challengeDone, "challenge_done", id);
    revalidatePath("/community");
    revalidatePath("/profile");
    return { ok: true, status: "done", pointsAwarded };
  } catch (e) {
    return fail(zodOr(e, "Could not mark that done. Try again."));
  }
}

export type ModerateResult = { ok: true } | Fail;

/** Owners may remove their own posts; moderators may hide, restore, or dismiss reports. */
export async function deletePost(postId: unknown): Promise<ModerateResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in first.");
    const id = z.string().uuid().parse(postId);
    const where = isModerator(user.email) ? eq(posts.id, id) : and(eq(posts.id, id), eq(posts.userId, user.id));
    const gone = await getDb().delete(posts).where(where).returning({ id: posts.id });
    if (!gone.length) return fail("That post is not yours to remove.");
    revalidatePath("/community");
    revalidatePath("/community/review");
    return { ok: true };
  } catch (e) {
    return fail(zodOr(e, "Could not remove that post."));
  }
}

export async function moderatePost(postId: unknown, action: unknown): Promise<ModerateResult> {
  try {
    const user = await currentUser();
    if (!user || !isModerator(user.email)) return fail("Only moderators can do that.");
    const id = z.string().uuid().parse(postId);
    const act = z.enum(["hide", "restore", "dismiss"]).parse(action);
    const db = getDb();
    const status: PostStatus | null = act === "hide" ? "hidden" : act === "restore" ? "visible" : null;
    if (status) await db.update(posts).set({ status, updatedAt: new Date() }).where(eq(posts.id, id));
    if (act === "dismiss") await db.update(posts).set({ status: "visible", updatedAt: new Date() }).where(and(eq(posts.id, id), eq(posts.status, "pending")));
    await db.update(reports).set({ resolved: true, resolution: act }).where(and(eq(reports.postId, id), eq(reports.resolved, false)));
    revalidatePath("/community");
    revalidatePath("/community/review");
    return { ok: true };
  } catch (e) {
    return fail(zodOr(e, "Could not apply that."));
  }
}
