/** Turns Better Auth error codes into copy in the ledger's voice. */
export const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password do not match any ledger.",
  USER_ALREADY_EXISTS: "There is already a ledger under that email. Sign in instead.",
  EMAIL_NOT_VERIFIED: "Open the link we posted to your email first, then sign in.",
  PASSWORD_TOO_SHORT: "Use at least eight characters for the password.",
  INVALID_EMAIL: "That does not look like an email address.",
  USER_NOT_FOUND: "No ledger under that email yet.",
};
const FALLBACK = "Something went wrong on our side. Try again in a moment.";
/** Neon's thrown errors carry the server's English message rather than a code; recognise the common ones. */
const BY_TEXT: [RegExp, keyof typeof MESSAGES][] = [
  [/invalid email or password|invalid credentials|wrong password/i, "INVALID_EMAIL_OR_PASSWORD"],
  [/already exists|already registered/i, "USER_ALREADY_EXISTS"],
  [/not verified/i, "EMAIL_NOT_VERIFIED"],
  [/password.*(short|at least)/i, "PASSWORD_TOO_SHORT"],
  [/user not found|no user/i, "USER_NOT_FOUND"],
  [/invalid email/i, "INVALID_EMAIL"],
];
export const explain = (e: { code?: string; message?: string; status?: number } | null | undefined) => {
  if (!e) return FALLBACK;
  if (e.code && MESSAGES[e.code]) return MESSAGES[e.code];
  const hit = e.message ? BY_TEXT.find(([re]) => re.test(e.message!)) : undefined;
  if (hit) return MESSAGES[hit[1]];
  if (e.status === 401) return MESSAGES.INVALID_EMAIL_OR_PASSWORD;
  return e.message || FALLBACK;
};

export type AuthErr = { code?: string; message?: string; status?: number };
export type Attempt<T> = { data: T | null; error: AuthErr | null };

/**
 * Neon's client throws an AuthApiError on a failed call instead of returning `{ error }` like plain Better Auth.
 * This accepts either shape, so pages can always read `error` and never leave the user without a message.
 */
export async function attempt<T>(call: Promise<{ data?: T | null; error?: AuthErr | null } | null | undefined>): Promise<Attempt<T>> {
  try {
    const r = await call;
    return { data: (r?.data ?? null) as T | null, error: r?.error ?? null };
  } catch (e) {
    const err = e as Partial<AuthErr> & { name?: string };
    return { data: null, error: { code: err?.code, message: err?.message ?? String(e), status: err?.status } };
  }
}
