import { NextResponse, type NextRequest } from "next/server";
import { getPhoto } from "@/db/community-queries";
import { getAuth } from "@/lib/auth/server";
import { isModerator } from "@/lib/moderation";

/** Serves a stored photo. Visible posts' photos cache forever (the bytes never change); hidden ones are for moderators only. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 404 });
  const size = req.nextUrl.searchParams.get("size") === "thumb" ? "thumb" : "large";
  const photo = await getPhoto(id, size);
  if (!photo) return new NextResponse(null, { status: 404 });
  const body = new Uint8Array(photo.bytes);
  if (photo.status === "visible") return new NextResponse(body, { headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" } });
  const session = await getAuth().getSession().catch(() => null);
  if (!isModerator(session?.data?.user?.email)) return new NextResponse(null, { status: 404 });
  return new NextResponse(body, { headers: { "content-type": "image/webp", "cache-control": "private, no-store" } });
}
