import { NextResponse, after } from "next/server";
import { z } from "zod";
import { sameOrigin, rate, jsonBody, errorResponse } from "@/lib/http";
import { readSession, fetchPayment, razorpayConfig } from "@/lib/razorpay";
import { checkoutSignature } from "@/lib/razorpay-signatures";
import { DomainError } from "@/lib/domain";
import { repository } from "@/lib/repository";
import { safelyDrainEmail } from "@/lib/email";
const schema = z.object({ token: z.string().max(1000), razorpay_order_id: z.string().max(100), razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/), razorpay_signature: z.string().length(64) });
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    sameOrigin(request); await rate(request, "checkout-verify", 30);
    const input = schema.parse(await jsonBody(request)), session = readSession(input.token);
    if (session.orderId !== input.razorpay_order_id || !checkoutSignature(session.orderId, input.razorpay_payment_id, input.razorpay_signature, razorpayConfig().secret))
      throw new DomainError("PAYMENT_SIGNATURE", "Payment verification failed.", 403);
    const payment = await fetchPayment(input.razorpay_payment_id);
    if (payment.order_id !== session.orderId) throw new DomainError("PAYMENT_ORDER", "Payment does not match checkout.", 403);
    const result = await repository().settlePayment(payment);
    if (result.registration.registration_id !== session.registrationId) throw new DomainError("PAYMENT_ORDER", "Invalid registration.", 403);
    after(safelyDrainEmail);
    return NextResponse.json({ok: true, registration_id: result.registration.registration_id, status: result.registration.registration_status}, {headers: {"Cache-Control":"no-store"}});
  } catch (error) { return errorResponse(error); }
}
