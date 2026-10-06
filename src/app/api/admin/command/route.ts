import { after } from "next/server";
import { safelyDrainEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { commandSchema } from "@/lib/validation";
import { sameOrigin, jsonBody, errorResponse, rate } from "@/lib/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const session = await requireSession();
    await rate(request, "admin-command", 60);
    const command = commandSchema.parse(await jsonBody(request));
    const result = await repository().command(command, session.username);
    after(safelyDrainEmail);
    return NextResponse.json(
      { ok: true, result },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
