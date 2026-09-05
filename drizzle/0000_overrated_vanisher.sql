CREATE TABLE "personas" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"character" text DEFAULT 'fern' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"ref" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "points_positive" CHECK ("points_ledger"."points" > 0)
);
--> statement-breakpoint
CREATE TABLE "weekly_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"week_start" date NOT NULL,
	"inputs" jsonb NOT NULL,
	"factor_set" text NOT NULL,
	"annual_kg" integer NOT NULL,
	"lines" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "points_ledger_user" ON "points_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "points_ledger_once" ON "points_ledger" USING btree ("user_id","reason","ref");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_logs_user_week" ON "weekly_logs" USING btree ("user_id","week_start");