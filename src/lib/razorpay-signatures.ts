import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyHmac(body: string, signature: string, secret: string) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function checkoutSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  return verifyHmac(`${orderId}|${paymentId}`, signature, secret);
}
