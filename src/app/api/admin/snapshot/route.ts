import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { paymentMode, checkoutConfigured } from "@/lib/payment-configuration";
import { registrationTotals } from "@/lib/registration-totals";
import { events } from "@/data/events";
import { errorResponse } from "@/lib/http";
export async function GET() {
  try {
    await requireSession();
    const state = await repository().snapshot();
    return NextResponse.json(
      {
        state,
        paymentMode: paymentMode(),
        checkoutReady: events.every(e => checkoutConfigured(e)),
        totals: Object.fromEntries(events.map(e => [e.id, registrationTotals(state, e.id)])),
        events: events.map((e) => ({
          ...e,
          categories: state.matrices[e.id] ?? e.categories,
          matrixApproved: process.env[e.matrixApprovalEnvKey] === "true",
        })),
        provider:
          process.env.DATA_PROVIDER === "supabase"
            ? "Supabase PostgreSQL"
            : process.env.DATA_PROVIDER === "apps-script"
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
