import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { CTA, Eyebrow, PageHero } from "@/components/public";

const advisoryBoard = [
  {
    name: "Mrs. Sahana Rajkumar",
    valoraRole: "Senior Advisor",
    affiliation: "Principal, Velammal Bodhi Campus, Thanjavur",
    image: "/people/sahana-rajkumar.jpeg",
    imageClass: "people-portrait-sahana",
  },
  {
    name: "Yajith Vihas Repakula",
    valoraRole: "Advisory Board Member",
    affiliation: "Director, VR Educational Group",
    image: "/people/yajith-vihas-repakula.jpeg",
    imageClass: "people-portrait-yajith",
  },
  {
    name: "Mr. Ashif",
    valoraRole: "Academic Mentor",
    affiliation: "Academic Co-ordinator, Velammal Bodhi Campus, Thanjavur",
    image: "/people/ashif.jpeg",
    imageClass: "people-portrait-ashif",
  },
] as const;

export const metadata = { title: "People" };

export default function People() {
  return (
    <>
      <PageHero
        eyebrow="THE PEOPLE OF VALORA"
        title={<>Guided by<br /><em>experience.</em></>}
        description="The educators and leaders who advise Valora Foundation as it creates meaningful opportunities for young people."
      />
      <section className="section people-section">
        <div className="container">
          <div className="people-intro">
            <div>
              <Eyebrow>ADVISORY BOARD</Eyebrow>
              <h2>Perspective that<br /><em>shapes our work.</em></h2>
            </div>
            <p>Our Advisory Board brings experience from education, institutional leadership and youth development to help Valora grow with clarity and purpose.</p>
          </div>
          <div className="people-grid">
            {advisoryBoard.map((person, index) => (
              <article className="person-card" key={person.name}>
                <div className="person-portrait">
                  <Image
                    className={person.imageClass}
                    src={person.image}
                    alt={`${person.name}, ${person.valoraRole} at Valora Foundation`}
                    fill
                    sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 31vw"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <span className="person-number">0{index + 1}</span>
                </div>
                <div className="person-details">
                  <span className="micro-label">ADVISORY BOARD</span>
                  <h3>{person.name}</h3>
                  <p className="person-role">{person.valoraRole} · Valora Foundation</p>
                  <p className="person-affiliation">{person.affiliation}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section partner-schools-section">
        <div className="container partner-school-layout">
          <div className="partner-school-intro">
            <Eyebrow>PARTNERING SCHOOLS</Eyebrow>
            <h2>Growing through<br /><em>collaboration.</em></h2>
            <p>We work with schools that share our commitment to meaningful learning, leadership and opportunity for young people.</p>
          </div>
          <a
            className="partner-school-card"
            href="https://www.springdaysinternational.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit Springdays International School"
          >
            <span className="micro-label">PARTNERING SCHOOL · VELLORE</span>
            <div className="partner-school-logo">
              <Image
                src="/partners/springdays-international.png"
                alt="Springdays International School"
                width={2481}
                height={746}
                sizes="(max-width: 700px) 80vw, 560px"
              />
            </div>
            <div className="partner-school-link">
              <span>Visit the school</span>
              <ArrowUpRight size={22} />
            </div>
          </a>
        </div>
      </section>
      <CTA />
    </>
  );
}
