"use server";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth/server";
import { getDb } from "@/db";
import { challengeMembers, personas, pointsLedger, posts, postPhotos, reactions, reports, userActions, weeklyLogs } from "@/db/schema";
import { photoUrl } from "@/lib/photo-url";

type Fail = { ok: false; error: string };
const fail = (error: string): Fail => ({ ok: false, error });

async function currentUser() {
  const { data } = await getAuth().getSession();
  return data?.user ?? null;
}

export type ExportResult = { ok: true; json: string } | Fail;

/** Everything the app holds about the member, as one JSON document. Photos are linked, not embedded. */
export async function exportMyData(): Promise<ExportResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in first.");
    const db = getDb();
    const id = user.id;
    const [persona, logs, points, adopted, myPosts, myReactions, myChallenges] = await Promise.all([
      db.select({ displayName: personas.displayName, character: personas.character, updatedAt: personas.updatedAt }).from(personas).where(eq(personas.userId, id)),
      db.select({ weekStart: weeklyLogs.weekStart, inputs: weeklyLogs.inputs, factorSet: weeklyLogs.factorSet, annualKg: weeklyLogs.annualKg, lines: weeklyLogs.lines, createdAt: weeklyLogs.createdAt }).from(weeklyLogs).where(eq(weeklyLogs.userId, id)),
      db.select({ points: pointsLedger.points, reason: pointsLedger.reason, ref: pointsLedger.ref, createdAt: pointsLedger.createdAt }).from(pointsLedger).where(eq(pointsLedger.userId, id)),
      db.select({ action: userActions.action, adoptedAt: userActions.adoptedAt }).from(userActions).where(eq(userActions.userId, id)),
      db.select({ id: posts.id, category: posts.category, title: posts.title, body: posts.body, impactKg: posts.impactKg, status: posts.status, createdAt: posts.createdAt }).from(posts).where(eq(posts.userId, id)),
      db.select({ postId: reactions.postId, kind: reactions.kind, createdAt: reactions.createdAt }).from(reactions).where(eq(reactions.userId, id)),
      db.select({ challengeId: challengeMembers.challengeId, status: challengeMembers.status, joinedAt: challengeMembers.joinedAt, doneAt: challengeMembers.doneAt }).from(challengeMembers).where(eq(challengeMembers.userId, id)),
    ]);
    const photos = myPosts.length ? await db.select({ id: postPhotos.id, postId: postPhotos.postId, width: postPhotos.width, height: postPhotos.height }).from(postPhotos).where(sql`${postPhotos.postId} in ${myPosts.map((p) => p.id)}`) : [];
    const doc = {
      exportedAt: new Date().toISOString(),
      account: { id, name: user.name, email: user.email, createdAt: user.createdAt },
      persona: persona[0] ?? null,
      weeklyLogs: logs,
      points,
      adoptedActions: adopted,
      posts: myPosts.map((p) => ({ ...p, photos: photos.filter((ph) => ph.postId === p.id).map((ph) => ({ id: ph.id, width: ph.width, height: ph.height, url: photoUrl(ph.id) })) })),
      reactions: myReactions,
      challenges: myChallenges,
    };
    return { ok: true, json: JSON.stringify(doc, null, 2) };
  } catch {
    return fail("Could not gather your data. Try again in a moment.");
  }
}

export type DeleteResult = { ok: true } | Fail;

/**
 * Hard delete. Removes every row the app holds, then the auth user itself from Neon's schema, so nothing of the
 * person remains. Points, posts and photos go with it; reactions and reports they made are removed too.
 */
export async function deleteMyAccount(): Promise<DeleteResult> {
  try {
    const user = await currentUser();
    if (!user) return fail("Sign in first.");
    const db = getDb();
    const id = user.id;
    await db.delete(posts).where(eq(posts.userId, id)); // cascades photos, reactions and reports on those posts
    await db.delete(reactions).where(eq(reactions.userId, id));
    await db.delete(reports).where(eq(reports.reporterId, id));
    await db.delete(challengeMembers).where(eq(challengeMembers.userId, id));
    await db.delete(userActions).where(eq(userActions.userId, id));
    await db.delete(pointsLedger).where(eq(pointsLedger.userId, id));
    await db.delete(weeklyLogs).where(eq(weeklyLogs.userId, id));
    await db.delete(personas).where(eq(personas.userId, id));
    // Neon Auth's tables live in our database; column names there are camelCase.
    await db.execute(sql`delete from neon_auth.session where "userId" = ${id}::uuid`);
    await db.execute(sql`delete from neon_auth.account where "userId" = ${id}::uuid`);
    await db.execute(sql`delete from neon_auth."user" where id = ${id}::uuid`);
    return { ok: true };
  } catch {
    return fail("Could not delete the account. Nothing was changed; try again in a moment.");
  }
}
