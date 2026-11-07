import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { paymentMode, checkoutConfigured } from "@/lib/payment-configuration";
import { registrationTotals } from "@/lib/registration-totals";
import { events } from "@/data/events";
import { volunteerPrograms } from "@/data/volunteer-programs";
import { errorResponse } from "@/lib/http";
export async function GET() {
  try {
    await requireSession();
    const state = await repository().snapshot();
    const operationalEvents = events.filter((event) =>
      (state.managed_events ?? []).some(
        (managed) =>
          managed.status === "PUBLISHED" &&
          (managed.event_id === event.id || managed.slug === event.slug)
      )
    );
    return NextResponse.json(
      {
        state,
        paymentMode: paymentMode(),
        checkoutReady:
          operationalEvents.length > 0 &&
          operationalEvents.every((event) => checkoutConfigured(event)),
        totals: Object.fromEntries(
          operationalEvents.map((event) => [
            event.id,
            registrationTotals(state, event.id),
          ])
        ),
        events: operationalEvents.map((e) => ({
          ...e,
          categories: state.matrices[e.id] ?? e.categories,
          matrixApproved: process.env[e.matrixApprovalEnvKey] === "true",
        })),
        volunteerPrograms,
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
