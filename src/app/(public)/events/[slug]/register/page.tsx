import Link from "next/link";
import { RegistrationCheckout } from "@/components/registration-checkout";
import { paymentReady } from "@/lib/razorpay";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import { getEvent, eventDate, formatFee } from "@/data/events";
import { Eyebrow, Included, PageHero, PoweredBy } from "@/components/public";
export const dynamic = "force-dynamic";
export const metadata = { title: "Event registration" };
export default async function Registration({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const event = getEvent((await params).slug);
  if (!event) notFound();
  const ready = paymentReady(event);
  return (
    <>
      <PageHero
        eyebrow={`${event.shortTitle.toUpperCase()} · REGISTRATION`}
        title={
          <>
            Register for<br /><em>{event.shortTitle}.</em>
          </>
        }
        description={`Join ${event.shortTitle} on ${eventDate(
          event
        )}. Select your committee preferences and pay through Razorpay.`}
      />
      <section className="section">
        <div className="container registration-grid">
          <div>
            <RegistrationCheckout event={event} ready={ready} refundPolicy={process.env.PAYMENT_REFUND_POLICY ?? ""} />
          </div>
          <aside className="registration-summary">
            <Link href={`/events/${event.slug}/delegation`} className="school-portal-link">Registering a school group? <strong>Open the delegation portal <ArrowUpRight size={16}/></strong></Link>
            <span className="micro-label">
              DELEGATE FEE
            </span>
            <h3>
              {event.shortTitle} {new Date(event.date).getFullYear()}
            </h3>
            <span className="summary-date">{eventDate(event)}</span>
            <div className="summary-price">
              {formatFee(event)}
              <small>per delegate</small>
            </div>
            <ul>
              {event.summaryIncludes.map((item) => (
                <li key={item}>
                  <Check size={17} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="summary-payment-note"><Check size={17} /> Secure payment. Automatic confirmation.</div>
            <a
              className="text-link"
              href="https://www.instagram.com/valora_foundation/"
              target="_blank"
              rel="noreferrer"
            >
              Follow the announcement <ArrowUpRight size={16} />
            </a>
            <p className="summary-small">
              Your allocation and digital E-ID are emailed after your payment is confirmed.
            </p>
            <PoweredBy compact />
          </aside>
        </div>
      </section>
      <section className="section initiatives-section">
        <div className="container">
          <Eyebrow>INCLUDED IN YOUR DELEGATE FEE</Eyebrow>
          <h2>What’s included</h2>
          <Included event={event} />
          <Link className="text-link" href={`/events/${event.slug}#committees`}>
            Explore the committees <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
