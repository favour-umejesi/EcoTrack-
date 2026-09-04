import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";

/**
 * Server side of Neon Auth (managed Better Auth). Built lazily so `next build`
 * succeeds without secrets and a missing variable fails loudly on the first request.
 */
let instance: NeonAuth | undefined;
export function getAuth(): NeonAuth {
  if (instance) return instance;
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret) throw new Error("Set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET in .env (see .env.example).");
  instance = createNeonAuth({ baseUrl, cookies: { secret } });
  return instance;
}
