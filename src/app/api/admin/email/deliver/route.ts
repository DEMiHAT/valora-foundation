import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { sameOrigin, rate, errorResponse } from "@/lib/http";
import { drainEmailOutbox } from "@/lib/email";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireSession();
    await rate(request, "email-deliver", 5);
    return NextResponse.json(await drainEmailOutbox(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
