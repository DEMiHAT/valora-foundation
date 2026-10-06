import { z } from "zod";
export const registrationSchema = z.object({
  event_id: z.string().min(1).max(100),
  name: z.string().trim().min(2).max(120),
  institution: z.string().trim().max(200).default(""),
  class: z.string().trim().max(80).default(""),
  email: z.string().trim().email().max(254),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/),
  experience: z
    .enum(["Beginner", "Intermediate", "Experienced"])
    .default("Beginner"),
  preferences: z.array(z.string().min(1).max(100)).min(1).max(10),
  payment_reference: z
    .string()
    .trim()
    .max(100)
    .regex(/^[A-Za-z0-9\s-]*$/),
  payment_confirmation: z.boolean(),
  form_response_id: z.string().min(1).max(200),
  additional_fields: z.record(z.string().max(500)).optional(),
});
export const commandSchema = z.object({
  action: z.enum([
    "verify-payment",
    "reject-payment",
    "allocate",
    "manual-allocate",
    "regenerate-id",
    "revoke-id",
    "retry-email",
    "update-payment",
  ]),
  registration_id: z.string().min(1).max(100),
  committee_id: z.string().max(100).optional(),
  portfolio: z.string().max(120).optional(),
  reason: z.string().trim().max(500).optional(),
  payment_reference: z
    .string()
    .trim()
    .max(100)
    .regex(/^[A-Za-z0-9\s-]*$/)
    .optional(),
  payment_confirmation: z.boolean().optional(),
});

export const checkoutRegistrationSchema = registrationSchema.omit({
  payment_reference: true, payment_confirmation: true, form_response_id: true, additional_fields: true,
}).extend({ accepted_terms: z.literal(true), request_id: z.string().uuid().optional() });
export const capturedPaymentSchema = z.object({
  id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
  amount: z.number().int().positive(), currency: z.literal("INR"), status: z.literal("captured"),
});
