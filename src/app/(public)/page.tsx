import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { OrbitalHero } from "@/components/orbital-hero";
import { DelegateExperience } from "@/components/delegate-experience";
import { publishedSplineUrl } from "@/lib/spline";
import { CommitteeExplorer } from "@/components/committee-explorer";
import { Eyebrow, TextLink, SectionHeading, EventCard, CTA } from "@/components/public";
import { Reveal } from "@/components/reveal";
import { events } from "@/data/events";

export default function Home() {
  return (
    <>
      <OrbitalHero sceneUrl={publishedSplineUrl(process.env.SPLINE_SCENE_URL)} />
      <section id="our-purpose" className="section">
        <div className="container purpose-grid">
          <Reveal>
            <Eyebrow>ABOUT VALORA</Eyebrow>
            <h2>Learning through<br /><em>dialogue.</em></h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lead-text">
              Valora Foundation creates learning and leadership opportunities for young people.
            </p>
            <p>
              Our first event is Valora MUN: a one-day conference where delegates
              practise debate and negotiation, supported by two training sessions.
            </p>
            <TextLink href="/about">About the foundation</TextLink>
          </Reveal>
        </div>
      </section>
      <section className="section featured-section">
        <div className="container">
          <SectionHeading eyebrow="14 NOVEMBER 2026" title="Valora MUN 2026" />
          <Reveal><EventCard /></Reveal>
        </div>
      </section>
      <CommitteeExplorer event={events[0]} sceneUrl={publishedSplineUrl(process.env.SPLINE_COMMITTEE_URL)} />
      <DelegateExperience event={events[0]} sceneUrl={publishedSplineUrl(process.env.SPLINE_EXPERIENCE_URL)} />
      <section className="section">
        <div className="container community-grid">
          <div>
            <Eyebrow>PARTNERSHIPS</Eyebrow>
            <h2>Bring your school<br /><em>to Valora MUN.</em></h2>
            <p>Contact us about student participation, event support or sponsorship.</p>
            <TextLink href="/events/valora-mun/delegation">Register a school delegation</TextLink>
          </div>
          <div className="partner-invitation">
            <span className="micro-label">SCHOOLS & ORGANISATIONS</span>
            <h3>Support the<br />conference.</h3>
            <p>Contribute resources, expertise or event partnerships.</p>
            <Link href="/contact" className="circle-arrow" aria-label="Contact Valora about partnering">
              <ArrowUpRight size={28} />
            </Link>
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
