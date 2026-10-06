import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  XCircle,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";
import type { PublicCredential } from "@/lib/models";
import { qrDataUrl } from "@/lib/qr";
import { appUrl } from "@/lib/repository";
import { PrintCard } from "./print-card";
export function CredentialCard({
  credential,
  token,
}: {
  credential: PublicCredential;
  token: string;
}) {
  const verifyUrl = `${appUrl()}/verify/${encodeURIComponent(
    credential.credential_id
  )}?token=${encodeURIComponent(token)}`;
  const date = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(credential.validUntil));
  return (
    <div className="credential-page">
      <div className="credential-intro">
        <span className="micro-label">YOUR DIGITAL VALORA E-ID</span>
        <h1>
          Ready for your
          <br />
          next chapter.
        </h1>
        <p>
          Save your E-card to your phone or print it.
          <br />
          Bring the secure QR to the event.
        </p>
        <PrintCard token={token} />
      </div>
      <article
        className={`delegate-card ${
          credential.status !== "ACTIVE" ? "credential-inactive" : ""
        }`}
      >
        <div className="delegate-card-brand">
          <Image
            src="/brand/crest.png"
            alt="Valora crest"
            width={68}
            height={64}
          />
          <div>
            <span>VALORA</span>
            <small>FOUNDATION</small>
          </div>
          <ShieldCheck size={24} />
        </div>
        <div className="delegate-card-body">
          <span className="micro-label">OFFICIAL DELEGATE</span>
          <h2>{credential.participant}</h2>
          <p className="delegate-event">{credential.event}</p>
          <div className="delegate-allocation">
            <div>
              <span>COMMITTEE / CATEGORY</span>
              <strong>{credential.committee}</strong>
            </div>
            <div>
              <span>PORTFOLIO</span>
              <strong>{credential.portfolio}</strong>
            </div>
          </div>
          <div className="delegate-qr-row">
            <div>
              <span className="micro-label">VALORA E-ID</span>
              <strong className="delegate-id">
                {credential.credential_id}
              </strong>
              <span className="delegate-validity">VALID FOR {date}</span>
              <span
                className={`verification-pill ${
                  credential.status === "ACTIVE" ? "is-valid" : "is-invalid"
                }`}
              >
                {credential.status === "ACTIVE" ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <XCircle size={13} />
                )}{" "}
                {credential.status}
              </span>
            </div>
            <div className="delegate-qr">
              <img
                src={qrDataUrl(verifyUrl)}
                alt="Secure QR to verify this E-ID"
                width={150}
                height={150}
              />
              <span>SCAN TO VERIFY</span>
            </div>
          </div>
          <div className="delegate-card-note">
            Knowledge. Growth. Empathy.<span>VALORA FOUNDATION</span>
          </div>
        </div>
      </article>
    </div>
  );
}
export function VerificationResult({
  credential,
}: {
  credential: PublicCredential | null;
}) {
  if (!credential)
    return (
      <section className="verification-card">
        <XCircle className="verification-icon invalid-icon" size={44} />
        <span className="micro-label">VALORA E-ID VERIFICATION</span>
        <h1>Unable to verify this ID.</h1>
        <p>
          Scan the secure QR on the current E-card. An E-ID number alone cannot
          verify a participant. The QR may have been replaced or the link may be
          incomplete.
        </p>
        <Link href="/verify" className="button button-primary">
          Try another E-ID <ArrowUpRight size={16} />
        </Link>
      </section>
    );
  const active = credential.status === "ACTIVE";
  return (
    <section className="verification-card">
      {active ? (
        <ShieldCheck className="verification-icon" size={47} />
      ) : (
        <XCircle className="verification-icon invalid-icon" size={47} />
      )}
      <span className="micro-label">VALORA E-ID VERIFICATION</span>
      <h1>
        {active
          ? "Verified delegate."
          : credential.status === "REVOKED"
          ? "This E-ID is revoked."
          : "This E-ID has expired."}
      </h1>
      <span
        className={`verification-pill ${active ? "is-valid" : "is-invalid"}`}
      >
        {active ? <CheckCircle2 size={15} /> : <XCircle size={15} />}{" "}
        {active ? "VALID & ACTIVE" : credential.status}
      </span>
      <div className="verification-person">
        <h2>{credential.participant}</h2>
        <span>{credential.credential_id}</span>
      </div>
      <dl className="verification-details">
        <div>
          <dt>Event</dt>
          <dd>{credential.event}</dd>
        </div>
        <div>
          <dt>Committee / category</dt>
          <dd>{credential.committee}</dd>
        </div>
        <div>
          <dt>Portfolio</dt>
          <dd>{credential.portfolio}</dd>
        </div>
        <div>
          <dt>Valid until</dt>
          <dd>
            {new Intl.DateTimeFormat("en-IN", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            }).format(new Date(credential.validUntil))}{" "}
            IST
          </dd>
        </div>
      </dl>
      <p className="verification-disclaimer">
        {active
          ? "This QR confirms the current event credential and allocation."
          : "Do not accept this credential for entry."}{" "}
        No email, phone, institution or payment details are shared here.
      </p>
      <Link href="/verify" className="text-link">
        Verify another E-ID <ArrowUpRight size={15} />
      </Link>
    </section>
  );
}
