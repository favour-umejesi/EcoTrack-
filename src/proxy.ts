import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "@/lib/auth/server";

/** Members only: the ledger, the community and the profile. Guests keep the calculator and insights. */
export const config = { matcher: ["/track/:path*", "/community/:path*", "/profile/:path*"] };

type Guard = ReturnType<ReturnType<typeof getAuth>["middleware"]>;
let guard: Guard | undefined;

export default async function proxy(request: NextRequest) {
  guard ??= getAuth().middleware({ loginUrl: "/sign-in" });
  const res = await guard(request);
  // Neon's redirect drops the requested path; put it back so sign-in can return the reader there.
  const location = res.headers.get("location");
  if (!location) return res;
  const url = new URL(location, request.url);
  if (url.pathname !== "/sign-in" || url.searchParams.has("next")) return res;
  url.searchParams.set("next", request.nextUrl.pathname);
  const headers = new Headers(res.headers);
  headers.set("location", url.toString());
  return new NextResponse(null, { status: res.status, headers });
}
