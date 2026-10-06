import { NextResponse, after } from "next/server";
import { z } from "zod";
import { sameOrigin, rate, jsonBody, errorResponse } from "@/lib/http";
import { readSession, fetchOrderPayments } from "@/lib/razorpay";
import { repository } from "@/lib/repository";
import { DomainError } from "@/lib/domain";
import { safelyDrainEmail } from "@/lib/email";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request); await rate(request, "checkout-status", 30);
    const {token} = z.object({token: z.string().max(1000)}).parse(await jsonBody(request));
    const session = readSession(token), repo = repository(), state = await repo.snapshot();
    const registration = state.registrations.find(r => r.registration_id === session.registrationId && r.additional_fields.gateway_order_id === session.orderId);
    if (!registration) throw new DomainError("NOT_FOUND", "Checkout not found.", 404);
    if (registration.payment_status !== "PAYMENT_VERIFIED") {
      const payments = await fetchOrderPayments(session.orderId);
      const captured = payments.items.find(p => p.status === "captured" && p.order_id === session.orderId);
      if (captured) {
        const settled = await repo.settlePayment(captured);
        after(safelyDrainEmail);
        return NextResponse.json({paid: true, registration_id: settled.registration.registration_id, status: settled.registration.registration_status}, {headers: {"Cache-Control":"no-store"}});
      }
    }
    after(safelyDrainEmail);
    return NextResponse.json({paid: registration.payment_status === "PAYMENT_VERIFIED", registration_id: registration.registration_id, status: registration.registration_status}, {headers:{"Cache-Control":"no-store"}});
  } catch (error) { return errorResponse(error); }
}
