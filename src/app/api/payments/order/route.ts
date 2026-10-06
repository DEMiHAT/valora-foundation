import { createHash } from "node:crypto";
import { NextResponse, after } from "next/server";
import { checkoutRegistrationSchema } from "@/lib/validation";
import { getEvent } from "@/data/events";
import { DomainError } from "@/lib/domain";
import { repository } from "@/lib/repository";
import { sameOrigin, rate, jsonBody, errorResponse } from "@/lib/http";
import { createOrder, paymentReady, razorpayConfig, sessionToken } from "@/lib/razorpay";
import { safelyDrainEmail } from "@/lib/email";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await rate(request, "checkout-order", 10);
    const input = checkoutRegistrationSchema.parse(await jsonBody(request));
    const event = getEvent(input.event_id);
    if (!event) throw new DomainError("NOT_FOUND", "Event not found.", 404);
    if (Date.now() >= new Date(event.date).getTime()) throw new DomainError("CLOSED", "Registration is closed.", 409);
    if (!paymentReady(event)) throw new DomainError("PAYMENT_CONFIG", "Registration opens once payment setup is complete. Please contact Valora.", 503);
    // Check preferences and duplicate emails before creating an external order.
    if (input.preferences.length !== event.preferenceCount || new Set(input.preferences).size !== event.preferenceCount || input.preferences.some(p => !event.categories.some(c => c.id === p)))
      throw new DomainError("PREFERENCES", "Please select distinct valid committee preferences.");
    const repo = repository(), snapshot = await repo.snapshot();
    const retry = input.request_id && snapshot.registrations.find(r => r.event_id === event.id && r.form_response_id === `checkout:${input.request_id}`);
    if (retry) {
      const participant = snapshot.participants.find(p => p.participant_id === retry.participant_id);
      if (participant?.email !== input.email.toLowerCase()) throw new DomainError("PAYMENT_SESSION", "Checkout details do not match.", 403);
      const orderId = retry.additional_fields.gateway_order_id;
      return NextResponse.json({key: razorpayConfig().key, order_id: orderId, amount: Number(retry.additional_fields.gateway_amount), currency: "INR", registration_id: retry.registration_id, token: sessionToken(retry.registration_id, orderId)}, {headers: {"Cache-Control": "no-store"}});
    }
    const participant = snapshot.participants.find(p => p.email === input.email.toLowerCase());
    if (participant && snapshot.registrations.some(r => r.event_id === event.id && r.participant_id === participant.participant_id))
      throw new DomainError("DUPLICATE", "This email is already registered. Resume your saved checkout in the original browser, or contact Valora for help.", 409);
    const order = await createOrder(event);
    const result = await repo.importRegistration({
      ...input, payment_reference: "", payment_confirmation: false,
      form_response_id: input.request_id ? `checkout:${input.request_id}` : `razorpay:${order.id}`,
      additional_fields: { gateway_order_id: order.id, gateway_amount: String(order.amount), payment_provider: "razorpay", terms_policy_hash: createHash("sha256").update(process.env.PAYMENT_REFUND_POLICY!).digest("hex"), terms_accepted_at: new Date().toISOString() },
    }, "website-checkout");
    const id = result.registration.registration_id;
    after(safelyDrainEmail);
    const boundOrder = result.registration.additional_fields.gateway_order_id;
    return NextResponse.json({ key: razorpayConfig().key, order_id: boundOrder, amount: Number(result.registration.additional_fields.gateway_amount), currency: order.currency, registration_id: id, token: sessionToken(id, boundOrder) }, {headers: {"Cache-Control": "no-store"}});
  } catch (error) { return errorResponse(error); }
}
