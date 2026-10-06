import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { events } from "@/data/events";
import { errorResponse } from "@/lib/http";
export async function GET() {
  try {
    await requireSession();
    const state = await repository().snapshot();
    return NextResponse.json(
      {
        state,
        events: events.map((e) => ({
          ...e,
          categories: state.matrices[e.id] ?? e.categories,
          matrixApproved: process.env[e.matrixApprovalEnvKey] === "true",
        })),
        provider:
          process.env.DATA_PROVIDER === "apps-script"
            ? "Google Sheets"
            : "Local development",
        emailConfigured: Boolean(
          process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASSWORD &&
            process.env.EMAIL_FROM
        ),
        emailProvider:
          process.env.EMAIL_PROVIDER === "nodemailer"
            ? "Nodemailer SMTP"
            : "Outbox only",
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
