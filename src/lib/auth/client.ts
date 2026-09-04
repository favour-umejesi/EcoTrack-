"use client";
import { createAuthClient } from "@neondatabase/auth/next";

/** Browser side of Neon Auth. Talks to /api/auth, which proxies to Neon. */
export const authClient = createAuthClient();
