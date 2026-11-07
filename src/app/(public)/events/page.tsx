import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { PageHero, Eyebrow } from "@/components/public";
import { repository } from "@/lib/repository";
export const metadata = { title: "Events" };
export const dynamic = "force-dynamic";
export default async function Events() {
  const state = await repository().snapshot();
  const events = (state.managed_events ?? []).filter((event) => event.status === "PUBLISHED").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return (
    <>
      <PageHero eyebrow="VALORA FOUNDATION" title={<>Events.</>} description="Updates on upcoming Valora Foundation events will be shared here." />
      <section className="section"><div className="container">
        {events.length === 0 ? <div className="public-empty-state"><Eyebrow>UPCOMING EVENTS</Eyebrow><h2>No events for now.</h2><p>New programmes and gatherings will be announced here.</p></div> : <div className="managed-event-grid">
          {events.map((event) => <article className="managed-event-card" key={event.event_id}>
            <span className="micro-label">{event.type.toUpperCase()}</span><h2>{event.title}</h2><p>{event.description}</p>
            <div><span><CalendarDays size={16} />{new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(new Date(event.date))}</span><span><MapPin size={16} />{event.venue}</span></div>
            <Link className="text-link" href={`/events/${event.slug}`}>Event details <ArrowUpRight size={17} /></Link>
          </article>)}
        </div>}
      </div></section>
    </>
  );
}
