export type Experience = "Beginner" | "Intermediate" | "Experienced";
export type PaymentStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_REJECTED";
export type RegistrationStatus =
  | "REGISTERED"
  | "AWAITING_ALLOCATION"
  | "ALLOCATED"
  | "MANUAL_ALLOCATION_REQUIRED";
export interface RegistrationField {
  key: string;
  label: string;
  required: boolean;
  type: "text" | "email" | "tel" | "select";
  options?: string[];
}
export interface EventCategory {
  id: string;
  name: string;
  description: string;
  capacity: number;
  portfolios: string[];
}
export interface FoundationEvent {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  type: string;
  date: string;
  validUntil: string;
  venue: string;
  description: string;
  tagline: string;
  overview: { title: string; lead: string; paragraphs: string[] };
  summaryIncludes: string[];
  trainingNote?: string;
  categoryLabel: string;
  fee: number;
  currency: "INR";
  preferenceCount: number;
  fields: RegistrationField[];
  categories: EventCategory[];
  allocationRule: "ordered-preferences";
  idPrefix: string;
  formEnvKey: string;
  matrixApprovalEnvKey: string;
  includes: { title: string; items: string[] }[];
  faqs: { question: string; answer: string }[];
}
export interface Participant {
  participant_id: string;
  name: string;
  institution: string;
  class: string;
  email: string;
  phone: string;
  experience: Experience;
}
export interface Registration {
  registration_id: string;
  event_id: string;
  participant_id: string;
  preferences: string[];
  payment_reference: string;
  payment_confirmation: boolean;
  payment_status: PaymentStatus;
  registration_status: RegistrationStatus;
  created_at: string;
  form_response_id: string;
  additional_fields: Record<string, string>;
}
export interface Allocation {
  registration_id: string;
  committee_id: string;
  committee: string;
  portfolio: string;
  allocated_at: string;
}
export interface Credential {
  credential_id: string;
  registration_id: string;
  participant_id: string;
  event_id: string;
  token: string;
  status: "ACTIVE" | "REVOKED";
  issued_at: string;
  version: number;
}
export interface Audit {
  id: string;
  action: string;
  registration_id: string;
  actor: string;
  at: string;
  detail: string;
}
export interface EmailMessage {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: "PENDING" | "SENDING" | "SENT" | "FAILED" | "SKIPPED";
  created_at: string;
  sent_at?: string;
  registration_id?: string;
  credential_version?: number;
  attempts?: number;
  lease_token?: string;
  lease_until?: string;
  next_attempt_at?: string;
  last_error?: string;
  provider_message_id?: string;
}
export interface StoreState {
  participants: Participant[];
  registrations: Registration[];
  allocations: Allocation[];
  credentials: Credential[];
  audit: Audit[];
  outbox: EmailMessage[];
  counters: Record<string, number>;
  rateLimits: Record<string, { count: number; reset: number }>;
}
export interface RegistrationInput {
  event_id: string;
  name: string;
  institution: string;
  class: string;
  email: string;
  phone: string;
  experience: Experience;
  preferences: string[];
  payment_reference: string;
  payment_confirmation: boolean;
  form_response_id: string;
  additional_fields?: Record<string, string>;
}
export interface PublicCredential {
  credential_id: string;
  participant: string;
  event: string;
  event_id: string;
  committee: string;
  portfolio: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  validUntil: string;
}
export interface RegistrationView {
  registration: Registration;
  participant: Participant;
  allocation?: Allocation;
  credential?: Credential;
}
export interface AdminCommand {
  action:
    | "verify-payment"
    | "reject-payment"
    | "allocate"
    | "manual-allocate"
    | "regenerate-id"
    | "revoke-id"
    | "retry-email"
    | "update-payment";
  registration_id: string;
  committee_id?: string;
  portfolio?: string;
  reason?: string;
  payment_reference?: string;
  payment_confirmation?: boolean;
}

export interface DeliveryEnvelope {
  message: EmailMessage;
  credential?: PublicCredential;
  token?: string;
}
