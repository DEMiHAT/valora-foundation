import { manualUpi } from "./payments";
import type {
  StoreState,
  FoundationEvent,
  RegistrationInput,
  RegistrationView,
  AdminCommand,
  PublicCredential,
  Credential,
  EventCategory,
  DeliveryEnvelope,
  EmailMessage,
  VolunteerInput,
  VolunteerProgram,
  VolunteerRegistration,
  PublicVolunteerCredential,
  VolunteerCommand,
  ManagedEvent,
  ManagedEventCommand,
} from "./models";
export type DomainState = StoreState & {
  matrices: Record<string, EventCategory[]>;
};
export interface Runtime {
  uuid(): string;
  token(): string;
  now(): string;
}
export class DomainError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
    this.name = "DomainError";
  }
}
export function emptyState(): DomainState {
  return {
    participants: [],
    registrations: [],
    allocations: [],
    credentials: [],
    audit: [],
    outbox: [],
    volunteers: [],
    managed_events: [],
    counters: {},
    rateLimits: {},
    matrices: {},
  };
}
function managedEvents(state: DomainState) {
  return (state.managed_events ??= []);
}
export function managedEventCommand(
  state: DomainState,
  command: ManagedEventCommand,
  runtime: Runtime,
  actor: string
): ManagedEvent {
  const records = managedEvents(state);
  if (command.action === "delete") {
    const index = records.findIndex((event) => event.event_id === command.event_id);
    if (index < 0) throw new DomainError("NOT_FOUND", "Event not found.", 404);
    const [removed] = records.splice(index, 1);
    audit(state, runtime, "event-deleted", removed.event_id, actor, removed.title);
    return removed;
  }
  const slug = command.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new DomainError("SLUG", "Enter a valid event slug.");
  if (records.some((event) => event.slug === slug && event.event_id !== command.event_id))
    throw new DomainError("DUPLICATE", "An event with this slug already exists.", 409);
  const values = {
    slug,
    title: command.title.trim(),
    type: command.type.trim(),
    date: command.date,
    venue: command.venue.trim(),
    description: command.description.trim(),
    registration_url: (command.registration_url ?? "").trim(),
    status: command.status ?? ("DRAFT" as const),
    updated_at: runtime.now(),
  };
  if (command.action === "update") {
    const record = records.find((event) => event.event_id === command.event_id);
    if (!record) throw new DomainError("NOT_FOUND", "Event not found.", 404);
    Object.assign(record, values);
    audit(state, runtime, "event-updated", record.event_id, actor, record.title);
    return record;
  }
  const record: ManagedEvent = {
    event_id: "VE-" + runtime.uuid(),
    ...values,
    created_at: runtime.now(),
  };
  records.push(record);
  audit(state, runtime, "event-created", record.event_id, actor, record.title);
  return record;
}
function volunteers(state: DomainState) {
  return (state.volunteers ??= []);
}
export function volunteerCommand(
  state: DomainState,
  command: VolunteerCommand,
  programs: VolunteerProgram[],
  runtime: Runtime,
  actor: string
): VolunteerRegistration {
  const program = programs.find((item) => item.id === command.program_id);
  if (!program) throw new DomainError("NOT_FOUND", "Volunteer programme not found.", 404);
  const records = volunteers(state);
  if (command.action === "delete") {
    const index = records.findIndex((v) => v.volunteer_id === command.volunteer_id);
    if (index < 0) throw new DomainError("NOT_FOUND", "Volunteer not found.", 404);
    const [removed] = records.splice(index, 1);
    audit(state, runtime, "volunteer-deleted", removed.volunteer_id, actor, removed.name);
    return removed;
  }
  const email = command.email.trim().toLowerCase();
  const duplicate = records.find(
    (v) => v.program_id === command.program_id && v.email === email && v.volunteer_id !== command.volunteer_id
  );
  if (duplicate)
    throw new DomainError("DUPLICATE", "A volunteer with this email already exists for the event.", 409);
  const values = {
    program_id: command.program_id,
    name: command.name.trim(),
    email,
    phone: command.phone.trim(),
    city: command.city.trim(),
    contributions: Array.from(new Set(command.contributions.map((item) => item.trim()).filter(Boolean))),
    shift: (command.shift ?? "").trim(),
    notes: (command.notes ?? "").trim(),
    status: command.status ?? ("ACTIVE" as const),
    updated_at: runtime.now(),
  };
  if (command.action === "update") {
    const record = records.find((v) => v.volunteer_id === command.volunteer_id);
    if (!record) throw new DomainError("NOT_FOUND", "Volunteer not found.", 404);
    Object.assign(record, values);
    audit(state, runtime, "volunteer-updated", record.volunteer_id, actor, record.name);
    return record;
  }
  const record = createVolunteer(
    state,
    {
      program_id: values.program_id,
      name: values.name,
      email: values.email,
      phone: values.phone,
      city: values.city,
      contributions: values.contributions,
      consent: true,
    },
    programs,
    runtime
  );
  Object.assign(record, values);
  audit(state, runtime, "volunteer-created", record.volunteer_id, actor, record.name);
  return record;
}
function findEvent(events: FoundationEvent[], id: string) {
  const e = events.find((e) => e.id === id);
  if (!e) throw new DomainError("NOT_FOUND", "Event not found.", 404);
  return e;
}
export function view(state: DomainState, id: string): RegistrationView {
  const registration = state.registrations.find(
    (r) => r.registration_id === id
  );
  if (!registration)
    throw new DomainError("NOT_FOUND", "Registration not found.", 404);
  const participant = state.participants.find(
    (p) => p.participant_id === registration.participant_id
  );
  if (!participant)
    throw new DomainError("INTEGRITY", "Participant record missing.", 500);
  return {
    registration,
    participant,
    allocation: state.allocations.find((a) => a.registration_id === id),
    credential: state.credentials.find((c) => c.registration_id === id),
  };
}
function audit(
  state: DomainState,
  runtime: Runtime,
  action: string,
  id: string,
  actor: string,
  detail = ""
) {
  state.audit.push({
    id: runtime.uuid(),
    action,
    registration_id: id,
    actor,
    at: runtime.now(),
    detail,
  });
}
function email(
  state: DomainState,
  runtime: Runtime,
  id: string,
  to: string,
  subject: string,
  body: string,
  meta: Partial<EmailMessage> = {}
) {
  if (!state.outbox.some((m) => m.id === id))
    state.outbox.push({
      id,
      to,
      subject,
      body,
      status: "PENDING",
      created_at: runtime.now(),
      ...meta,
    });
}
export function createRegistration(
  state: DomainState,
  input: RegistrationInput,
  events: FoundationEvent[],
  runtime: Runtime,
  actor: string
): RegistrationView {
  const event = findEvent(events, input.event_id);
  const existing = state.registrations.find(
    (r) =>
      r.form_response_id === input.form_response_id && r.event_id === event.id
  );
  if (existing) return view(state, existing.registration_id);
  const categories = state.matrices[event.id] ?? event.categories;
  if (
    input.preferences.length !== event.preferenceCount ||
    new Set(input.preferences).size !== input.preferences.length ||
    input.preferences.some((p) => !categories.some((c) => c.id === p))
  )
    throw new DomainError(
      "PREFERENCES",
      "Please select distinct valid committee preferences."
    );
  const emailAddress = input.email.trim().toLowerCase();
  const paymentReference = input.payment_reference
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
  for (const field of event.fields) {
    const value =
      (input as unknown as Record<string, unknown>)[field.key] ??
      input.additional_fields?.[field.key];
    if (field.required && (value == null || String(value).trim() === ""))
      throw new DomainError("REQUIRED_FIELD", `${field.label} is required.`);
    if (field.options && value && !field.options.includes(String(value)))
      throw new DomainError("INVALID_FIELD", `${field.label} is invalid.`);
  }
  let participant = state.participants.find((p) => p.email === emailAddress);
  if (
    participant &&
    state.registrations.some(
      (r) =>
        r.event_id === event.id &&
        r.participant_id === participant!.participant_id
    )
  )
    throw new DomainError(
      "DUPLICATE",
      "This email is already registered for this event.",
      409
    );
  if (
    paymentReference &&
    state.registrations.some(
      (r) => r.payment_reference === paymentReference && r.event_id === event.id
    )
  )
    throw new DomainError(
      "DUPLICATE_REFERENCE",
      "This transaction reference is already submitted.",
      409
    );
  if (!participant) {
    participant = {
      participant_id: "VP-" + runtime.uuid(),
      name: input.name.trim(),
      institution: input.institution.trim(),
      class: input.class.trim(),
      email: emailAddress,
      phone: input.phone.trim(),
      experience: input.experience,
    };
    state.participants.push(participant);
  }
  const registration = {
    registration_id: "VR-" + runtime.uuid(),
    event_id: event.id,
    participant_id: participant.participant_id,
    preferences: input.preferences,
    payment_reference: paymentReference,
    payment_confirmation: input.payment_confirmation,
    payment_status: "PENDING_PAYMENT" as const,
    registration_status: "REGISTERED" as const,
    created_at: runtime.now(),
    form_response_id: input.form_response_id,
    additional_fields: input.additional_fields ?? {},
  };
  state.registrations.push(registration);
  audit(
    state,
    runtime,
    "registration-imported",
    registration.registration_id,
    actor
  );
  email(
    state,
    runtime,
    "registration:" + registration.registration_id,
    participant.email,
    `${event.shortTitle}: registration received`,
    `Hello ${participant.name},\n\nWe have received your registration for ${event.title}. Your payment is pending confirmation. Your registration reference is ${registration.registration_id}.\n\nName: ${participant.name}\nInstitution: ${participant.institution}\nClass / grade: ${participant.class}\nEmail: ${participant.email}\nPhone: ${participant.phone}\nExperience: ${participant.experience}\nPreferences: ${registration.preferences.map(id => event.categories.find(c => c.id === id)?.name ?? id).join(", ")}\nEvent date: ${event.date}\nVenue: ${event.venue}. Your E-ID card will be sent separately to this email address at a later date.\n\nValora Foundation`,
    { registration_id: registration.registration_id }
  );
  return view(state, registration.registration_id);
}
export function createDelegationRegistrations(
  state: DomainState, inputs: RegistrationInput[], events: FoundationEvent[], runtime: Runtime
): RegistrationView[] {
  if (inputs.length < 2 || inputs.length > 30) throw new DomainError("ROSTER", "Add between 2 and 30 students.");
  const emails = inputs.map(input => input.email.trim().toLowerCase());
  if (new Set(emails).size !== emails.length) throw new DomainError("DUPLICATE", "Each student needs a unique email address.", 409);
  // Validate on a copy so one invalid student cannot leave a partial roster.
  const draft: DomainState = JSON.parse(JSON.stringify(state));
  const results = inputs.map(input => createRegistration(draft, input, events, runtime, "school-delegation"));
  Object.assign(state, draft);
  return results;
}
function ensureCredential(
  state: DomainState,
  id: string,
  event: FoundationEvent,
  runtime: Runtime
): Credential {
  const { registration } = view(state, id);
  const existing = state.credentials.find((c) => c.registration_id === id);
  if (existing) return existing;
  if (
    registration.payment_status !== "PAYMENT_VERIFIED" ||
    !state.allocations.some((a) => a.registration_id === id)
  )
    throw new DomainError(
      "NOT_ELIGIBLE",
      "Payment and allocation are required."
    );
  let sequence = (state.counters[event.id] ?? 0) + 1;
  while (
    state.credentials.some(
      (c) =>
        c.credential_id ===
        `${event.idPrefix}-${String(sequence).padStart(5, "0")}`
    )
  )
    sequence++;
  state.counters[event.id] = sequence;
  const credential: Credential = {
    credential_id: `${event.idPrefix}-${String(sequence).padStart(5, "0")}`,
    registration_id: id,
    participant_id: registration.participant_id,
    event_id: event.id,
    token: runtime.token(),
    status: "ACTIVE",
    issued_at: runtime.now(),
    version: 1,
  };
  state.credentials.push(credential);
  return credential;
}
function allocatedMail(
  state: DomainState,
  id: string,
  event: FoundationEvent,
  runtime: Runtime,
  appUrl: string,
  mailId?: string
) {
  const v = view(state, id);
  const credential = ensureCredential(state, id, event, runtime);
  email(
    state,
    runtime,
    mailId ?? `allocation:${id}:${credential.version}`,
    v.participant.email,
    `${event.shortTitle}: your allocation and Valora E-ID`,
    `Hello ${
      v.participant.name
    },\n\nYour payment has been verified.\nCommittee / category: ${
      v.allocation!.committee
    }\nPortfolio: ${v.allocation!.portfolio}\nValora E-ID: ${
      credential.credential_id
    }\n\nOpen and print your delegate card: ${appUrl}/id/${
      credential.token
    }\n\nEvent: ${event.title}\nDate: ${event.date}\nVenue: ${
      event.venue
    }\n\nKeep this private link safe. Your QR shares only the name and event allocation needed for verification.\n\nValora Foundation`,
    { registration_id: id, credential_version: credential.version }
  );
}
function registrationConfirmedMail(state: DomainState, id: string, event: FoundationEvent, runtime: Runtime) {
  const v = view(state, id);
  email(state, runtime, `confirmed:${id}`, v.participant.email,
    `${event.shortTitle}: registration confirmed`,
    `Hello ${v.participant.name},\n\nYour payment has been verified and your registration is confirmed.\nRegistration reference: ${id}\nName: ${v.participant.name}\nInstitution: ${v.participant.institution}\nClass / grade: ${v.participant.class}\nEmail: ${v.participant.email}\nPhone: ${v.participant.phone}\nExperience: ${v.participant.experience}\nPreferences: ${v.registration.preferences.map(key => event.categories.find(c => c.id === key)?.name ?? key).join(", ")}\nPayment reference: ${v.registration.payment_reference}\nDelegate fee: ${event.currency} ${event.fee}\n${v.allocation ? `Committee / category: ${v.allocation.committee}\nPortfolio: ${v.allocation.portfolio}` : "Allocation: pending organiser review"}\nEvent: ${event.title}\nDate: ${event.date}\nVenue: ${event.venue}\n\nYour E-ID card will be sent separately to this email address at a later date. No E-ID card has been issued with this confirmation.\n\nValora Foundation`,
    { registration_id: id });
}
export function allocate(
  state: DomainState,
  id: string,
  events: FoundationEvent[],
  runtime: Runtime,
  appUrl: string
): RegistrationView {
  const { registration } = view(state, id);
  const event = findEvent(events, registration.event_id);
  if (registration.payment_status !== "PAYMENT_VERIFIED")
    throw new DomainError("UNPAID", "Only verified payments can be allocated.");
  if (state.allocations.some((a) => a.registration_id === id)) {
    registration.registration_status = "ALLOCATED";
    registrationConfirmedMail(state, id, event, runtime);
    return view(state, id);
  }
  const categories = state.matrices[event.id] ?? event.categories;
  for (const preference of registration.preferences) {
    const category = categories.find((c) => c.id === preference);
    if (!category) continue;
    const occupied = state.allocations.filter(
      (a) =>
        a.committee_id === category.id &&
        state.registrations.find((r) => r.registration_id === a.registration_id)
          ?.event_id === event.id
    );
    if (occupied.length >= category.capacity) continue;
    const portfolio = category.portfolios.find(
      (p) => !occupied.some((a) => a.portfolio === p)
    );
    if (!portfolio) continue;
    state.allocations.push({
      registration_id: id,
      committee_id: category.id,
      committee: category.name,
      portfolio,
      allocated_at: runtime.now(),
    });
    registration.registration_status = "ALLOCATED";
    registrationConfirmedMail(state, id, event, runtime);
    return view(state, id);
  }
  registration.registration_status = "MANUAL_ALLOCATION_REQUIRED";
  registrationConfirmedMail(state, id, event, runtime);
  return view(state, id);
}
export function adminCommand(
  state: DomainState,
  command: AdminCommand,
  events: FoundationEvent[],
  runtime: Runtime,
  actor: string,
  appUrl: string
): RegistrationView {
  const v = view(state, command.registration_id);
  const event = findEvent(events, v.registration.event_id);
  if (v.registration.additional_fields.gateway_order_id &&
      ["verify-payment", "reject-payment", "update-payment"].includes(command.action))
    throw new DomainError("GATEWAY_PAYMENT", "Razorpay payments are confirmed automatically by the payment provider.", 409);
  switch (command.action) {
    case "update-payment": {
      if (v.registration.payment_status === "PAYMENT_VERIFIED")
        throw new DomainError(
          "ALREADY_VERIFIED",
          "A verified transaction cannot be edited."
        );
      const reference = command.payment_reference
        ?.trim()
        .replace(/\s+/g, "")
        .toUpperCase();
      if (!reference || !command.reason?.trim())
        throw new DomainError(
          "REQUIRED",
          "A transaction reference and correction reason are required."
        );
      if (
        state.registrations.some(
          (r) =>
            r.event_id === event.id &&
            r.registration_id !== command.registration_id &&
            r.payment_reference === reference
        )
      )
        throw new DomainError(
          "DUPLICATE_REFERENCE",
          "This reference belongs to another registration.",
          409
        );
      v.registration.payment_reference = reference;
      v.registration.payment_confirmation =
        command.payment_confirmation === true;
      v.registration.payment_status = "PENDING_PAYMENT";
      break;
    }
    case "verify-payment":
      if (
        !v.registration.payment_reference ||
        !v.registration.payment_confirmation
      )
        throw new DomainError(
          "MISSING_REFERENCE",
          "A transaction reference and payment confirmation are required."
        );
      v.registration.payment_status = manualUpi.decision(
        "verify",
        v.registration.payment_reference,
        v.registration.payment_confirmation
      );
      v.registration.registration_status = "AWAITING_ALLOCATION";
      allocate(state, command.registration_id, events, runtime, appUrl);
      break;
    case "reject-payment":
      if (v.registration.payment_status === "PAYMENT_VERIFIED" || v.allocation)
        throw new DomainError(
          "ALREADY_VERIFIED",
          "Verified payments cannot be rejected. Revoke the ID and resolve this with the participant."
        );
      if (!command.reason?.trim())
        throw new DomainError("REASON", "A rejection reason is required.");
      v.registration.payment_status = manualUpi.decision(
        "reject",
        v.registration.payment_reference,
        v.registration.payment_confirmation
      );
      email(
        state,
        runtime,
        `rejected:${command.registration_id}`,
        v.participant.email,
        `${event.shortTitle}: payment needs attention`,
        `Hello ${v.participant.name},\n\nYour payment could not be verified. Reason: ${command.reason}. Please contact the Valora team with your registration reference ${command.registration_id}.\n\nValora Foundation`,
        { registration_id: command.registration_id }
      );
      break;
    case "allocate":
      allocate(state, command.registration_id, events, runtime, appUrl);
      break;
    case "manual-allocate": {
      if (v.registration.payment_status !== "PAYMENT_VERIFIED")
        throw new DomainError(
          "UNPAID",
          "Verify payment before assigning a portfolio."
        );
      if (!command.reason?.trim())
        throw new DomainError("REASON", "An override reason is required.");
      const category = (state.matrices[event.id] ?? event.categories).find(
        (c) => c.id === command.committee_id
      );
      if (
        !category ||
        !command.portfolio ||
        !category.portfolios.includes(command.portfolio)
      )
        throw new DomainError(
          "INVALID_PORTFOLIO",
          "Choose a configured portfolio."
        );
      const occupied = state.allocations.filter(
        (a) =>
          a.registration_id !== command.registration_id &&
          a.committee_id === category.id &&
          state.registrations.find(
            (r) => r.registration_id === a.registration_id
          )?.event_id === event.id
      );
      if (
        occupied.length >= category.capacity ||
        occupied.some((a) => a.portfolio === command.portfolio)
      )
        throw new DomainError(
          "OCCUPIED",
          "This portfolio or category is full.",
          409
        );
      const allocation = {
        registration_id: command.registration_id,
        committee_id: category.id,
        committee: category.name,
        portfolio: command.portfolio,
        allocated_at: runtime.now(),
      };
      if (v.allocation) Object.assign(v.allocation, allocation);
      else state.allocations.push(allocation);
      v.registration.registration_status = "ALLOCATED";
      if (v.credential) {
        v.credential.token = runtime.token();
        v.credential.version++;
        v.credential.status = "ACTIVE";
      }
      if (v.credential) allocatedMail(state, command.registration_id, event, runtime, appUrl);
      else registrationConfirmedMail(state, command.registration_id, event, runtime);
      break;
    }
    case "regenerate-id": {
      if (v.registration.payment_status !== "PAYMENT_VERIFIED" || !v.allocation)
        throw new DomainError(
          "NOT_ELIGIBLE",
          "Payment and allocation are required."
        );
      if (v.credential) {
        v.credential.token = runtime.token();
        v.credential.version++;
        v.credential.status = "ACTIVE";
        v.credential.issued_at = runtime.now();
      }
      allocatedMail(state, command.registration_id, event, runtime, appUrl);
      break;
    }
    case "revoke-id":
      if (!v.credential)
        throw new DomainError("NOT_FOUND", "No E-ID has been issued.", 404);
      if (!command.reason?.trim())
        throw new DomainError("REASON", "A revocation reason is required.");
      v.credential.status = "REVOKED";
      break;
    case "retry-email":
      if (v.credential) {
        if (v.credential.status !== "ACTIVE")
          throw new DomainError("REVOKED", "A revoked E-ID cannot be sent.");
        const key = `allocation:${command.registration_id}:${v.credential.version}`;
        const queued = state.outbox.find(
          (m) =>
            m.registration_id === command.registration_id &&
            m.credential_version === v.credential!.version &&
            ["PENDING", "SENDING", "FAILED"].includes(m.status)
        );
        if (
          queued?.status === "SENDING" &&
          new Date(queued.lease_until ?? 0) > new Date(runtime.now())
        )
          throw new DomainError(
            "SENDING",
            "This message is currently being sent.",
            409
          );
        if (queued) {
          queued.status = "PENDING";
          queued.attempts = 0;
          queued.next_attempt_at = undefined;
          queued.last_error = undefined;
        } else
          allocatedMail(
            state,
            command.registration_id,
            event,
            runtime,
            appUrl,
            key + ":resend:" + runtime.uuid()
          );
      } else
        throw new DomainError("NOT_ELIGIBLE", "No allocated E-ID to email.");
      break;
  }
  audit(
    state,
    runtime,
    command.action,
    command.registration_id,
    actor,
    command.reason ?? ""
  );
  return view(state, command.registration_id);
}
export function updateMatrix(
  state: DomainState,
  event: FoundationEvent,
  committeeId: string,
  portfolios: string[],
  capacity: number,
  runtime: Runtime,
  actor: string
) {
  portfolios = portfolios.map((p) => p.trim());
  const current =
    state.matrices[event.id] ??
    event.categories.map((c) => ({ ...c, portfolios: [...c.portfolios] }));
  const category = current.find((c) => c.id === committeeId);
  if (!category) throw new DomainError("NOT_FOUND", "Category not found.", 404);
  if (
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > 1000 ||
    portfolios.length < capacity ||
    portfolios.some((p) => !p.trim() || p.length > 120) ||
    new Set(portfolios).size !== portfolios.length
  )
    throw new DomainError(
      "INVALID_MATRIX",
      "Use unique portfolio names and a capacity no larger than the matrix."
    );
  const occupied = state.allocations.filter(
    (a) =>
      a.committee_id === committeeId &&
      state.registrations.find((r) => r.registration_id === a.registration_id)
        ?.event_id === event.id
  );
  if (
    occupied.length > capacity ||
    occupied.some((a) => !portfolios.includes(a.portfolio))
  )
    throw new DomainError(
      "OCCUPIED",
      "Cannot remove an occupied portfolio or reduce capacity below occupancy.",
      409
    );
  category.portfolios = portfolios;
  category.capacity = capacity;
  state.matrices[event.id] = current;
  audit(state, runtime, "matrix-updated", event.id, actor, committeeId);
}
export function publicCredential(
  state: DomainState,
  token: string,
  events: FoundationEvent[],
  now: string,
  expectedId?: string
): PublicCredential | null {
  const c = state.credentials.find(
    (c) => c.token === token && (!expectedId || c.credential_id === expectedId)
  );
  if (!c) return null;
  const v = view(state, c.registration_id);
  const event = findEvent(events, c.event_id);
  if (!v.allocation || v.registration.payment_status !== "PAYMENT_VERIFIED")
    return null;
  return {
    credential_id: c.credential_id,
    participant: v.participant.name,
    event: event.title,
    event_id: event.id,
    committee: v.allocation.committee,
    portfolio: v.allocation.portfolio,
    status:
      c.status === "REVOKED"
        ? "REVOKED"
        : new Date(now) > new Date(event.validUntil)
        ? "EXPIRED"
        : "ACTIVE",
    validUntil: event.validUntil,
  };
}
export function consumeRate(
  state: DomainState,
  key: string,
  limit: number,
  windowMs: number,
  now: number
): boolean {
  const current = state.rateLimits[key];
  if (!current || current.reset <= now)
    state.rateLimits[key] = { count: 1, reset: now + windowMs };
  else {
    if (current.count >= limit) return false;
    current.count++;
  }
  for (const [k, v] of Object.entries(state.rateLimits))
    if (v.reset <= now) delete state.rateLimits[k];
  return true;
}

