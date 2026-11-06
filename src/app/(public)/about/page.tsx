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
            <p>We are developing programmes that help young people practise dialogue, build confidence and contribute meaningfully to their communities.</p>
            <TextLink href="/initiatives">Explore our initiatives</TextLink>
          </div>
        </div>
      </section>
      <section className="director-message-section">
        <div className="director-message-backdrop" aria-hidden="true">
          <Image src="/leadership/neha-chairperson.jpeg" alt="" fill sizes="100vw" loading="eager" />
        </div>
        <div className="container director-message-layout">
          <div className="director-portraits" aria-label="Portraits of Neha Gokul">
            <figure className="director-portrait director-portrait-primary">
              <Image
                src="/leadership/neha-portrait-garden.jpeg"
                alt="Neha Gokul, Executive Director of Valora Foundation"
                fill
                sizes="(max-width: 700px) 72vw, 360px"
              />
            </figure>
            <figure className="director-portrait director-portrait-secondary">
              <Image
                src="/leadership/neha-portrait-indoor.jpeg"
                alt="Neha Gokul at a leadership gathering"
                fill
                sizes="(max-width: 700px) 48vw, 230px"
              />
            </figure>
          </div>
          <article className="director-note">
            <Eyebrow>FROM THE EXECUTIVE DIRECTOR</Eyebrow>
            <span className="director-quote-mark" aria-hidden="true">“</span>
            <h2>A belief in what<br /><em>can be built.</em></h2>
            <div className="director-note-copy">
              <p>Every meaningful change begins with a belief — the belief that the world can be better than it is today.</p>
              <p>Valora Foundation was born from that belief. We envision an organisation that does not simply create opportunities, but challenges the limitations that prevent people from accessing them. An organisation where a young person’s potential is never defined by their circumstances, where leadership is nurtured through action, and where knowledge becomes the foundation for lasting change.</p>
              <p>Inspired by the spirit of growth, Valora represents more than a name. It represents a commitment to building people, transforming perspectives and creating possibilities that extend beyond generations.</p>
              <p>Our ambition goes beyond individual initiatives or momentary impact. We aspire to build platforms that bring people together, ideas that inspire action and opportunities that create measurable change in society.</p>
              <p>We do not believe in waiting for a better future. We believe in creating the people, platforms and possibilities that will shape it.</p>
              <p>Because the true measure of an organisation is not how far its name travels, but how deeply its impact reaches.</p>
              <p className="director-welcome">Welcome to Valora.</p>
            </div>
            <footer className="director-signature">
              <strong>Neha Gokul</strong>
              <span>Executive Director · Valora Foundation</span>
            </footer>
          </article>
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
