"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import type { VolunteerProgram } from "@/lib/models";
import { volunteerContributionOptions } from "@/data/volunteer-programs";

type Success = { volunteer_id: string; name: string; email: string; message: string };

export function VolunteerRegistration({ programs }: { programs: VolunteerProgram[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Success | null>(null);
  const toggle = (value: string) =>
    setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/volunteers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: String(form.get("program_id") ?? ""),
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          city: String(form.get("city") ?? ""),
          contributions: selected,
          consent: form.get("consent") === "on",
          website: String(form.get("website") ?? ""),
        }),
      });
      const data = await response.json() as Success & { error?: string };
      if (!response.ok) throw new Error(data.error || "Registration could not be completed.");
      setSuccess(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Registration could not be completed.");
    } finally { setBusy(false); }
  }

  if (success) return (
    <div className="volunteer-success" role="status">
      <CheckCircle2 size={52} />
      <span className="micro-label">REGISTRATION COMPLETE</span>
      <h2>Welcome, {success.name}.</h2>
      <p>Your volunteer ID is <strong>{success.volunteer_id}</strong>. We’ve queued your volunteer card for delivery to <strong>{success.email}</strong>.</p>
      <p className="small-note">Check your inbox and spam folder. Delivery can take a few minutes.</p>
    </div>
  );

  return (
    <form className="volunteer-form" onSubmit={submit}>
      <div className="volunteer-form-heading"><span className="micro-label">VOLUNTEER REGISTRATION</span><h2>Join the community.</h2><p>Tell us how you’d like to contribute. Your unique volunteer card will be emailed automatically after registration.</p></div>
      {programs.length > 1 ? <label>Programme or event *<select name="program_id" required defaultValue={programs[0]?.id}>{programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select></label> : <input type="hidden" name="program_id" value={programs[0]?.id ?? ""} />}
      <div className="volunteer-field-grid">
        <label>Full name *<input name="name" required maxLength={120} autoComplete="name" placeholder="Enter your full name" /></label>
        <label>Email address *<input name="email" required type="email" maxLength={254} autoComplete="email" placeholder="you@example.com" /></label>
        <label>Phone number *<input name="phone" required type="tel" maxLength={25} autoComplete="tel" placeholder="+91 XXXXX XXXXX" /></label>
        <label>City / location *<input name="city" required maxLength={100} autoComplete="address-level2" placeholder="Your city" /></label>
      </div>
      <fieldset><legend>How would you like to contribute? <small>Select any that apply *</small></legend><div className="volunteer-options">{volunteerContributionOptions.map((option) => <label key={option} className={selected.includes(option) ? "is-selected" : ""}><input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} /> <span>{option}</span></label>)}</div></fieldset>
      <label className="volunteer-consent"><input name="consent" type="checkbox" required /> <span>I agree that Valora Foundation may store these details to coordinate volunteering and email my volunteer card. See the <Link href="/privacy">privacy policy</Link>.</span></label>
      <label className="volunteer-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary" type="submit" disabled={busy || selected.length === 0}>{busy ? "Registering…" : <>Register as a volunteer <Send size={17} /></>}</button>
    </form>
  );
}