export function createVolunteer(
  state: DomainState,
  input: VolunteerInput,
  programs: VolunteerProgram[],
  runtime: Runtime
): VolunteerRegistration {
  const program = programs.find((item) => item.id === input.program_id && item.active);
  if (!program)
    throw new DomainError("PROGRAM_CLOSED", "Volunteer registration is not open for this programme.", 404);
  const name = input.name.trim().replace(/\s+/g, " "),
    emailAddress = input.email.trim().toLowerCase(),
    phone = input.phone.trim(),
    city = input.city.trim().replace(/\s+/g, " "),
    contributions = Array.from(new Set(input.contributions.map((item) => item.trim()).filter(Boolean)));
  if (name.length < 2 || name.length > 120)
    throw new DomainError("VOLUNTEER_NAME", "Enter your full name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress) || emailAddress.length > 254)
    throw new DomainError("VOLUNTEER_EMAIL", "Enter a valid email address.");
  if (!/^[+\d][\d\s()-]{7,24}$/.test(phone))
    throw new DomainError("VOLUNTEER_PHONE", "Enter a valid phone number.");
  if (city.length < 2 || city.length > 100)
    throw new DomainError("VOLUNTEER_CITY", "Enter your city or location.");
  if (!contributions.length || contributions.length > 5 || contributions.some((item) => item.length > 80))
    throw new DomainError("VOLUNTEER_CONTRIBUTION", "Select at least one valid way to contribute.");
  if (!input.consent)
    throw new DomainError("VOLUNTEER_CONSENT", "Please accept the privacy and volunteer communication consent.");
  const existing = volunteers(state).find(
    (item) => item.program_id === program.id && item.email === emailAddress
  );
  if (existing) return existing;
  const sequence = (state.counters.volunteer ?? 0) + 1;
  state.counters.volunteer = sequence;
  const volunteer: VolunteerRegistration = {
    volunteer_id: `VF-${String(sequence).padStart(6, "0")}`,
    program_id: program.id,
    name,
    email: emailAddress,
    phone,
    city,
    contributions,
    token: runtime.token(),
    status: "ACTIVE",
    created_at: runtime.now(),
  };
  volunteers(state).push(volunteer);
  email(
    state,
    runtime,
    `volunteer-card:${volunteer.volunteer_id}`,
    volunteer.email,
    `Your ${program.cardTitle} card`,
    `Hello ${volunteer.name},\n\nThank you for registering with ${program.title}. Your volunteer ID is ${volunteer.volunteer_id}. Your digital volunteer card is attached to this email.\n\nSelected areas: ${volunteer.contributions.join(", ")}\n\nValora Foundation`,
    { volunteer_id: volunteer.volunteer_id }
  );
  return volunteer;
}

export function publicVolunteerCredential(
  state: DomainState,
  token: string,
  programs: VolunteerProgram[],
  now: string,
  id?: string
): PublicVolunteerCredential | null {
  const volunteer = volunteers(state).find(
    (item) => item.token === token && (!id || item.volunteer_id === id)
  );
  if (!volunteer) return null;
  const program = programs.find((item) => item.id === volunteer.program_id);
  if (!program) return null;
  return {
    volunteer_id: volunteer.volunteer_id,
    program: program.title,
    cardTitle: program.cardTitle,
    name: volunteer.name,
    city: volunteer.city,
    contributions: volunteer.contributions,
    status:
      volunteer.status === "REVOKED"
        ? "REVOKED"
        : program.validUntil && new Date(now) > new Date(program.validUntil)
          ? "EXPIRED"
          : "ACTIVE",
    validUntil: program.validUntil,
  };
}

export function volunteerCount(state: DomainState, programId?: string) {
  const active = volunteers(state).filter(
    (item) => item.status === "ACTIVE" && (!programId || item.program_id === programId)
  );
  return new Set(active.map((item) => item.email)).size;
}

// SMTP delivery is at-least-once: leases prevent concurrent sends. A provider
// acceptance followed by a datastore outage can still require reconciliation.
export function claimEmail(
  state: DomainState,
  events: FoundationEvent[],
  runtime: Runtime,
  volunteerPrograms: VolunteerProgram[] = []
): DeliveryEnvelope | null {
  const now = new Date(runtime.now());
  for (const message of state.outbox) {
    if (message.status === "SENT" || message.status === "SKIPPED") continue;
    if (
      message.status === "SENDING" &&
      new Date(message.lease_until ?? 0) > now
    )
      continue;
    if (message.next_attempt_at && new Date(message.next_attempt_at) > now)
      continue;
    if ((message.attempts ?? 0) >= 5) {
      message.status = "FAILED";
      continue;
    }
    if (
      message.id.startsWith("rejected:") &&
      state.registrations.find(
        (r) => r.registration_id === message.registration_id
      )?.payment_status !== "PAYMENT_REJECTED"
    ) {
      message.status = "SKIPPED";
      message.last_error = "Payment status has changed.";
      continue;
    }
    let credential: PublicCredential | undefined,
      volunteerCredential: PublicVolunteerCredential | undefined,
      token: string | undefined;
    if (message.volunteer_id) {
      const volunteer = volunteers(state).find(
        (item) => item.volunteer_id === message.volunteer_id
      );
      if (!volunteer || volunteer.status !== "ACTIVE") {
        message.status = "SKIPPED";
        message.last_error = "Volunteer card is no longer active.";
        continue;
      }
      const record = publicVolunteerCredential(
        state,
        volunteer.token,
        volunteerPrograms,
        runtime.now(),
        volunteer.volunteer_id
      );
      if (!record || record.status !== "ACTIVE") {
        message.status = "SKIPPED";
        message.last_error = "Volunteer card is no longer valid.";
        continue;
      }
      volunteerCredential = record;
      token = volunteer.token;
    }
    if (message.credential_version != null) {
      const c = state.credentials.find(
        (c) => c.registration_id === message.registration_id
      );
      if (
        !c ||
        c.version !== message.credential_version ||
        c.status !== "ACTIVE"
      ) {
        message.status = "SKIPPED";
        message.last_error = "Credential replaced or revoked.";
        continue;
      }
      const record = publicCredential(state, c.token, events, runtime.now());
      if (!record || record.status !== "ACTIVE") {
        message.status = "SKIPPED";
        message.last_error = "Credential is no longer valid.";
        continue;
      }
      credential = record;
      token = c.token;
    }
    message.status = "SENDING";
    message.lease_token = runtime.token();
    message.lease_until = new Date(now.getTime() + 120000).toISOString();
    message.attempts = (message.attempts ?? 0) + 1;
    return { message: { ...message }, credential, volunteerCredential, token };
  }
  return null;
}
export function finishEmail(
  state: DomainState,
  id: string,
  lease: string,
  result: { sent: boolean; messageId?: string; error?: string },
  runtime: Runtime
) {
  const message = state.outbox.find((m) => m.id === id);
  if (!message || message.status !== "SENDING" || message.lease_token !== lease)
    throw new DomainError(
      "LEASE",
      "Email delivery lease expired or changed.",
      409
    );
  if (result.sent) {
    message.status = "SENT";
    message.sent_at = runtime.now();
    message.provider_message_id = result.messageId;
    message.last_error = undefined;
    message.next_attempt_at = undefined;
  } else {
    message.status = "FAILED";
    message.last_error = result.error ?? "Delivery failed.";
    message.next_attempt_at = new Date(
      new Date(runtime.now()).getTime() +
        Math.min(3600000, 60000 * 2 ** Math.max(0, (message.attempts ?? 1) - 1))
    ).toISOString();
  }
  message.lease_token = undefined;
  message.lease_until = undefined;
}

// Called only after the server authenticates and fetches captured gateway evidence.
// The datastore transaction/Apps Script lock makes webhook and browser retries safe.
export interface CapturedPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
}
export function settleGatewayPayment(
  state: DomainState, payment: CapturedPayment, events: FoundationEvent[],
  runtime: Runtime, appUrl: string
): RegistrationView {
  const registration = state.registrations.find(r => r.additional_fields.gateway_order_id === payment.order_id);
  if (!registration) throw new DomainError("NOT_FOUND", "Payment registration not found.", 404);
  const event = findEvent(events, registration.event_id);
  if (payment.status !== "captured" || payment.amount !== Number(registration.additional_fields.gateway_amount ?? Math.round(event.fee * 100)) || payment.currency !== event.currency)
    throw new DomainError("PAYMENT_PENDING", "Your payment is awaiting confirmation. Please check again shortly.", 409);
  const group = state.registrations.filter(r => r.additional_fields.gateway_order_id === payment.order_id);
  if (group.some(member => member.payment_status === "PAYMENT_VERIFIED" && member.payment_reference !== payment.id))
    throw new DomainError("PAYMENT_CONFLICT", "A different payment is already confirmed.", 409);
  if (state.registrations.some(r => !group.includes(r) && r.payment_reference === payment.id))
    throw new DomainError("PAYMENT_CONFLICT", "Payment is already linked to another registration.", 409);
  for (const member of group) {
    if (member.payment_status === "PAYMENT_VERIFIED") continue;
    member.payment_reference = payment.id;
    member.payment_confirmation = true;
    member.payment_status = "PAYMENT_VERIFIED";
    member.registration_status = "AWAITING_ALLOCATION";
    audit(state, runtime, "razorpay-payment-captured", member.registration_id, "razorpay", payment.id);
    allocate(state, member.registration_id, events, runtime, appUrl);
  }
  return view(state, registration.registration_id);
}
