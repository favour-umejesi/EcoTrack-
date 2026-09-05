import { sql } from "drizzle-orm";
import { check, date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
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
