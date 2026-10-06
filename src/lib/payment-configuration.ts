import type { FoundationEvent } from "./models";
type Env = Record<string, string | undefined>;
export function paymentMode(env: Env = process.env) {
  const key = env.RAZORPAY_KEY_ID ?? "";
  return key.startsWith("rzp_test_") ? "test" : key.startsWith("rzp_live_") ? "live" : "unconfigured";
}
export function checkoutPolicyText(env: Env = process.env) {
  return paymentMode(env) === "test"
    ? "Test checkout only. No real money is charged and this does not reserve a conference place."
    : env.PAYMENT_REFUND_POLICY ?? "";
}
export function checkoutConfigured(event: FoundationEvent, env: Env = process.env) {
  const mode = paymentMode(env);
  const database = env.DATA_PROVIDER === "supabase"
    ? /^postgres(ql)?:\/\//.test(env.DATABASE_URL ?? "")
    : env.DATA_PROVIDER === "apps-script"
      ? Boolean(env.APPS_SCRIPT_URL && env.APPS_SCRIPT_SECRET && env.APPS_SCRIPT_SECRET.length >= 32)
      : env.NODE_ENV !== "production";
  if (!database || mode === "unconfigured" || !env.RAZORPAY_KEY_SECRET || !env.RAZORPAY_WEBHOOK_SECRET) return false;
  // Supabase test payments use an isolated database state and never reserve live seats.
  if (mode === "test" && env.DATA_PROVIDER === "supabase") return true;
  return Boolean(env.PAYMENT_REFUND_POLICY?.trim() && env[event.matrixApprovalEnvKey] === "true");
}
