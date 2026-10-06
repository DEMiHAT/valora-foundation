import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import nodemailer from "nodemailer";
import sharp from "sharp";
import { buildEmail } from "../src/lib/email-template";
import { renderEcard, escapeHtml } from "../src/lib/ecard";
import type { DeliveryEnvelope, PublicCredential } from "../src/lib/models";
const credential: PublicCredential = {
  credential_id: "VM26-00427",
  participant: "Ananya Krishnan",
  event: "Valora Model United Nations",
  event_id: "valora-mun-2026",
  committee: "WHO",
  portfolio: "India",
  status: "ACTIVE",
  validUntil: "2026-11-14T23:59:59+05:30",
};
const token = "a".repeat(64),
  origin = "https://valora.example";
const envelope: DeliveryEnvelope = {
  message: {
    id: "allocation:registration:1",
    to: "delegate@example.org",
    subject: "Your Valora E-ID",
    body: "Your allocation and E-card are ready.",
    status: "SENDING",
    created_at: "2026-10-03T12:00:00Z",
  },
  credential,
  token,
};
test("Nodemailer composes a real multipart E-card email without network delivery", async () => {
  const mail = await buildEmail(envelope, origin, "events@valora.example");
  assert.equal(mail.to, "delegate@example.org");
  assert.match(mail.html as string, /View &amp; print your E-card/);
  assert.match(mail.html as string, /VM26-00427/);
  assert.equal(mail.attachments?.length, 1);
  assert.equal(mail.attachments![0].filename, "VM26-00427-ecard.png");
  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: "unix",
  });
  const output = await transport.sendMail(mail);
  const mime = output.message.toString();
  assert.ok(
    mime.includes("Content-Type: multipart/alternative"),
    "Multipart plain-text/HTML email"
  );
  assert.ok(mime.includes("Content-Type: image/png"), "PNG attachment in MIME");
  assert.ok(
    mime.includes("Content-Disposition: attachment"),
    "Downloadable attachment"
  );
  assert.ok(mime.includes("VM26-00427-ecard.png"), "Credential filename");
  assert.equal(typeof output.messageId, "string");
});
test("E-card is a valid 900×1120 PNG with the actual secure QR", async () => {
  const png = await renderEcard(
    credential,
    `${origin}/verify/${credential.credential_id}?token=${token}`
  );
  const metadata = await sharp(png).metadata();
  assert.equal(metadata.format, "png");
  assert.equal(metadata.width, 900);
  assert.equal(metadata.height, 1120);
  await mkdir("/tmp/valora-qa", { recursive: true });
  await writeFile("/tmp/valora-qa/ecard.png", png);
});
test("participant and event strings are HTML escaped in email content", async () => {
  const mail = await buildEmail(
    {
      ...envelope,
      credential: {
        ...credential,
        participant: "<img src=x onerror=alert(1)>",
        portfolio: "A&B",
      },
    },
    origin,
    "events@valora.example"
  );
  assert.equal((mail.html as string).includes("<img src=x"), false);
  assert.match(mail.html as string, /&lt;img/);
  assert.match(mail.html as string, /A&amp;B/);
  assert.equal(escapeHtml('"<&'), "&quot;&lt;&amp;");
});
test("registration emails do not attach an E-card before allocation", async () => {
  const mail = await buildEmail(
    { message: envelope.message },
    origin,
    "events@valora.example"
  );
  assert.equal(mail.attachments, undefined);
  assert.match(mail.html as string, /Valora Foundation/);
});
