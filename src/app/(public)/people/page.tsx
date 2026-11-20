import Image from "next/image";
import { ArrowUpRight, Download } from "lucide-react";
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
    name: "Mrs. Geetha Sundar",
    valoraRole: "Senior Advisor",
    affiliation: "Principal, Advaita International School, Tiruppur",
    image: "/people/geetha-sundar.jpeg",
    imageClass: "people-portrait-geetha",
  },
  {
    name: "Mr. Yajith Vihas Repakula",
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
  {
    name: "Ra. Shhiva",
    valoraRole: "Honorary Advisor",
    affiliation: "Attorney at Law",
    image: "/people/ra-shhiva.jpeg",
    imageClass: "people-portrait-shhiva",
  },
  {
    name: "Mrs. R. Ananthi",
    valoraRole: "Senior Advisor",
    affiliation: "Principal, Amrita Vidyalayam, Thanjavur",
    image: "/people/r-ananthi.jpeg",
    imageClass: "people-portrait-ananthi",
  },
  {
    name: "Mrs. V. Nancy Caroline",
    valoraRole: "Senior Advisor",
    affiliation: "Principal, Loyola Tech School, Dindugal",
    image: "/people/v-nancy-caroline.jpeg",
    imageClass: "people-portrait-nancy",
  },
  {
    name: "Adv. S. Unni Krishnan",
    valoraRole: "Honorary Advisor",
    affiliation: "Advocate, Retd. Addl. Superintendent of Police (TPS), Chairman - Travancore Educational & Charitable Trust, Kerala",
    image: "/people/s-unni-krishnan.jpeg",
    imageClass: "people-portrait-unni",
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
                    sizes="(max-width: 700px) 90vw, 45vw"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
                <div className="person-details">
                  <h3>{person.name}</h3>
                  <p className="person-role">{person.valoraRole}</p>
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
          <div className="partner-school-stack">
          <a
            className="partner-school-card"
            href="https://springdaysschool.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit Springdays School"
          >
            <span className="micro-label">PARTNERING SCHOOL · VELLORE</span>
            <div className="partner-school-logo">
              <Image
                src="/partners/springdays-school.png"
                alt="Springdays School (CBSE)"
                width={200}
                height={57}
                sizes="(max-width: 700px) 80vw, 560px"
              />
            </div>
            <div className="partner-school-link">
              <span>Visit the school</span>
              <ArrowUpRight size={22} />
            </div>
          </a>
          <a
            className="partner-school-download"
            href="/documents/valora-mun-hosting-proposal.pdf"
            download="Valora-MUN-Hosting-Proposal.pdf"
            aria-label="Download the Valora MUN hosting proposal (PDF)"
          >
            <div>
              <span className="micro-label">FOR SCHOOLS · HOST VALORA MUN</span>
              <strong>Valora MUN Hosting Proposal</strong>
              <p>Interested in hosting a Valora MUN conference at your school? Download our proposal letter for the details.</p>
            </div>
            <span className="partner-school-download-icon"><Download size={22} /></span>
          </a>
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
