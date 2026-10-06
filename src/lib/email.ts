import "server-only";
import nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";
import { DomainError } from "./domain";
import { repository, appUrl } from "./repository";
import { buildEmail, type EmailTransport } from "./email-template";
export function smtpConfig() {
  const host = process.env.SMTP_HOST,
    port = Number(process.env.SMTP_PORT ?? "465"),
    user = process.env.SMTP_USER,
    pass = process.env.SMTP_PASSWORD,
    from = process.env.EMAIL_FROM;
  if (!host || !user || !pass || !from)
    throw new DomainError(
      "EMAIL_CONFIG",
      "Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM to send E-cards.",
      503
    );
  if (![465, 587].includes(port))
    throw new DomainError(
      "EMAIL_CONFIG",
      "Use encrypted SMTP on port 465 or 587.",
      503
    );
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from))
    throw new DomainError(
      "EMAIL_CONFIG",
      "EMAIL_FROM must be a single valid email address.",
      503
    );
  return {
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    tls: { minVersion: "TLSv1.2" as const, rejectUnauthorized: true },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    dnsTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  };
}
export function nodemailerTransport(): EmailTransport {
  const transporter = nodemailer.createTransport(smtpConfig());
  return {
    async send(message: SendMailOptions) {
      const info = await transporter.sendMail(message);
      if (!info.accepted?.length || info.rejected?.length)
        throw new DomainError(
          "SMTP_REJECTED",
          "SMTP did not accept the recipient.",
          503
        );
      return { messageId: info.messageId };
    },
  };
}
export async function drainEmailOutbox(
  limit = 3
): Promise<{ sent: number; failed: number; disabled?: boolean }> {
  if (process.env.EMAIL_PROVIDER !== "nodemailer")
    return { sent: 0, failed: 0, disabled: true };
  const transport = nodemailerTransport(),
    repo = repository(),
    deadline = Date.now() + 45000;
  const result = { sent: 0, failed: 0 };
  for (let i = 0; i < limit && Date.now() < deadline; i++) {
    const envelope = await repo.claimEmail();
    if (!envelope) break;
    try {
      const mail = await buildEmail(
        envelope,
        appUrl(),
        process.env.EMAIL_FROM!
      );
      const sent = await transport.send(mail);
      await repo.finishEmail(
        envelope.message.id,
        envelope.message.lease_token!,
        { sent: true, messageId: sent.messageId }
      );
      result.sent++;
    } catch (error) {
      const code =
        error instanceof DomainError
          ? error.code
          : typeof error === "object" && error && "code" in error
          ? String(error.code)
          : "DELIVERY_FAILED";
      await repo.finishEmail(
        envelope.message.id,
        envelope.message.lease_token!,
        { sent: false, error: code }
      );
      result.failed++;
    }
  }
  return result;
}
export async function safelyDrainEmail() {
  try {
    await drainEmailOutbox();
  } catch (error) {
    console.error(
      "Valora email worker:",
      error instanceof DomainError ? error.code : "DELIVERY_FAILED"
    );
  }
}
