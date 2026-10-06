import Link from "next/link";
import { DelegateExperience } from "@/components/delegate-experience";
import { publishedSplineUrl } from "@/lib/spline";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Users,
  Check,
  GraduationCap,
} from "lucide-react";
import { events, getEvent, eventDate, formatFee } from "@/data/events";
import { committeeLogos } from "@/data/committee-logos";
import { CommitteeMotif } from "@/components/committee-motif";
import {
  Eyebrow,
  GlobeArt,
  SectionHeading,
  Included,
  FAQ,
  PoweredBy,
} from "@/components/public";
export function generateStaticParams() {
  return events.map((e) => ({ slug: e.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const event = getEvent((await params).slug);
  return {
    title: event?.shortTitle ?? "Event",
    description: event?.description,
  };
}
export default async function Event({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const event = getEvent((await params).slug);
  if (!event) notFound();
  return (
    <>
      <section className="event-hero">
        <GlobeArt />
        <div className="container event-hero-grid">
          <div>
            <Link href="/events" className="back-link">
              ← ALL EVENTS
            </Link>
            <Eyebrow light>
              THE INAUGURAL EDITION · {event.type.toUpperCase()}
            </Eyebrow>
            <h1>
              {event.shortTitle.split(" ")[0].toUpperCase()}{" "}
              <em>
                {event.shortTitle.split(" ").slice(1).join(" ").toUpperCase()}
              </em>
              <sup>
                ’{new Date(event.date).getFullYear().toString().slice(-2)}
              </sup>
            </h1>
            <p className="event-hero-tagline preserve-lines">{event.tagline}</p>
            <p>{event.description}</p>
            <Link
              className="button button-gold"
              href={`/events/${event.slug}/register`}
            >
              Register for MUN <ArrowUpRight size={18} />
            </Link>
            <Link className="event-school-link" href={`/events/${event.slug}/delegation`}>Bringing a school delegation? <ArrowUpRight size={17}/></Link>
            <PoweredBy compact />
          </div>
          <div className="event-hero-seal">
            <Image
              src="/brand/crest.png"
              alt="Valora Foundation crest"
              width={280}
              height={263}
            />
            <span>KNOWLEDGE. GROWTH. EMPATHY.</span>
          </div>
        </div>
      </section>
      <div className="event-facts">
        <div className="container">
          <div>
            <CalendarDays />
            <span>
              THE DATE<strong>{eventDate(event)}</strong>
            </span>
          </div>
          <div>
            <MapPin />
            <span>
              THE VENUE<strong>{event.venue}</strong>
            </span>
          </div>
          <div>
            <Users />
            <span>
              THE EXPERIENCE
              <strong>
                {event.categories.length} {event.categoryLabel}
              </strong>
            </span>
          </div>
          <div>
            <GraduationCap />
            <span>
              DELEGATE FEE<strong>{formatFee(event)} · all inclusive</strong>
            </span>
          </div>
        </div>
      </div>
      <section className="section">
        <div className="container purpose-grid">
          <div>
            <Eyebrow>THE EXPERIENCE</Eyebrow>
            <h2 className="preserve-lines">{event.overview.title}</h2>
          </div>
          <div>
            <p className="lead-text">{event.overview.lead}</p>
            {event.overview.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </section>
      <section id="committees" className="section initiatives-section">
        <div className="container">
          <SectionHeading
            eyebrow="COMMITTEES"
            title={`${event.categories.length} ${event.categoryLabel}`}
            description="Indicate your preferences in the registration form. Your committee and portfolio will be confirmed after payment verification."
          />
          <div className="committee-grid">
            {event.categories.map((c, i) => (
              <div className="committee-card" data-committee={c.id} key={c.id}>
                <CommitteeMotif id={c.id}/>
                <div className="committee-card-mark"><Image src={committeeLogos[c.id]?.src??"/brand/crest.png"} alt={committeeLogos[c.id]?.alt??"Valora Foundation crest"} width={90} height={72}/><span>{c.name}</span></div>
                <span className="micro-label">COMMITTEE 0{i + 1}</span>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <span className="committee-bottom">
                  {c.capacity} delegate places <ArrowUpRight size={17} />
                </span>
              </div>
            ))}
          </div>
          <p className="committee-affiliation-note">These are Valora MUN simulations. The emblems identify institutions represented in debate; they do not imply affiliation with or endorsement by those institutions. The AIPPM emblem was created for Valora MUN because the format has no single official institutional logo.</p>
          <div className="committee-source-list">Emblem sources: {Object.entries(committeeLogos).filter(([,logo])=>logo.source).map(([id,logo])=><a key={id} href={logo.source} target="_blank" rel="noreferrer">{event.categories.find(c=>c.id===id)?.name}<ArrowUpRight size={12}/></a>)}</div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <Eyebrow>DELEGATE FEE</Eyebrow>
              <h2>
                What’s included
              </h2>
            </div>
            <div className="big-price">
              {formatFee(event)}
              <span>PER DELEGATE</span>
            </div>
          </div>
          <Included event={event} />
          {event.trainingNote && (
            <div className="training-note">
              <GraduationCap size={33} />
              <div>
                <h3>Training sessions</h3>
                <p>{event.trainingNote}</p>
              </div>
            </div>
          )}
        </div>
      </section>
      <DelegateExperience event={event} sceneUrl={publishedSplineUrl(process.env.SPLINE_EXPERIENCE_URL)} />
      <section className="section faq-section">
        <div className="container faq-grid">
          <div>
            <Eyebrow>FAQ</Eyebrow>
            <h2>
              Frequently asked<br />questions.
            </h2>
            <p>
              Need something else?
              <br />
              <Link href="/contact" className="text-link">
                Reach the Valora team <ArrowUpRight size={16} />
              </Link>
            </p>
          </div>
          <FAQ event={event} />
        </div>
      </section>
      <section className="section">
        <div className="container">
          <Eyebrow>BACKING & PARTNERSHIPS</Eyebrow>
          <h2>Support the conference.</h2>
          <p>
            Contact us about sponsorship, resources or school participation.
          </p>
          <Link href="/partners" className="text-link">
            Partner with Valora <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section className="cta-section">
        <div className="container cta-inner">
          <div>
            <Eyebrow light>14 NOVEMBER 2026</Eyebrow>
            <h2>
              Join<br /><em>{event.shortTitle}.</em>
            </h2>
          </div>
          <div>
            <p>
              {formatFee(event)} per delegate. Training included.
            </p>
            <Link
              className="button button-gold"
              href={`/events/${event.slug}/register`}
            >
              Register for MUN <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
