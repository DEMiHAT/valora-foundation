import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  Globe2,
  BookOpen,
  HeartHandshake,
  CalendarDays,
  MapPin,
  MoveUpRight,
  Check,
  Instagram,
} from "lucide-react";
import { foundation } from "@/data/foundation";
import { events, eventDate, formatFee } from "@/data/events";
import type { FoundationEvent } from "@/lib/models";
import { Reveal } from "./reveal";
export function Eyebrow({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div className={`eyebrow ${light ? "eyebrow-light" : ""}`}>
      <span />
      {children}
    </div>
  );
}
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="text-link">
      {children}
      <ArrowUpRight size={18} />
    </Link>
  );
}
export function GlobeArt() {
  return (
    <svg
      className="globe-art"
      viewBox="0 0 700 700"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="globeShade">
          <stop stopColor="#d7b467" stopOpacity=".08" />
          <stop offset="1" stopColor="#d7b467" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="350" cy="350" r="305" fill="url(#globeShade)" />
      {[305, 230, 140, 55].map((r) => (
        <ellipse key={r} cx="350" cy="350" rx={r} ry="305" />
      ))}
      {[305, 230, 140, 55].map((r) => (
        <ellipse key={"y" + r} cx="350" cy="350" rx="305" ry={r} />
      ))}
      <path d="M45 350h610M350 45v610" />
      <circle cx="350" cy="350" r="335" strokeDasharray="2 13" />
    </svg>
  );
}
export function PoweredBy({ compact = false }: { compact?: boolean }) {
  return <div className={`powered-by ${compact ? "powered-by-compact" : ""}`}><span>POWERED BY</span><Image src="/brand/aperture-intelligence.png" alt="Aperture Intelligence Private Limited" width={220} height={80} /></div>;
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div className="footer-identity">
          <Link href="/" className="brand footer-brand">
            <Image
              src="/brand/crest.png"
              alt="Valora crest"
              width={63}
              height={59}
            />
            <span>
              VALORA<small>FOUNDATION</small>
            </span>
          </Link>
          <p>
            Knowledge. Growth. Empathy.

          </p>
          <a
            className="social-link"
            href={foundation.instagram}
            target="_blank"
            rel="noreferrer"
          >
            <Instagram size={18} /> @valora_foundation{" "}
            <ArrowUpRight size={14} />
          </a>
          <PoweredBy />
        </div>
        <div className="footer-links">
          <span>THE FOUNDATION</span>
          <Link href="/about">Our story</Link>
          <Link href="/initiatives">Our initiatives</Link>
          <Link href="/partners">Partner with us</Link>
          <Link href="/media">Media & updates</Link>
        </div>
        <div className="footer-links">
          <span>GET INVOLVED</span>
          <Link href="/events">Explore events</Link>
          <Link href="/events/valora-mun">Valora MUN 2026</Link>
          <Link href="/events/valora-mun/register">Registration</Link>
          <Link href="/events/valora-mun/delegation">School delegation</Link>
          <Link href="/contact">Contact us</Link>
        </div>
        <div className="footer-note">
          <span>VALORA MUN 2026</span>
          <h3>
            14 November
          </h3>
          <Link href="/events/valora-mun/register">
            <ArrowUpRight size={30} />
            <span>Register for MUN</span>
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Valora Foundation</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Event terms</Link>
          <Link href="/admin">Organiser access</Link>
        </div>
      </div>
    </footer>
  );
}
export function CTA() {
  return (
    <section className="cta-section">
      <div className="container cta-inner">
        <div>
          <Eyebrow light>14 NOVEMBER 2026</Eyebrow>
          <h2>
            Join<br />
            <em>Valora MUN.</em>
          </h2>
        </div>
        <div>
          <p>
            Six committees. Two training sessions.
            <br />
            ₹999 per delegate.
          </p>
          <Link
            href="/events/valora-mun/register"
            className="button button-gold"
          >
            Register for MUN <ArrowUpRight size={18} />
          </Link>
          <Link href="/contact" className="cta-secondary">
            Partner with the foundation <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
export function InitiativeCards() {
  const icons = [Globe2, BookOpen, HeartHandshake];
  return (
    <div className="initiative-grid">
      {foundation.initiatives.map((item, i) => {
        const Icon = icons[i];
        return (
          <Reveal key={item.id} delay={i * 0.08}>
            <Link href={item.href} className="initiative-card">
              <div className="initiative-card-top">
                <Icon size={30} strokeWidth={1.3} />
                <span>{item.number}</span>
              </div>
              <span className="micro-label">{item.label}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="initiative-card-bottom">
                <span>{item.status}</span>
                <ArrowUpRight size={21} />
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
export function EventCard({ event = events[0] }: { event?: FoundationEvent }) {
  return (
    <article className="event-card">
      <div className="event-poster">
        <div className="poster-sculpture" aria-hidden="true"><span className="poster-sculpture-core"/><span className="poster-sculpture-ring poster-sculpture-ring-one"/><span className="poster-sculpture-ring poster-sculpture-ring-two"/><span className="poster-sculpture-dot"/></div>
        <div className="poster-heading">
          <span>A VALORA FOUNDATION CONFERENCE</span>
          <h3>
            <span>{event.shortTitle.split(" ")[0].toUpperCase()}</span>
            <span className="poster-title-line"><i>{event.shortTitle.split(" ").slice(1).join(" ").toUpperCase()}</i><small>’{new Date(event.date).getFullYear().toString().slice(-2)}</small></span>
          </h3>
          <p className="preserve-lines">{event.tagline}</p>
        </div>
        <span className="poster-date">
          {new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "Asia/Kolkata",
          })
            .format(new Date(event.date))
            .replaceAll("/", ".")}{" "}
          <span>{event.type.toUpperCase()}</span>
        </span>
        <Image
          className="poster-crest"
          src="/brand/crest.png"
          alt=""
          width={108}
          height={102}
        />
      </div>
      <div className="event-card-content">
        <span className="status-badge">
          <span /> UPCOMING CONFERENCE
        </span>
        <h3>
          {event.shortTitle} {new Date(event.date).getFullYear()}
        </h3>
        <p>{event.description}</p>
        <div className="event-meta">
          <span>
            <CalendarDays size={17} />
            {eventDate(event)}
          </span>
          <span>
            <MapPin size={17} />
            {event.venue}
          </span>
        </div>
        <div className="event-card-footer">
          <span className="event-price">
            {formatFee(event)} <small>/ delegate · all inclusive</small>
          </span>
          <Link
            className="button button-primary"
            href={`/events/${event.slug}`}
          >
            Explore event <ArrowUpRight size={17} />
          </Link>
        </div>
        <PoweredBy compact />
      </div>
    </article>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkText,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && <TextLink href={href}>{linkText ?? "Explore more"}</TextLink>}
    </div>
  );
}
export function Included({ event }: { event: FoundationEvent }) {
  return (
    <div className="included-grid">
      {event.includes.map((group, i) => (
        <div className="included-card" key={group.title}>
          <span className="included-number">0{i + 1}</span>
          <h3>{group.title}</h3>
          {group.items.map((item) => (
            <p key={item}>
              <Check size={16} />
              {item}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
export function FAQ({ event }: { event: FoundationEvent }) {
  return (
    <div className="faq-list">
      {event.faqs.map((f, i) => (
        <details key={f.question}>
          <summary>
            <span className="faq-number">0{i + 1}</span>
            {f.question}
            <span className="faq-plus">+</span>
          </summary>
          <p>{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <section className="page-hero">
      <div className="container">
        <Eyebrow light>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <span className="page-hero-mark" aria-hidden="true">
        V.
      </span>
    </section>
  );
}
