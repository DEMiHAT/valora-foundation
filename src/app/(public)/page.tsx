import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { OrbitalHero } from "@/components/orbital-hero";
import { publishedSplineUrl } from "@/lib/spline";
import { Eyebrow, TextLink, InitiativeCards, CTA } from "@/components/public";
import { Reveal } from "@/components/reveal";

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
            <p>We create spaces for dialogue, practical learning and community participation.</p>
            <TextLink href="/about">About the foundation</TextLink>
          </Reveal>
        </div>
      </section>
      <section className="section initiatives-section">
        <div className="container">
          <Eyebrow>OUR INITIATIVES</Eyebrow>
          <h2>Learning. Leadership. Community.</h2>
          <InitiativeCards />
        </div>
      </section>
      <section className="section">
        <div className="container community-grid">
          <div>
            <Eyebrow>PARTNERSHIPS</Eyebrow>
            <h2>Build opportunities<br /><em>with Valora.</em></h2>
            <p>Contact us about learning programmes, community work or partnership opportunities.</p>
            <TextLink href="/partners">Explore partnerships</TextLink>
          </div>
          <div className="partner-invitation">
            <span className="micro-label">SCHOOLS & ORGANISATIONS</span>
            <h3>Support the<br />foundation.</h3>
            <p>Contribute resources, expertise or programme partnerships.</p>
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
