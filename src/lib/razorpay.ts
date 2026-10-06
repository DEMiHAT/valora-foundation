
import "server-only";
import { randomUUID, createHmac } from "node:crypto";
import { DomainError } from "./domain";
import { verifyHmac } from "./razorpay-signatures";
import type { FoundationEvent } from "./models";

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
}
export interface CheckoutSession {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  registration_id: string;
  token: string;
}
export function paymentReady(event: FoundationEvent) {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_WEBHOOK_SECRET && process.env.PAYMENT_REFUND_POLICY &&
    process.env[event.matrixApprovalEnvKey] === "true");
}
export function razorpayConfig() {
  const key = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) throw new DomainError("PAYMENT_CONFIG", "Online payments are not open yet. Please contact Valora.", 503);
  return { key, secret };
}
async function api<T>(path: string, body?: unknown): Promise<T> {
  const { key, secret } = razorpayConfig();
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`, "Content-Type": "application/json" },
    ...(body ? {body: JSON.stringify(body)} : {}),
    cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new DomainError("PAYMENT_GATEWAY", "The payment provider is unavailable. Please try again.", 503);
  return response.json() as Promise<T>;
}
export async function createOrder(event: FoundationEvent, quantity = 1) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 30) throw new DomainError("QUANTITY", "Choose between 1 and 30 delegates.");
  const order = await api<{id: string; amount: number; currency: string}>("orders", {
    amount: Math.round(event.fee * 100) * quantity, currency: event.currency,
    receipt: randomUUID(), notes: { event_id: event.id }, partial_payment: false,
  });
  if (!/^order_[A-Za-z0-9]+$/.test(order.id) || order.amount !== Math.round(event.fee * 100) * quantity || order.currency !== event.currency)
    throw new DomainError("PAYMENT_GATEWAY", "Unexpected payment order. Please try again.", 503);
  return order;
}
export function fetchPayment(id: string) {
  if (!/^pay_[A-Za-z0-9]+$/.test(id)) throw new DomainError("PAYMENT_ID", "Invalid payment reference.");
  return api<RazorpayPayment>(`payments/${id}`);
}
export function fetchOrderPayments(orderId: string) {
  if (!/^order_[A-Za-z0-9]+$/.test(orderId)) throw new DomainError("PAYMENT_ORDER", "Invalid payment order.");
  return api<{items: RazorpayPayment[]}>(`orders/${orderId}/payments`);
}
export function sessionToken(registrationId: string, orderId: string) {
  const payload = Buffer.from(JSON.stringify({registrationId, orderId})).toString("base64url");
  const signature = createHmac("sha256", razorpayConfig().secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}
export function readSession(token: string) {
  const [payload, signature, extra] = token.split(".");
  if (extra || !payload || !signature || !verifyHmac(payload, signature, razorpayConfig().secret))
    throw new DomainError("PAYMENT_SESSION", "Invalid checkout session.", 403);
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof parsed.registrationId !== "string" || !/^order_[A-Za-z0-9]+$/.test(parsed.orderId)) throw new Error();
    return parsed as {registrationId: string; orderId: string};
  } catch { throw new DomainError("PAYMENT_SESSION", "Invalid checkout session.", 403); }
}
