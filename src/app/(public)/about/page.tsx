import Image from "next/image";
import { PageHero, Eyebrow, CTA, TextLink } from "@/components/public";
import { foundation } from "@/data/foundation";
export const metadata = { title: "About the foundation" };
export default function About() {
  return (
    <>
      <PageHero eyebrow="VALORA FOUNDATION" title="About Valora." description={foundation.mission} />
      <section className="section">
        <div className="container about-grid">
          <div className="about-crest">
            <Image src="/brand/crest.png" alt="Valora Foundation crest: knowledge, growth and empathy" width={330} height={309} />
            <span>KNOWLEDGE. GROWTH. EMPATHY.</span>
          </div>
          <div>
            <Eyebrow>OUR WORK</Eyebrow>
            <h2>Learning and<br /><em>leadership.</em></h2>
            <p className="lead-text">Valora Foundation is a new organisation creating opportunities for young people to learn, debate and lead.</p>
            <p>Our inaugural event, Valora MUN, takes place on 14 November 2026. Delegates practise debate and negotiation across six committees, with two training sessions included.</p>
            <TextLink href="/events/valora-mun">Explore Valora MUN</TextLink>
          </div>
        </div>
      </section>
      <section className="section initiatives-section">
        <div className="container">
          <Eyebrow>OUR VALUES</Eyebrow>
          <h2>Knowledge. Growth. Empathy.</h2>
          <div className="principle-grid">
            {[
              {name: "Knowledge", text: "Ask questions, examine evidence and understand the issues."},
              {name: "Growth", text: "Build skills through training, practice and experience."},
              {name: "Empathy", text: "Listen to other perspectives and consider how decisions affect people."},
            ].map((v, i) => <div className="principle" key={v.name}><span>0{i + 1}</span><h3>{v.name}</h3><p>{v.text}</p></div>)}
          </div>
        </div>
      </section>
      {foundation.team.length > 0 && <section className="section"><div className="container"><Eyebrow>OUR TEAM</Eyebrow><h2>Meet the organisers.</h2>{foundation.team.map(p => <article key={p.name}><h3>{p.name}</h3><p>{p.role}</p><p>{p.bio}</p></article>)}</div></section>}
      <CTA />
    </>
  );
}
