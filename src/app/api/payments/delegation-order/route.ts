import { createHash } from "node:crypto";
import { NextResponse, after } from "next/server";
import { z } from "zod";
import { checkoutRegistrationSchema } from "@/lib/validation";
import { getEvent } from "@/data/events";
import { DomainError } from "@/lib/domain";
import { repository } from "@/lib/repository";
import { sameOrigin, rate, jsonBody, errorResponse } from "@/lib/http";
import { createOrder, paymentReady, razorpayConfig, sessionToken } from "@/lib/razorpay";
import { safelyDrainEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;
const student = checkoutRegistrationSchema.omit({ event_id: true, institution: true, accepted_terms: true, request_id: true });
const schema = z.object({
  event_id: z.string(), school: z.string().trim().min(2).max(200),
  teacher_name: z.string().trim().min(2).max(120),
  teacher_email: z.string().trim().email().max(254),
  teacher_phone: z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/),
  students: z.array(student).min(2).max(30), accepted_terms: z.literal(true), request_id: z.string().uuid(),
});
export async function POST(request: Request) {
  try {
    sameOrigin(request); await rate(request, "delegation-order", 6);
    const input = schema.parse(await jsonBody(request));
    const event = getEvent(input.event_id);
    if (!event) throw new DomainError("NOT_FOUND", "Event not found.", 404);
    if (Date.now() >= new Date(event.date).getTime()) throw new DomainError("CLOSED", "Registration is closed.", 409);
    if (!paymentReady(event)) throw new DomainError("PAYMENT_CONFIG", "Payments are not open yet. Please contact Valora.", 503);
    const emails = input.students.map(s => s.email.toLowerCase());
    const rosterHash = createHash("sha256").update(JSON.stringify({school:input.school, teacher_email:input.teacher_email.toLowerCase(), students:input.students})).digest("hex");
    if (new Set(emails).size !== emails.length) throw new DomainError("DUPLICATE", "Each student needs a unique email address.", 409);
    for (const item of input.students) {
      if (item.preferences.length !== event.preferenceCount || new Set(item.preferences).size !== event.preferenceCount || item.preferences.some(p => !event.categories.some(c => c.id === p)))
        throw new DomainError("PREFERENCES", `Check the committee choices for ${item.name}.`);
    }
    const repo = repository();
    const snapshot = await repo.snapshot();
    const prefix = `delegation:${input.request_id}:`;
    const retry = snapshot.registrations.find(r => r.event_id === event.id && r.form_response_id === `${prefix}0`);
    if (retry) {
      if (retry.additional_fields.roster_hash !== rosterHash) throw new DomainError("PAYMENT_SESSION", "Your saved roster differs from this checkout. Please contact Valora for help.", 409);
      const orderId = retry.additional_fields.gateway_order_id;
      return NextResponse.json({key: razorpayConfig().key, order_id: orderId, amount: Number(retry.additional_fields.gateway_amount), currency: event.currency, registration_id: retry.registration_id, token: sessionToken(retry.registration_id, orderId), count: input.students.length}, {headers:{"Cache-Control":"no-store"}});
    }
    for (const email of emails) {
      const participant = snapshot.participants.find(p => p.email === email);
      if (participant && snapshot.registrations.some(r => r.event_id === event.id && r.participant_id === participant.participant_id))
        throw new DomainError("DUPLICATE", `${email} is already registered for this event.`, 409);
    }
    const order = await createOrder(event, input.students.length);
    const acceptedAt = new Date().toISOString();
    const policyHash = createHash("sha256").update(process.env.PAYMENT_REFUND_POLICY!).digest("hex");
    const results = await repo.importDelegation(input.students.map((s, i) => ({
      ...s, event_id: event.id, institution: input.school,
      payment_reference: "", payment_confirmation: false,
      form_response_id: `${prefix}${i}`,
      additional_fields: {gateway_order_id: order.id, gateway_amount: String(order.amount), payment_provider: "razorpay", teacher_name: input.teacher_name, teacher_email: input.teacher_email.toLowerCase(), teacher_phone: input.teacher_phone, delegation_size: String(input.students.length), roster_hash: rosterHash, terms_policy_hash: policyHash, terms_accepted_at: acceptedAt},
    })));
    after(safelyDrainEmail);
    return NextResponse.json({key: razorpayConfig().key, order_id: order.id, amount: order.amount, currency: event.currency, registration_id: results[0].registration.registration_id, token: sessionToken(results[0].registration.registration_id, order.id), count: results.length}, {headers:{"Cache-Control":"no-store"}});
  } catch (error) { return errorResponse(error); }
}
