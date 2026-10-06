import { after } from "next/server";
import { safelyDrainEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { registrationSchema } from "@/lib/validation";
import { sameOrigin, jsonBody, errorResponse, rate } from "@/lib/http";
import { getEvent } from "@/data/events";
import { DomainError } from "@/lib/domain";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const session = await requireSession();
    await rate(request, "admin-import", 30);
    const input = registrationSchema.parse(await jsonBody(request));
    const event = getEvent(input.event_id);
    if (!event) throw new DomainError("NOT_FOUND", "Event not found.", 404);
    if (
      process.env.NODE_ENV === "production" &&
      process.env[event.matrixApprovalEnvKey] !== "true"
    )
      throw new DomainError(
        "MATRIX_DRAFT",
        "Review the portfolio matrices and enable the event’s approval setting before importing registrations.",
        409
      );
    const result = await repository().importRegistration(
      input,
      session.username
    );
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
