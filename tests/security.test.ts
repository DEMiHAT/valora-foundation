import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  checkPassword,
  issueSession,
  readSession,
} from "../src/lib/security";
import { isSameOrigin } from "../src/lib/request-origin";
import { siteOrigin } from "../src/lib/site-origin";
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
test("same-origin checks use the public request host", () => {
  const request = new Request(
    "https://www.valorafoundation.in/api/volunteers/register",
    { headers: { origin: "https://www.valorafoundation.in" } }
  );
  assert.equal(isSameOrigin(request), true);
  assert.equal(
    isSameOrigin(
      new Request(request.url, {
        headers: { origin: "https://malicious.example" },
      })
    ),
    false
  );
});
test("production links use Valora's public domain", () => {
  const previousVercelEnv = process.env.VERCEL_ENV;
  const previousAppUrl = process.env.APP_URL;
  try {
    process.env.VERCEL_ENV = "production";
    process.env.APP_URL = "https://valora-mu-beryl.vercel.app";
    assert.equal(siteOrigin(), "https://www.valorafoundation.in");
  } finally {
    if (previousVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previousVercelEnv;
    if (previousAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previousAppUrl;
  }
});
