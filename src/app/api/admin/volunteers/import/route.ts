import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { volunteerImportSchema } from "@/lib/validation";
import { sameOrigin, jsonBody, errorResponse, rate } from "@/lib/http";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const session = await requireSession();
    await rate(request, "admin-volunteer-import", 10);
    const input = volunteerImportSchema.parse(await jsonBody(request, 1024 * 1024));
    const result = await repository().importVolunteers(input.volunteers, session.username);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export const runtime = "nodejs";
