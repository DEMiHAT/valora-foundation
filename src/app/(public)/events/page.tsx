import { PageHero, SectionHeading, EventCard, CTA } from "@/components/public";
import { events } from "@/data/events";
export const metadata = { title: "Events" };
export default function Events() {
  return (
    <>
      <PageHero
        eyebrow="VALORA FOUNDATION"
        title={
          <>
            Events.
          </>
        }
        description="Our inaugural Model United Nations conference takes place on 14 November 2026."
      />
      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="UPCOMING" title="Valora MUN 2026" />
          {events.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </div>
      </section>
      <CTA />
    </>
  );
}
