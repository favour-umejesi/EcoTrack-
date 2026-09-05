import { defineConfig } from "drizzle-kit";

/** drizzle-kit reads .env itself. `npm run db:generate` writes SQL to ./drizzle, `npm run db:migrate` applies it. */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
