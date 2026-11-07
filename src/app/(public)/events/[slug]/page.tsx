import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { PageHero, Eyebrow } from "@/components/public";
import { repository } from "@/lib/repository";

export const dynamic = "force-dynamic";
export default async function Event({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const state = await repository().snapshot();
  const event = (state.managed_events ?? []).find((item) => item.slug === slug && item.status === "PUBLISHED");
  if (!event) notFound();
  return <><PageHero eyebrow={event.type.toUpperCase()} title={<>{event.title}</>} description={event.description} /><section className="section"><div className="container event-public-detail">
    <Eyebrow>EVENT DETAILS</Eyebrow><div><span><CalendarDays size={19} />{new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(event.date))}</span><span><MapPin size={19} />{event.venue}</span></div>
    {event.registration_url && <Link className="button button-primary" href={event.registration_url}>Register / learn more <ArrowUpRight size={17} /></Link>}
  </div></section></>;
}
