import { NextResponse, after } from "next/server";
import { verifyHmac } from "@/lib/razorpay-signatures";
import { fetchPayment } from "@/lib/razorpay";
import { repository } from "@/lib/repository";
import { DomainError } from "@/lib/domain";
import { errorResponse } from "@/lib/http";
import { safelyDrainEmail } from "@/lib/email";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 64000) throw new DomainError("TOO_LARGE", "Request too large.", 413);
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new DomainError("PAYMENT_CONFIG", "Webhook is not configured.", 503);
    if (!verifyHmac(body, request.headers.get("x-razorpay-signature") ?? "", secret)) throw new DomainError("SIGNATURE", "Invalid webhook signature.", 403);
    const event = JSON.parse(body);
    if (!["payment.captured", "order.paid"].includes(event.event)) return NextResponse.json({ok: true, ignored: true});
    const entity = event.payload?.payment?.entity;
    if (!entity?.id || !entity?.order_id) throw new DomainError("WEBHOOK", "Missing payment entity.");
    // Ignore unrelated Razorpay orders; support accounts used by multiple apps.
    const repo = repository(), state = await repo.snapshot();
    if (!state.registrations.some(r => r.additional_fields.gateway_order_id === entity.order_id)) return NextResponse.json({ok: true, ignored: true});
    const payment = await fetchPayment(entity.id);
    await repo.settlePayment(payment);
    after(safelyDrainEmail);
    return NextResponse.json({ok: true});
  } catch (error) { return errorResponse(error); }
}
