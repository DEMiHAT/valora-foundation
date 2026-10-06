import type { PaymentStatus } from "./models";
// Payment decisions are isolated from event/allocation logic. A future gateway can
// produce the same verified/rejected decision using authenticated webhook evidence.
export interface PaymentProvider {
  kind: string;
  decision(
    action: "verify" | "reject",
    reference: string,
    confirmed: boolean
  ): PaymentStatus;
}
export const manualUpi: PaymentProvider = {
  kind: "manual-upi",
  decision(action, reference, confirmed) {
    if (action === "verify" && (!reference.trim() || !confirmed))
      throw new Error(
        "A payment reference and participant confirmation are required."
      );
    return action === "verify" ? "PAYMENT_VERIFIED" : "PAYMENT_REJECTED";
  },
};
