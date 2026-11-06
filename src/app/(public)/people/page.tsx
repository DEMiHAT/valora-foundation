import Image from "next/image";
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
      <CTA />
    </>
  );
}
