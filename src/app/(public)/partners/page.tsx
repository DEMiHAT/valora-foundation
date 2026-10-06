import Link from "next/link";
import { ArrowUpRight, School, Building2, HeartHandshake } from "lucide-react";
import { PageHero, Eyebrow } from "@/components/public";
import { foundation } from "@/data/foundation";
export const metadata = { title: "Partners" };
export default function Partners() {
  return (
    <>
      <PageHero eyebrow="VALORA FOUNDATION" title="Partner with Valora." description="Contact us about school participation, sponsorship or support for Valora MUN." />
      <section className="section">
        <div className="container">
          <Eyebrow>PARTNERSHIP OPTIONS</Eyebrow>
          <h2>Support Valora MUN.</h2>
          <div className="principle-grid">
            {[
              {title: "Schools & institutions", icon: School, text: "Enquire about bringing your students to the conference."},
              {title: "Event supporters", icon: Building2, text: "Contribute resources, expertise or sponsorship."},
              {title: "Community collaborators", icon: HeartHandshake, text: "Discuss future learning and community programmes."},
            ].map(p => <div className="principle" key={p.title}><p.icon size={30} strokeWidth={1.3} /><h3>{p.title}</h3><p>{p.text}</p></div>)}
          </div>
          <Link className="button button-primary" href="/contact">Contact the team <ArrowUpRight size={17} /></Link>
        </div>
      </section>
      {foundation.partners.length > 0 && <section className="section initiatives-section"><div className="container"><Eyebrow>OUR PARTNERS</Eyebrow><h2>Supporting organisations</h2>{foundation.partners.map(p => <a href={p.url} key={p.name}>{p.name} · {p.role}</a>)}</div></section>}
    </>
  );
}
