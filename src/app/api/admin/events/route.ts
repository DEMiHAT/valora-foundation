import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { managedEventCommandSchema } from "@/lib/validation";
import { sameOrigin, jsonBody, errorResponse, rate } from "@/lib/http";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const session = await requireSession();
    await rate(request, "admin-events", 60);
    const command = managedEventCommandSchema.parse(await jsonBody(request));
    const result = await repository().manageEvent(command, session.username);
    return NextResponse.json({ ok: true, result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export const runtime = "nodejs";
