import {
  PageHero,
  InitiativeCards,
  CTA,
  Eyebrow,
  TextLink,
} from "@/components/public";
export const metadata = { title: "Initiatives" };
export default function Initiatives() {
  return (
    <>
      <PageHero
        eyebrow="OUR INITIATIVES"
        title={
          <>
            Our initiatives.
          </>
        }
        description="Learning, leadership and community programmes are in development."
      />
      <section className="section">
        <div className="container">
          <InitiativeCards />
        </div>
      </section>
      <section className="section initiatives-section">
        <div className="container purpose-grid" id="learning">
          <div>
            <Eyebrow>LEARNING & LEADERSHIP</Eyebrow>
            <h2>
              Learning &<br /><em>leadership.</em>
            </h2>
          </div>
          <div>
            <p>
              We’re developing practical learning opportunities that help young people build communication, confidence and leadership skills.
            </p>
            <TextLink href="/contact">
              Discuss a learning programme
            </TextLink>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container purpose-grid" id="community">
          <div>
            <Eyebrow>COMMUNITY & IMPACT</Eyebrow>
            <h2>
              Community programmes.
            </h2>
          </div>
          <div>
            <p>
              We’re developing community programmes for young people. Contact us if your organisation would like to collaborate.
            </p>
            <TextLink href="/contact">Discuss a collaboration</TextLink>
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
