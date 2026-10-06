import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { drainEmailOutbox } from "@/lib/email";
import { errorResponse } from "@/lib/http";
import { DomainError } from "@/lib/domain";
export const runtime = "nodejs";
export const maxDuration = 60;
async function processOutbox(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || secret.length < 32)
      throw new DomainError("CONFIG", "Email worker is not configured.", 503);
    const provided = request.headers.get("authorization") ?? "",
      expected = "Bearer " + secret;
    if (
      Buffer.byteLength(provided) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
    )
      throw new DomainError("UNAUTHENTICATED", "Unauthorised.", 401);
    return NextResponse.json(await drainEmailOutbox(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export const GET = processOutbox;
export const POST = processOutbox;
