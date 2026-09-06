import { sql } from "drizzle-orm";
import { boolean, check, customType, date, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { Category, Inputs } from "@/lib/engine";

/**
 * First cut of the member tables. Users themselves live in the `neon_auth` schema that Neon Auth manages;
 * `user_id` here is that user's id, stored as text without a cross-schema foreign key so Neon can manage its
 * own tables freely. Email never appears in these tables.
 */

/** The public identity. Everything the community sees comes from here, never from the auth user. */
export const personas = pgTable("personas", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name").notNull(),
  character: text("character").notNull().default("fern"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One line per computed category, stored with the log so old months can be shown without recomputing. */
export type StoredLine = { key: Category; label: string; kg: number };

/**
 * One row per member per week: what they logged and what the engine made of it, with the factor-set version,
 * so a future factor update can recompute every week fairly. Weeks start on Monday (UTC).
 */
export const weeklyLogs = pgTable(
  "weekly_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    weekStart: date("week_start").notNull(),
    inputs: jsonb("inputs").$type<Inputs>().notNull(),
    factorSet: text("factor_set").notNull(),
    /** kg CO2e per year at this week's pace, the engine's total. */
    annualKg: integer("annual_kg").notNull(),
    lines: jsonb("lines").$type<StoredLine[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("weekly_logs_user_week").on(t.userId, t.weekStart)],
);

/** Append-only and positive-only, by rule and by database constraint. `ref` makes each award happen once. */
export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    points: integer("points").notNull(),
    reason: text("reason").notNull(),
    ref: text("ref").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("points_ledger_user").on(t.userId, t.createdAt),
    uniqueIndex("points_ledger_once").on(t.userId, t.reason, t.ref),
    check("points_positive", sql`${t.points} > 0`),
  ],
);

/** Postgres bytea. The Neon HTTP driver wants hex text on the way in and may hand back either hex text or a Buffer. */
const bytea = customType<{ data: Buffer; driverData: string | Buffer }>({
  dataType: () => "bytea",
  toDriver: (value) => `\\x${value.toString("hex")}`,
  fromDriver: (value) => (typeof value === "string" ? Buffer.from(value.replace(/^\\x/, ""), "hex") : Buffer.from(value)),
});

/** An action from the insights catalog that a member has taken on. Adopting is idempotent. */
export const userActions = pgTable(
  "user_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    adoptedAt: timestamp("adopted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_actions_once").on(t.userId, t.action)],
);

export type PostStatus = "visible" | "pending" | "hidden";

/** A structured community post: something a member actually did, with a category and an estimated impact. */
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    impactKg: integer("impact_kg").notNull().default(0),
    status: text("status").$type<PostStatus>().notNull().default("visible"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("posts_status_created").on(t.status, t.createdAt), index("posts_user").on(t.userId)],
);

/**
 * Photos live in the database for now (Neon's free plan allows 0.5 GB), behind `src/lib/photos.ts`, so moving
 * them to object storage later is a one-module change. Both sizes are WebP with all metadata stripped.
 */
export const postPhotos = pgTable(
  "post_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    large: bytea("large").notNull(),
    thumb: bytea("thumb").notNull(),
    alt: text("alt").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("post_photos_post").on(t.postId, t.position)],
);

export type ReactionKind = "helpful" | "did_it";

export const reactions = pgTable(
  "reactions",
  {
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    kind: text("kind").$type<ReactionKind>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId, t.kind] })],
);

/** One report per member per post. A post with three open reports is hidden pending review. */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id").notNull(),
    reason: text("reason").notNull(),
    resolved: boolean("resolved").notNull().default(false),
    resolution: text("resolution"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reports_open").on(t.resolved, t.createdAt), uniqueIndex("reports_once").on(t.postId, t.reporterId)],
);

/** The weekly challenge, one row per week, created on first view of that week. */
export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekStart: date("week_start").notNull().unique(),
  title: text("title").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ChallengeStatus = "joined" | "done";

export const challengeMembers = pgTable(
  "challenge_members",
  {
    challengeId: uuid("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    status: text("status").$type<ChallengeStatus>().notNull().default("joined"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    doneAt: timestamp("done_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.challengeId, t.userId] })],
);
