import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID, randomBytes } from "node:crypto";
import { events } from "../src/data/events";
import { emptyState, createRegistration, createDelegationRegistrations, settleGatewayPayment, adminCommand, type Runtime } from "../src/lib/domain";
import { verifyHmac, checkoutSignature } from "../src/lib/razorpay-signatures";
import { checkoutRegistrationSchema } from "../src/lib/validation";

const runtime: Runtime = { uuid: randomUUID, token: () => randomBytes(32).toString("hex"), now: () => "2026-10-04T12:00:00Z" };
const input = {event_id: events[0].id, name: "Test Delegate", institution: "Test School", class: "10", email: "payment@example.org", phone: "+919000000000", experience: "Beginner" as const, preferences: ["who", "unga", "unhrc"], payment_reference: "", payment_confirmation: false, form_response_id: "razorpay:order_Test123", additional_fields: {gateway_order_id: "order_Test123", payment_provider: "razorpay"}};
const payment = { id: "pay_Test123", order_id: "order_Test123", amount: 99900, currency: "INR", status: "captured" };
function setup() { const state = emptyState(); createRegistration(state, input, events, runtime, "website-checkout"); return state; }

test("checkout signatures bind payment to the server order; tampering is rejected", () => {
  const secret = "test-secret", signature = createHmac("sha256", secret).update("order_Test123|pay_Test123").digest("hex");
  assert.equal(checkoutSignature("order_Test123", "pay_Test123", signature, secret), true);
  assert.equal(checkoutSignature("order_Other", "pay_Test123", signature, secret), false);
  assert.equal(checkoutSignature("order_Test123", "pay_Other", signature, secret), false);
  assert.equal(verifyHmac("payload", "bad", secret), false);
  assert.equal(verifyHmac("payload", "a".repeat(64), ""), false);
});
test("webhook signature authenticates the exact raw body", () => {
  const body = '{"event":"payment.captured"}', secret = "webhook-secret";
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyHmac(body, signature, secret), true);
  assert.equal(verifyHmac(body + " ", signature, secret), false);
});
test("captured payment allocates and issues one E-ID across webhook/browser replays", () => {
  const state = setup();
  const result = settleGatewayPayment(state, payment, events, runtime, "https://valora.example");
  assert.equal(result.registration.payment_status, "PAYMENT_VERIFIED");
  assert.equal(result.registration.payment_reference, "pay_Test123");
  assert.equal(result.allocation?.committee_id, "who");
  assert.ok(result.credential);
  const mailCount = state.outbox.length;
  settleGatewayPayment(state, payment, events, runtime, "https://valora.example");
  assert.equal(state.credentials.length, 1);
  assert.equal(state.allocations.length, 1);
  assert.equal(state.outbox.length, mailCount);
  assert.equal(state.audit.filter(a => a.action === "razorpay-payment-captured").length, 1);
});
test("one captured delegation payment confirms every student exactly once", () => {
  const state = emptyState();
  const inputs = [0, 1, 2].map(i => ({...input, name: `Student ${i}`, email: `student${i}@example.org`, form_response_id: `delegation:test:${i}`, additional_fields: {gateway_order_id: "order_Group123", gateway_amount: "299700", payment_provider: "razorpay"}}));
  createDelegationRegistrations(state, inputs, events, runtime);
  const groupPayment = {...payment, id:"pay_Group123", order_id:"order_Group123", amount:299700};
  assert.throws(() => settleGatewayPayment(state, {...groupPayment, amount:99900}, events, runtime, "https://valora.example"));
  settleGatewayPayment(state, groupPayment, events, runtime, "https://valora.example");
  assert.equal(state.registrations.filter(r => r.payment_status === "PAYMENT_VERIFIED").length, 3);
  assert.equal(state.credentials.length, 3);
  settleGatewayPayment(state, groupPayment, events, runtime, "https://valora.example");
  assert.equal(state.credentials.length, 3);
  assert.equal(state.audit.filter(a => a.action === "razorpay-payment-captured").length, 3);
});
test("a duplicate email cannot create a partial delegation roster", () => {
  const state = emptyState();
  assert.throws(() => createDelegationRegistrations(state, [{...input}, {...input, form_response_id:"other"}], events, runtime));
  assert.equal(state.registrations.length, 0);
});
test("authorised, failed, wrong amount/currency and unrelated orders cannot fulfil registration", () => {
  for (const bad of [{status: "authorized"}, {status: "failed"}, {amount: 1}, {currency: "USD"}, {order_id: "order_Other"}]) {
    const state = setup();
    assert.throws(() => settleGatewayPayment(state, {...payment, ...bad}, events, runtime, "https://valora.example"));
    assert.equal(state.credentials.length, 0);
    assert.equal(state.registrations[0].payment_status, "PENDING_PAYMENT");
  }
});
test("gateway payments cannot be manually verified, rejected or edited", () => {
  for (const action of ["verify-payment", "reject-payment", "update-payment"] as const) {
    const state = setup();
    assert.throws(() => adminCommand(state, {action, registration_id: state.registrations[0].registration_id, reason: "test", payment_reference: "fake", payment_confirmation: true}, events, runtime, "organiser", "https://valora.example"), /confirmed automatically/);
  }
});
test("a different captured payment cannot replace the settled reference", () => {
  const state = setup(); settleGatewayPayment(state, payment, events, runtime, "https://valora.example");
  assert.throws(() => settleGatewayPayment(state, {...payment, id: "pay_Other"}, events, runtime, "https://valora.example"), /different payment/);
});
test("paid delegates whose chosen committees are full await manual allocation", () => {
  const state = setup(); state.matrices[events[0].id] = events[0].categories.map(c => ({...c, capacity: 0}));
  const result = settleGatewayPayment(state, payment, events, runtime, "https://valora.example");
  assert.equal(result.registration.payment_status, "PAYMENT_VERIFIED");
  assert.equal(result.registration.registration_status, "MANUAL_ALLOCATION_REQUIRED");
  assert.equal(state.credentials.length, 0);
});
test("public checkout requires consent and strips submitted payment evidence", () => {
  const parsed = checkoutRegistrationSchema.parse({...input, accepted_terms: true});
  assert.equal("payment_reference" in parsed, false);
  assert.equal("additional_fields" in parsed, false);
  assert.throws(() => checkoutRegistrationSchema.parse({...input, accepted_terms: false}));
});
