import { getAuth } from "@/lib/auth/server";

type Ctx = { params: Promise<{ path: string[] }> };
export const GET = (request: Request, ctx: Ctx) => getAuth().handler().GET(request, ctx);
export const POST = (request: Request, ctx: Ctx) => getAuth().handler().POST(request, ctx);
