import type { SendMailOptions } from "nodemailer";
import { createHash } from "node:crypto";
import type { DeliveryEnvelope } from "./models";
import { escapeHtml, renderEcard } from "./ecard";
import { renderVolunteerCard } from "./volunteer-card";
export interface EmailTransport {
  send(message: SendMailOptions): Promise<{ messageId: string }>;
}
export async function buildEmail(
  envelope: DeliveryEnvelope,
  origin: string,
  from: string
): Promise<SendMailOptions> {
  const { message, credential, volunteerCredential, token } = envelope;
  const host = new URL(origin).hostname;
  const id = createHash("sha256").update(message.id).digest("hex");
  const mail: SendMailOptions = {
    from: { name: "Valora Foundation", address: from },
    to: message.to,
    subject: message.subject,
    text: message.body,
    messageId: `<${id}@${host}>`,
    disableFileAccess: true,
    disableUrlAccess: true,
  };
  const footer =
    '<p style="font-size:12px;color:#75756d;margin-top:28px">Knowledge. Growth. Empathy.<br>Valora Foundation</p>';
  if (volunteerCredential && token) {
    const cardUrl = origin + "/volunteer/id/" + encodeURIComponent(token),
      verifyUrl = origin + "/volunteer/verify/" + encodeURIComponent(volunteerCredential.volunteer_id) + "?token=" + encodeURIComponent(token),
      png = await renderVolunteerCard(volunteerCredential, verifyUrl);
    mail.html = `<div style="background:#eef2f6;padding:24px;font-family:Arial,sans-serif"><div style="max-width:580px;margin:auto;background:#fff"><div style="background:#102f55;padding:27px;color:#f0ca4f;font-size:27px;font-weight:700">VALORA FOUNDATION</div><div style="padding:30px"><h1 style="color:#102f55;font-size:28px">Your volunteer card is ready.</h1><p>Hello ${escapeHtml(volunteerCredential.name)},</p><p>Thank you for joining <strong>${escapeHtml(volunteerCredential.program)}</strong>. Your unique volunteer ID is <strong>${escapeHtml(volunteerCredential.volunteer_id)}</strong>.</p><p><a href="${escapeHtml(cardUrl)}" style="display:inline-block;background:#102f55;color:white;text-decoration:none;padding:14px 22px">View your volunteer card</a></p><p style="font-size:13px;color:#666;line-height:1.8">Your digital card is attached. Keep the private card link safe; its QR verifies your active volunteer registration.</p><img src="cid:valora-volunteer-card" alt="Your Valora volunteer card" width="440" style="width:100%;max-width:440px;height:auto;display:block">${footer}</div></div></div>`;
    mail.attachments = [{
      filename: `${volunteerCredential.volunteer_id}-volunteer-card.png`,
      content: png,
      contentType: "image/png",
      cid: "valora-volunteer-card",
      contentDisposition: "attachment",
    }];
  } else if (credential && token) {
    const cardUrl = origin + "/id/" + encodeURIComponent(token),
      verifyUrl =
        origin +
        "/verify/" +
        encodeURIComponent(credential.credential_id) +
        "?token=" +
        encodeURIComponent(token);
    const png = await renderEcard(credential, verifyUrl);
    const date = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(new Date(credential.validUntil));
    mail.html = `<div style="background:#f0eee6;padding:24px;font-family:Arial,sans-serif"><div style="max-width:580px;margin:auto;background:#fff"><div style="background:#650b25;padding:27px;color:#dbbd77;font-family:Georgia,serif;font-size:27px">VALORA FOUNDATION</div><div style="padding:30px"><h1 style="font-family:Georgia,serif;color:#650b25;font-size:28px;font-weight:400">Your place is confirmed.</h1><p>Hello ${escapeHtml(
      credential.participant
    )},</p><p>Your payment is verified and your allocation for ${escapeHtml(
      credential.event
    )} is complete.</p><table role="presentation" style="width:100%;font-size:14px;border-collapse:collapse"><tr><td style="padding:10px 0;color:#777">Committee</td><td>${escapeHtml(
      credential.committee
    )}</td></tr><tr><td style="padding:10px 0;color:#777">Portfolio</td><td>${escapeHtml(
      credential.portfolio
    )}</td></tr><tr><td style="padding:10px 0;color:#777">Valora E-ID</td><td>${escapeHtml(
      credential.credential_id
    )}</td></tr><tr><td style="padding:10px 0;color:#777">Event validity</td><td>${escapeHtml(
      date
    )}</td></tr></table><p><a href="${escapeHtml(
      cardUrl
    )}" style="display:inline-block;background:#650b25;color:white;text-decoration:none;padding:14px 22px">View &amp; print your E-card</a></p><p style="font-size:13px;color:#666;line-height:1.8">Your digital E-card is attached. Save it to your phone and bring it to the event. Keep the private card link safe. The QR lets organisers verify your name and allocation.</p><img src="cid:valora-ecard" alt="Your Valora delegate E-card" width="440" style="width:100%;max-width:440px;height:auto;display:block">${footer}</div></div></div>`;
    mail.attachments = [
      {
        filename: `${credential.credential_id}-ecard.png`,
        content: png,
        contentType: "image/png",
        cid: "valora-ecard",
        contentDisposition: "attachment",
      },
    ];
  } else
    mail.html = `<div style="max-width:580px;padding:30px;background:#f8f7f2;font-family:Arial,sans-serif"><h1 style="font-family:Georgia,serif;color:#650b25;font-size:26px;font-weight:400">Valora Foundation</h1><div style="font-size:14px;line-height:1.8;white-space:pre-line">${escapeHtml(
      message.body
    )}</div>${footer}</div>`;
  return mail;
}
