import { Instagram, Mail, ArrowUpRight } from "lucide-react";
import { PageHero, Eyebrow, TextLink } from "@/components/public";
import { foundation } from "@/data/foundation";
export const metadata = { title: "Contact" };
export default function Contact() {
  const email = process.env.CONTACT_EMAIL;
  return (
    <>
      <PageHero
        eyebrow="VALORA FOUNDATION"
        title={
          <>
            Contact Valora.
          </>
        }
        description="Event questions, school participation and partnership enquiries."
      />
      <section className="section">
        <div className="container contact-grid">
          <div>
            <Eyebrow>CONTACT CHANNELS</Eyebrow>
            <h2>Reach the team.</h2>
            <a
              className="contact-channel"
              href={foundation.instagram}
              target="_blank"
              rel="noreferrer"
            >
              <Instagram />
              <span>
                <small>INSTAGRAM</small>@valora_foundation
              </span>
              <ArrowUpRight />
            </a>
            {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
              <a className="contact-channel" href={`mailto:${email}`}>
                <Mail />
                <span>
                  <small>EMAIL</small>
                  {email}
                </span>
                <ArrowUpRight />
              </a>
            )}
          </div>
          <div className="contact-note">
            <h3>
              Valora MUN questions
            </h3>
            <p>
              Find committees, fees and FAQs on the event page.
            </p>
            <TextLink href="/events/valora-mun">Visit the event page</TextLink>
            <p className="small-note">
              If you’ve registered, include your registration reference when
              contacting the team. Please don’t share payment receipts or
              personal details in public comments.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
