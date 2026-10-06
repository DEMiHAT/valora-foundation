"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import type { FoundationEvent } from "@/lib/models";
import type { CheckoutSession } from "@/lib/razorpay";

type PaymentResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open(): void; on(event: string, handler: () => void): void };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance } }
let scriptPromise: Promise<void> | undefined;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); scriptPromise = undefined; reject(new Error("Checkout could not load. Please check your connection and retry.")); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}
async function post(path: string, input: unknown) {
  const response = await fetch(path, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(input)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Please try again.");
  return result;
}

export function RegistrationCheckout({ event, ready, refundPolicy }: { event: FoundationEvent; ready: boolean; refundPolicy: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [session, setSession] = useState<CheckoutSession>(), [paid, setPaid] = useState(false);
  const [preferences, setPreferences] = useState<string[]>(Array(event.preferenceCount).fill(""));
  const [resultStatus, setResultStatus] = useState("");
  const inFlight = useRef(false);
  const requestId = useRef<string | undefined>(undefined);
  const storageKey = `valora-checkout:${event.id}`;
  useEffect(() => {
    try { requestId.current = sessionStorage.getItem(`${storageKey}:request`) ?? undefined; const saved = sessionStorage.getItem(storageKey); if (saved) { const parsed = JSON.parse(saved); if (parsed.token && parsed.order_id && parsed.registration_id) setSession(parsed); } } catch {}
  }, [storageKey]);
  async function checkStatus(checkout = session) {
    if (!checkout) return false;
    const result = await post("/api/payments/status", {token: checkout.token});
    if (result.paid) { setPaid(true); setResultStatus(result.status); setNotice(""); return true; }
    return false;
  }
  async function refresh() {
    setBusy(true); setError("");
    try { if (!(await checkStatus())) setNotice("Payment is still awaiting confirmation. If you have paid, keep this reference and check again shortly."); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function open(checkout: CheckoutSession, prefill?: Record<string, string>) {
    if (await checkStatus(checkout)) { setBusy(false); return; }
    await loadCheckout();
    if (!window.Razorpay) throw new Error("Checkout is unavailable. Please retry.");
    const gateway = new window.Razorpay({ key: checkout.key, order_id: checkout.order_id, amount: checkout.amount, currency: checkout.currency,
      name: "Valora Foundation", description: `${event.shortTitle} · Delegate registration`, prefill,
      theme: {color: "#650b25"},
      modal: {ondismiss: () => { setBusy(false); inFlight.current = false; setNotice("Your registration is saved. You can resume this checkout whenever you’re ready."); }},
      handler: async (payment: PaymentResponse) => {
        setBusy(true); setNotice("Confirming your payment…");
        try { const result = await post("/api/payments/verify", {...payment, token: checkout.token}); setPaid(true); setResultStatus(result.status); setNotice(""); }
        catch (e) { setError((e as Error).message); setNotice("If your payment was debited, use Check payment status. Your registration will also update through the payment provider."); }
        finally { setBusy(false); inFlight.current = false; }
      },
    });
    gateway.on("payment.failed", () => { setBusy(false); inFlight.current = false; setError("Payment did not complete. Retry using the same saved checkout."); });
    gateway.open();
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const fields = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
      if (!requestId.current) {
        requestId.current = crypto.randomUUID();
        try { sessionStorage.setItem(`${storageKey}:request`, requestId.current); } catch {}
      }
      const checkout = session ?? await post("/api/payments/order", {...fields, event_id: event.id, request_id: requestId.current, preferences, accepted_terms: fields.accepted_terms === "on"}) as CheckoutSession;
      setSession(checkout); try { sessionStorage.setItem(storageKey, JSON.stringify(checkout)); } catch {}
      await open(checkout, {name: fields.name, email: fields.email, contact: fields.phone});
    } catch (e) { setError((e as Error).message); setBusy(false); inFlight.current = false; }
  }
  if (paid) return <div className="checkout-success"><CheckCircle2 size={48} strokeWidth={1.2} /><h2>Payment confirmed.</h2><p>{resultStatus === "MANUAL_ALLOCATION_REQUIRED" ? "Your chosen committees are full. Our team will arrange your allocation and email your E-ID." : "Your committee allocation and digital E-ID will be sent to your registered email. Check your inbox and spam folder."}</p><div className="checkout-reference">Registration reference<strong>{session?.registration_id}</strong></div><Link href={`/events/${event.slug}`} className="button button-primary">Conference details <ArrowUpRight size={18} /></Link></div>;
  return <div className="checkout-panel"><div className="checkout-panel-heading"><h2>{session ? "Resume registration" : "Delegate registration"}</h2><p>{session ? "Your registration is saved in this browser tab. Resume your payment or check its status." : `Enter your details and rank ${event.preferenceCount} committee preferences.`}</p></div>
    {!ready && <div className="important-note"><ShieldCheck size={22} /><div><h3>Registration opens soon</h3><p>Payments are not open yet. Contact Valora for registration updates.</p></div></div>}
    <form onSubmit={submit}>
      {!session && <><div className="checkout-fields">{event.fields.map(field => <label key={field.key}>{field.label}{field.required && <span> *</span>}{field.type === "select" ? <select name={field.key} required={field.required} defaultValue="Beginner">{field.options?.map(option => <option key={option}>{option}</option>)}</select> : <input name={field.key} type={field.type} required={field.required} maxLength={field.key === "email" ? 254 : field.key === "phone" ? 20 : 120} autoComplete={field.key === "name" ? "name" : field.key === "email" ? "email" : field.key === "phone" ? "tel" : "off"} placeholder={field.key === "name" ? "Your full name" : field.key === "email" ? "you@example.com" : field.key === "phone" ? "+91" : field.label} />}</label>)}</div>
      <div className="checkout-preferences"><h3>Committee preferences</h3><p>Rank your top {event.preferenceCount}. We’ll consider each in order, subject to availability.</p><div className="checkout-preference-grid">{preferences.map((value, i) => <label key={i}>0{i+1} / {i === 0 ? "First" : i === 1 ? "Second" : "Third"} choice<select required value={value} onChange={e => setPreferences(prev => prev.map((p,n) => n === i ? e.target.value : p))}><option value="">Select a committee</option>{event.categories.map(c => <option key={c.id} value={c.id} disabled={preferences.includes(c.id) && value !== c.id}>{c.name}</option>)}</select></label>)}</div></div>
      <div className="refund-policy"><strong>Cancellations & refunds</strong><p>{refundPolicy || "The organiser will publish the refund policy before opening payments."}</p></div>
      <label className="checkout-consent"><input type="checkbox" name="accepted_terms" required /><span>I agree to the <Link href="/terms" target="_blank">event terms</Link> and <Link href="/privacy" target="_blank">privacy policy</Link>, including the refund policy above.</span></label></>}
      {error && <p className="checkout-error" role="alert">{error}</p>}{notice && <p className="checkout-notice" role="status">{notice}</p>}
      <button type="submit" className="button button-primary checkout-pay" disabled={!ready || busy}>{busy ? <><Loader2 size={18} className="checkout-spinner" />Please wait…</> : <>{session ? "Resume secure payment" : `Continue to payment · ₹${event.fee.toLocaleString("en-IN")}`}<ArrowUpRight size={18} /></>}</button>
      {session && <><button type="button" className="checkout-status" onClick={refresh} disabled={busy}><RefreshCw size={15} />Check payment status</button><div className="checkout-reference">Your saved registration<strong>{session.registration_id}</strong></div></>}
      <span className="checkout-security"><ShieldCheck size={15} />Secure checkout by Razorpay · UPI, cards & more</span>
    </form>
  </div>;
}
