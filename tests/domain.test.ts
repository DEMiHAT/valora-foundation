import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { events } from "../src/data/events";
import {
  emptyState,
  createRegistration,
  adminCommand,
  allocate,
  publicCredential,
  updateMatrix,
  consumeRate,
  claimEmail,
  finishEmail,
  type Runtime,
} from "../src/lib/domain";
import type { FoundationEvent, RegistrationInput } from "../src/lib/models";
const now = "2026-10-03T14:00:00.000Z";
const runtime: Runtime = {
  uuid: randomUUID,
  token: () => randomBytes(32).toString("hex"),
  now: () => now,
};
function input(n: number, event = events[0]): RegistrationInput {
  return {
    event_id: event.id,
    name: "Delegate " + n,
    institution: "Test School",
    class: "Grade 10",
    email: `delegate${n}@example.org`,
    phone: "+919000000000",
    experience: "Beginner",
    preferences: event.categories
      .slice(0, event.preferenceCount)
      .map((c) => c.id),
    payment_reference: `UPI${n}`,
    payment_confirmation: true,
    form_response_id: "form-" + n,
  };
}
function verify(
  state: ReturnType<typeof emptyState>,
  id: string,
  eventList = events
) {
  return adminCommand(
    state,
    { action: "verify-payment", registration_id: id },
    eventList,
    runtime,
    "test-organiser",
    "https://valora.example"
  );
}
test("form import → verified payment → ordered portfolio → E-ID → safe verification → email queue", () => {
  const state = emptyState(),
    one = createRegistration(state, input(1), events, runtime, "google-form");
  assert.equal(one.registration.payment_status, "PENDING_PAYMENT");
  assert.equal(state.credentials.length, 0);
  const paid = verify(state, one.registration.registration_id);
  assert.equal(paid.allocation!.committee_id, "who");
  assert.equal(paid.allocation!.portfolio, "India");
  assert.equal(paid.credential!.credential_id, "VM26-00001");
  const visible = publicCredential(state, paid.credential!.token, events, now)!;
  assert.equal(visible.status, "ACTIVE");
  assert.equal(visible.participant, "Delegate 1");
  for (const key of [
    "email",
    "phone",
    "institution",
    "payment_reference",
    "token",
  ])
    assert.equal(key in visible, false);
  assert.equal(state.outbox.length, 2);
  assert.equal(state.outbox[1].credential_version, 1);
});
test("duplicate submissions and repeated verification do not duplicate allocations, IDs or messages", () => {
  const s = emptyState(),
    v = createRegistration(s, input(1), events, runtime, "form");
  assert.equal(
    createRegistration(s, input(1), events, runtime, "form").registration
      .registration_id,
    v.registration.registration_id
  );
  verify(s, v.registration.registration_id);
  verify(s, v.registration.registration_id);
  allocate(
    s,
    v.registration.registration_id,
    events,
    runtime,
    "https://valora.example"
  );
  assert.equal(s.participants.length, 1);
  assert.equal(s.registrations.length, 1);
  assert.equal(s.allocations.length, 1);
  assert.equal(s.credentials.length, 1);
  assert.equal(s.outbox.length, 2);
});
test("unverified registrations cannot allocate; payment confirmation is required", () => {
  const s = emptyState(),
    v = createRegistration(
      s,
      { ...input(1), payment_confirmation: false },
      events,
      runtime,
      "form"
    );
  assert.throws(
    () =>
      allocate(
        s,
        v.registration.registration_id,
        events,
        runtime,
        "https://valora.example"
      ),
    /Only verified/
  );
  assert.throws(
    () => verify(s, v.registration.registration_id),
    /reference and payment confirmation/
  );
});
test("full committee falls back to next preference, then manual allocation", () => {
  const e: FoundationEvent = {
      ...events[0],
      categories: events[0].categories.map((c) => ({
        ...c,
        capacity: 1,
        portfolios: ["Only place"],
      })),
    },
    s = emptyState();
  for (let n = 1; n <= 4; n++) {
    const v = createRegistration(s, input(n, e), [e], runtime, "form");
    verify(s, v.registration.registration_id, [e]);
  }
  assert.deepEqual(
    s.allocations.map((a) => a.committee_id),
    ["who", "unga", "unhrc"]
  );
  assert.equal(
    s.registrations[3].registration_status,
    "MANUAL_ALLOCATION_REQUIRED"
  );
  assert.equal(s.credentials.length, 3);
});
test("all 180 portfolios are unique and preference capacity remains bounded", () => {
  const s = emptyState();
  for (let n = 1; n <= 181; n++) {
    const offset = n <= 90 ? 0 : 3;
    const i = input(n);
    i.preferences = events[0].categories
      .slice(offset, offset + 3)
      .map((c) => c.id);
    const v = createRegistration(s, i, events, runtime, "form");
    verify(s, v.registration.registration_id);
  }
  assert.equal(s.allocations.length, 180);
  assert.equal(
    new Set(s.allocations.map((a) => a.committee_id + ":" + a.portfolio)).size,
    180
  );
  assert.equal(new Set(s.credentials.map((c) => c.credential_id)).size, 180);
  for (const c of events[0].categories)
    assert.equal(
      s.allocations.filter((a) => a.committee_id === c.id).length,
      c.capacity
    );
});
test("manual override protects occupied portfolios and rotates old QR", () => {
  const s = emptyState(),
    one = createRegistration(s, input(1), events, runtime, "form"),
    two = createRegistration(s, input(2), events, runtime, "form");
  verify(s, one.registration.registration_id);
  verify(s, two.registration.registration_id);
  const old = s.credentials[1].token;
  assert.throws(
    () =>
      adminCommand(
        s,
        {
          action: "manual-allocate",
          registration_id: two.registration.registration_id,
          committee_id: "who",
          portfolio: "India",
          reason: "Test override",
        },
        events,
        runtime,
        "admin",
        "https://valora.example"
      ),
    /full/
  );
  adminCommand(
    s,
    {
      action: "manual-allocate",
      registration_id: two.registration.registration_id,
      committee_id: "unga",
      portfolio: "India",
      reason: "Requested committee change",
    },
    events,
    runtime,
    "admin",
    "https://valora.example"
  );
  assert.equal(publicCredential(s, old, events, now), null);
  assert.equal(s.credentials[1].credential_id, "VM26-00002");
  assert.equal(s.credentials[1].version, 2);
  assert.equal(s.allocations.length, 2);
});
test("revoked and expired E-IDs cannot verify as active; secure token is mandatory", () => {
  const s = emptyState(),
    v = createRegistration(s, input(1), events, runtime, "form");
  const c = verify(s, v.registration.registration_id).credential!;
  assert.equal(
    publicCredential(s, c.token, events, "2026-11-15T00:00:00Z")!.status,
    "EXPIRED"
  );
  assert.equal(publicCredential(s, "VM26-00001", events, now), null);
  assert.equal(publicCredential(s, c.token, events, now, "VM26-99999"), null);
  adminCommand(
    s,
    {
      action: "revoke-id",
      registration_id: v.registration.registration_id,
      reason: "Delegate cancellation",
    },
    events,
    runtime,
    "admin",
    "https://valora.example"
  );
  assert.equal(publicCredential(s, c.token, events, now)!.status, "REVOKED");
  assert.throws(
    () =>
      adminCommand(
        s,
        {
          action: "retry-email",
          registration_id: v.registration.registration_id,
        },
        events,
        runtime,
        "admin",
        "https://valora.example"
      ),
    /revoked/
  );
});
test("matrix edits apply to the next allocation and cannot remove occupied portfolios", () => {
  const s = emptyState();
  updateMatrix(s, events[0], "who", ["Alpha", "Beta"], 2, runtime, "admin");
  const v = createRegistration(s, input(1), events, runtime, "form");
  assert.equal(
    verify(s, v.registration.registration_id).allocation!.portfolio,
    "Alpha"
  );
  assert.throws(
    () => updateMatrix(s, events[0], "who", ["Beta"], 1, runtime, "admin"),
    /occupied/
  );
  assert.throws(
    () =>
      updateMatrix(
        s,
        events[0],
        "who",
        ["Alpha", "Alpha"],
        2,
        runtime,
        "admin"
      ),
    /unique/
  );
});
test("participant identity spans future events without sharing capacity", () => {
  const future: FoundationEvent = {
    ...events[0],
    id: "future-event",
    slug: "future-event",
    idPrefix: "VF27",
    preferenceCount: 1,
    categories: [
      {
        id: "who",
        name: "Workshop",
        description: "Another event",
        capacity: 1,
        portfolios: ["Team 1"],
      },
    ],
  };
  const s = emptyState();
  let v = createRegistration(s, input(1), [...events, future], runtime, "form");
  verify(s, v.registration.registration_id, [...events, future]);
  v = createRegistration(
    s,
    { ...input(1, future), form_response_id: "future-1" },
    [...events, future],
    runtime,
    "form"
  );
  verify(s, v.registration.registration_id, [...events, future]);
  assert.equal(s.participants.length, 1);
  assert.equal(s.allocations.length, 2);
  assert.equal(s.credentials[1].credential_id, "VF27-00001");
});
test("duplicate committee choices, email and normalized transaction references are rejected", () => {
  const s = emptyState();
  createRegistration(s, input(1), events, runtime, "form");
  assert.throws(
    () =>
      createRegistration(
        s,
        { ...input(2), payment_reference: " upi 1 " },
        events,
        runtime,
        "form"
      ),
    /reference/
  );
  assert.throws(
    () =>
      createRegistration(
        s,
        { ...input(2), email: "DELEGATE1@example.org" },
        events,
        runtime,
        "form"
      ),
    /email/
  );
  assert.throws(
    () =>
      createRegistration(
        s,
        { ...input(2), preferences: ["who", "who", "unga"] },
        events,
        runtime,
        "form"
      ),
    /distinct/
  );
});
test("rate limits persist per key and reset with their window", () => {
  const s = emptyState();
  assert.equal(consumeRate(s, "key", 2, 1000, 0), true);
  assert.equal(consumeRate(s, "key", 2, 1000, 50), true);
  assert.equal(consumeRate(s, "key", 2, 1000, 100), false);
  assert.equal(consumeRate(s, "another", 2, 1000, 100), true);
  assert.equal(consumeRate(s, "key", 2, 1000, 1001), true);
});
test("email leases prevent concurrent delivery, support retry and acknowledge provider result", () => {
  const s = emptyState(),
    v = createRegistration(s, input(1), events, runtime, "form");
  verify(s, v.registration.registration_id);
  const a = claimEmail(s, events, runtime)!;
  const b = claimEmail(s, events, runtime)!;
  assert.notEqual(a.message.id, b.message.id);
  assert.equal(claimEmail(s, events, runtime), null);
  assert.throws(
    () => finishEmail(s, a.message.id, "wrong", { sent: true }, runtime),
    /lease/
  );
  finishEmail(
    s,
    a.message.id,
    a.message.lease_token!,
    { sent: false, error: "ECONNECTION" },
    runtime
  );
  assert.equal(s.outbox[0].status, "FAILED");
  assert.equal(claimEmail(s, events, runtime), null);
  finishEmail(
    s,
    b.message.id,
    b.message.lease_token!,
    { sent: true, messageId: "provider-id" },
    runtime
  );
  assert.equal(s.outbox[1].status, "SENT");
  assert.equal(s.outbox[1].provider_message_id, "provider-id");
  const later = {
    ...runtime,
    now: () => new Date(new Date(now).getTime() + 65000).toISOString(),
  };
  assert.equal(claimEmail(s, events, later)!.message.attempts, 2);
});
test("outbox skips obsolete E-card versions after regeneration and revoked IDs", () => {
  const s = emptyState(),
    v = createRegistration(s, input(1), events, runtime, "form");
  verify(s, v.registration.registration_id);
  adminCommand(
    s,
    {
      action: "regenerate-id",
      registration_id: v.registration.registration_id,
    },
    events,
    runtime,
    "admin",
    "https://valora.example"
  );
  claimEmail(s, events, runtime);
  const current = claimEmail(s, events, runtime)!;
  assert.equal(s.outbox[1].status, "SKIPPED");
  assert.equal(current.credential!.credential_id, "VM26-00001");
  assert.equal(current.message.credential_version, 2);
});

test("explicit E-card resend preserves the original delivery record", () => {
  const s = emptyState(),
    v = createRegistration(s, input(1), events, runtime, "form");
  verify(s, v.registration.registration_id);
  for (let i = 0; i < 2; i++) {
    const mail = claimEmail(s, events, runtime)!;
    finishEmail(
      s,
      mail.message.id,
      mail.message.lease_token!,
      { sent: true, messageId: "provider-" + i },
      runtime
    );
  }
  adminCommand(
    s,
    { action: "retry-email", registration_id: v.registration.registration_id },
    events,
    runtime,
    "admin",
    "https://valora.example"
  );
  assert.equal(s.outbox.length, 3);
  assert.equal(s.outbox[1].status, "SENT");
  assert.equal(s.outbox[2].status, "PENDING");
  assert.notEqual(s.outbox[1].id, s.outbox[2].id);
});
