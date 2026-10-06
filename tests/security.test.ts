import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  checkPassword,
  issueSession,
  readSession,
} from "../src/lib/security";
test("organiser passwords are salted and verified with scrypt", () => {
  const hash = hashPassword("a-long-test-password");
  assert.equal(checkPassword("a-long-test-password", hash), true);
  assert.equal(checkPassword("wrong-password", hash), false);
  assert.equal(checkPassword("a-long-test-password", "broken"), false);
  assert.notEqual(hash, hashPassword("a-long-test-password"));
  assert.equal(hash.includes("a-long-test-password"), false);
});
test("valid signed sessions work only for the configured organiser and signing key", () => {
  const key = "s".repeat(64),
    token = issueSession("organiser", key, 1000);
  assert.equal(
    readSession(token, key, "organiser", 2000)?.username,
    "organiser"
  );
  assert.equal(readSession(token, "x".repeat(64), "organiser", 2000), null);
  assert.equal(readSession(token, key, "different-user", 2000), null);
});
test("tampered, malformed and expired session cookies are denied", () => {
  const key = "s".repeat(64),
    token = issueSession("organiser", key, 1000);
  assert.equal(
    readSession(token.slice(0, -1) + "X", key, "organiser", 2000),
    null
  );
  assert.equal(readSession("bad.cookie.extra", key, "organiser", 2000), null);
  assert.equal(
    readSession(token, key, "organiser", 1000 + 8 * 60 * 60 * 1000),
    null
  );
  assert.equal(readSession(token, "weak", "organiser", 2000), null);
});
