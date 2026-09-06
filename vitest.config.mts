import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // Unit tests live next to the code; browser journeys in e2e/ belong to Playwright.
  test: { environment: "node", include: ["src/**/*.test.ts"], exclude: ["e2e/**", "node_modules/**", ".next/**"] },
});
