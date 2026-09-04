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
export const explain = (e: { code?: string; message?: string } | null | undefined) => (e?.code && MESSAGES[e.code]) || e?.message || FALLBACK;
