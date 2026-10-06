import { test } from "node:test";
import assert from "node:assert/strict";
import { registrationSchema, commandSchema } from "../src/lib/validation";
import { parseVerificationLink } from "../src/lib/verification-link";
import { events } from "../src/data/events";
test("payment commands and form imports are validated at the boundary", () => {
  assert.equal(
    commandSchema.safeParse({
      action: "delete-everything",
      registration_id: "x",
    }).success,
    false
  );
  assert.equal(
    registrationSchema.safeParse({ name: "x", email: "not-an-email" }).success,
    false
  );
  assert.equal(
    commandSchema.safeParse({
      action: "update-payment",
      registration_id: "x",
      payment_reference: "=HYPERLINK()",
    }).success,
    false
  );
});
test("QR scanner accepts only secure same-origin verification links", () => {
  const token = "b".repeat(64);
  assert.equal(
    parseVerificationLink(
      `https://valora.example/verify/VM26-00001?token=${token}`,
      "https://valora.example"
    ),
    `/verify/VM26-00001?token=${token}`
  );
  assert.throws(
    () =>
      parseVerificationLink(
        `https://evil.example/verify/VM26-00001?token=${token}`,
        "https://valora.example"
      ),
    /this Valora/
  );
  assert.throws(
    () => parseVerificationLink("/verify/VM26-00001", "https://valora.example"),
    /full verification/
  );
  assert.throws(() =>
    parseVerificationLink("javascript:alert(1)", "https://valora.example")
  );
});
test("event data has unique reusable category IDs and full editable matrices", () => {
  assert.equal(new Set(events.map((e) => e.id)).size, events.length);
  assert.equal(new Set(events.map((e) => e.idPrefix)).size, events.length);
  for (const event of events) {
    assert.equal(
      new Set(event.categories.map((c) => c.id)).size,
      event.categories.length
    );
    for (const c of event.categories) {
      assert.ok(c.portfolios.length >= c.capacity);
      assert.equal(new Set(c.portfolios).size, c.portfolios.length);
    }
    assert.ok(event.preferenceCount <= event.categories.length);
  }
});
