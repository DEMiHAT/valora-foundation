import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero, SectionHeading } from "@/components/public";
import { foundation } from "@/data/foundation";
export const metadata = { title: "Media & announcements" };
export default function Media() {
  return (
    <>
      <PageHero
        eyebrow="MEDIA & ANNOUNCEMENTS"
        title={
          <>
            News & media.
          </>
        }
        description="Announcements and posts from Valora Foundation."
      />
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="VALORA FOUNDATION" title="Foundation posts" />
          <div className="media-grid">
            {foundation.media.map((item) => (
              <article className="media-card" key={item.id}>
                <Image
                  src={item.image}
                  width={720}
                  height={899}
                  alt={item.title}
                />
                <div>
                  <span className="micro-label">{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <a
                    href={foundation.instagram}
                    className="text-link"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Follow Valora <ArrowUpRight size={16} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section initiatives-section">
        <div className="container">
          <SectionHeading eyebrow="EVENT NEWS" title="Announcements" />
          {foundation.announcements.map((a) => (
            <Link className="news-row" href={a.href} key={a.id}>
              <span>{a.date}</span>
              <div>
                <h3>{a.title}</h3>
                <p>{a.description}</p>
              </div>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
