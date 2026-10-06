"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check, ArrowRight } from "lucide-react";
import { SculptureScene } from "./sculpture-scene";
import type { FoundationEvent } from "@/lib/models";
import { committeeLogos } from "@/data/committee-logos";
import { CommitteeMotif } from "./committee-motif";

export function CommitteeExplorer({ event, sceneUrl }: { event: FoundationEvent; sceneUrl?: string }) {
  const [active, setActive] = useState(0);
  const [days, setDays] = useState<number>();
  useEffect(() => {
    const tick = () => setDays(Math.max(0, Math.ceil((new Date(event.date).getTime() - Date.now()) / 86400000)));
    tick(); const timer = setInterval(tick, 60000); return () => clearInterval(timer);
  }, [event.date]);
  const committee = event.categories[active];
  const logo = committeeLogos[committee.id];
  return <section className="section committee-lab"><div className="container">
    <div className="section-heading"><div><div className="eyebrow"><span />VALORA MUN</div><h2>Choose your<br /><em>committee.</em></h2></div></div>
    <div className="committee-console"><div className="committee-selector" role="tablist" aria-label="Committees">{event.categories.map((c, i) => <button id={`committee-tab-${c.id}`} key={c.id} role="tab" aria-selected={i === active} aria-controls="committee-detail" tabIndex={i === active ? 0 : -1} onClick={() => setActive(i)} onKeyDown={e => { if (["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) { e.preventDefault(); const next = (active + (["ArrowDown", "ArrowRight"].includes(e.key) ? 1 : -1) + event.categories.length) % event.categories.length; setActive(next); document.getElementById(`committee-tab-${event.categories[next].id}`)?.focus(); } }}><span>0{i + 1}</span><Image src={committeeLogos[c.id]?.src??"/brand/crest.png"} alt="" width={38} height={38}/><strong>{c.name}</strong><ArrowUpRight size={19} /></button>)}</div>
    <div className="committee-detail" data-committee={committee.id} id="committee-detail" role="tabpanel" aria-labelledby={`committee-tab-${committee.id}`}><CommitteeMotif id={committee.id}/><div className="committee-visual"><div className="committee-scene">{sceneUrl ? <iframe src={sceneUrl} title="Interactive committee Spline scene" loading="lazy" /> : <SculptureScene variant="assembly" seed={active} controls={false} />}</div><div className="briefing-seal" key={committee.id} aria-hidden="true"><div className="briefing-seal-inner"><div className="briefing-seal-face"><Image src={logo?.src??"/brand/crest.png"} alt="" width={108} height={102}/></div><div className="briefing-seal-face briefing-seal-back"><span>{committee.name}</span></div></div></div></div><div className="committee-detail-copy"><span className="micro-label">COMMITTEE BRIEFING / 0{active+1}</span><h3>{committee.name}</h3><p>{committee.description}</p><div className="committee-chips"><span><Check size={14} /> Beginners welcome</span><span><Check size={14} /> Training included</span></div><Link href="/events/valora-mun/register" className="button button-gold">Register for MUN <ArrowUpRight size={18} /></Link><span className="committee-note">Rank your top {event.preferenceCount} choices at registration.</span></div></div></div>
    <div className="conference-strip"><span className="conference-count"><strong>{days ?? "—"}</strong> DAYS TO VALORA MUN</span><span>14 NOVEMBER 2026</span><Link href="/events/valora-mun">Conference details <ArrowRight size={18} /></Link></div>
  </div></section>;
}
