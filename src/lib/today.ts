import { cookies } from "next/headers";
import { localDate, TZ_COOKIE } from "@/lib/rules";

/**
 * Today, for the person making this request: midnight UTC of their local calendar date. Pass it wherever a week
 * or month is keyed (weekStart, monthKey, streak) so a Sunday-evening log in the Americas stays in Sunday's week.
 * Without the cookie, or with one that is not a time zone, this is the UTC date.
 */
export async function today(): Promise<Date> {
  let tz: string | undefined;
  try { tz = (await cookies()).get(TZ_COOKIE)?.value; } catch { /* outside a request */ }
  return new Date(`${localDate(new Date(), tz)}T00:00:00Z`);
}
