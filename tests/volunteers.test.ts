import assert from "node:assert/strict";
import test from "node:test";
import { createVolunteer, emptyState, claimEmail, publicVolunteerCredential, volunteerCount, volunteerCommand, managedEventCommand } from "../src/lib/domain";
import type { Runtime } from "../src/lib/domain";
import type { VolunteerInput, VolunteerProgram } from "../src/lib/models";
import { buildEmail } from "../src/lib/email-template";
import { renderVolunteerCard } from "../src/lib/volunteer-card";

const programs: VolunteerProgram[] = [{
  id: "community",
  slug: "community",
  title: "Valora Community",
  cardTitle: "Community Volunteer",
  description: "Volunteer programme",
  active: true,
}];
let uuid = 0;
const runtime: Runtime = {
  uuid: () => `uuid-${++uuid}`,
  token: () => "a".repeat(64),
  now: () => "2026-11-06T10:00:00.000Z",
};
const input: VolunteerInput = {
  program_id: "community",
  name: "Ananya Sharma",
  email: "ANANYA@example.org",
  phone: "+91 90000 00000",
  city: "New Delhi",
  contributions: ["Event volunteering", "Social media and outreach"],
  consent: true,
};

test("volunteer registration assigns a stable ID, queues one card and counts unique volunteers", () => {
  const state = emptyState();
  const first = createVolunteer(state, input, programs, runtime);
  const duplicate = createVolunteer(state, input, programs, runtime);
  assert.equal(first.volunteer_id, "VF-000001");
  assert.equal(duplicate.volunteer_id, first.volunteer_id);
  assert.equal(state.volunteers.length, 1);
  assert.equal(state.outbox.length, 1);
  assert.equal(volunteerCount(state), 1);
  assert.equal(first.email, "ananya@example.org");
  assert.equal(publicVolunteerCredential(state, first.token, programs, runtime.now())?.name, "Ananya Sharma");
});

test("volunteer email includes a generated PNG card and private card link", async () => {
  const state = emptyState();
  const volunteer = createVolunteer(state, input, programs, runtime);
  const envelope = claimEmail(state, [], runtime, programs);
  assert.ok(envelope?.volunteerCredential);
  assert.equal(envelope?.token, volunteer.token);
  const mail = await buildEmail(envelope!, "https://valora.example", "hello@valora.example");
  assert.equal(mail.attachments?.[0].filename, "VF-000001-volunteer-card.png");
  assert.ok(String(mail.html).includes("/volunteer/id/"));
  const png = await renderVolunteerCard(envelope!.volunteerCredential!, "https://valora.example/volunteer/verify/VF-000001?token=" + volunteer.token);
  assert.equal(png.subarray(1, 4).toString(), "PNG");
});

test("revoked volunteer cards cannot be verified or mailed", () => {
  const state = emptyState();
  const volunteer = createVolunteer(state, input, programs, runtime);
  volunteer.status = "REVOKED";
  assert.equal(publicVolunteerCredential(state, volunteer.token, programs, runtime.now())?.status, "REVOKED");
  assert.equal(claimEmail(state, [], runtime, programs), null);
  assert.equal(state.outbox[0].status, "SKIPPED");
});

test("organisers can create, assign, revoke and remove volunteers", () => {
  const state = emptyState();
  const created = volunteerCommand(state, {
    action: "create",
    program_id: "community",
    name: "Riya Sen",
    email: "riya@example.org",
    phone: "+91 98888 77777",
    city: "Bengaluru",
    contributions: ["Event volunteering"],
    shift: "Morning",
    notes: "Registration desk",
  }, programs, runtime, "organiser");
  assert.equal(created.shift, "Morning");
  const updated = volunteerCommand(state, {
    action: "update",
    volunteer_id: created.volunteer_id,
    program_id: "community",
    name: created.name,
    email: created.email,
    phone: created.phone,
    city: created.city,
    contributions: created.contributions,
    status: "REVOKED",
    shift: "Afternoon",
  }, programs, runtime, "organiser");
  assert.equal(updated.status, "REVOKED");
  volunteerCommand(state, { action: "delete", ...updated }, programs, runtime, "organiser");
  assert.equal(state.volunteers.length, 0);
  assert.deepEqual(state.audit.map((item) => item.action), [
    "volunteer-created",
    "volunteer-updated",
    "volunteer-deleted",
  ]);
});

test("organisers control the public event catalogue independently of historical registrations", () => {
  const state = emptyState();
  assert.equal(state.managed_events.length, 0);
  const event = managedEventCommand(state, {
    action: "create",
    slug: "community-day",
    title: "Community Day",
    type: "Gathering",
    date: "2027-01-10T09:00:00+05:30",
    venue: "Bengaluru",
    description: "A day for learning and community service.",
    status: "PUBLISHED",
  }, runtime, "organiser");
  assert.equal(event.slug, "community-day");
  assert.equal(state.managed_events[0].status, "PUBLISHED");
  managedEventCommand(state, { action: "delete", ...event }, runtime, "organiser");
  assert.equal(state.managed_events.length, 0);
});
