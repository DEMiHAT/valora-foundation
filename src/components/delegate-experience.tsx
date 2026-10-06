"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { ArrowUpRight, RotateCw, GraduationCap, Utensils, NotebookPen, Award } from "lucide-react";
import type { FoundationEvent } from "@/lib/models";

export function DelegateExperience({event, sceneUrl}: {event: FoundationEvent; sceneUrl?: string}) {
  const [flipped, setFlipped] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0), y = useMotionValue(0);
  const rotateX = useSpring(y, {stiffness: 90, damping: 18});
  const rotateY = useSpring(x, {stiffness: 90, damping: 18});
  const items = [
    {icon: GraduationCap, title: "Two training sessions", note: "General MUN + committee preparation"},
    {icon: NotebookPen, title: "Delegate kit", note: "Pen, notebook, file, placard and ID card"},
    {icon: Utensils, title: "Lunch & refreshments", note: "Lunch and two refreshment servings"},
    {icon: Award, title: "Participation certificate", note: "Included for delegates"},
  ];
  return <section className="section delegate-experience"><div className="container delegate-experience-grid">
    <div className="kit-stage" ref={stage} onPointerMove={e => {
      if (reduced || e.pointerType === "touch") return;
      const rect = stage.current?.getBoundingClientRect();
      if (rect) { x.set(((e.clientX-rect.left)/rect.width-.5)*24); y.set(-((e.clientY-rect.top)/rect.height-.5)*18); }
    }} onPointerLeave={() => {x.set(0); y.set(0);}}>
      <div className="kit-stage-ring" aria-hidden="true" />
      {sceneUrl ? <iframe src={sceneUrl} className="kit-spline" title="Interactive delegate kit Spline scene" loading="lazy" /> : <>
        <motion.div className="kit-pass-tilt" style={{rotateX,rotateY}}>
          <div className="kit-lanyard" aria-hidden="true" /><div className="kit-clip" aria-hidden="true" />
          <div className={`kit-pass ${flipped ? "is-flipped" : ""}`}>
            <div className="kit-pass-front" aria-hidden={flipped}>
              <span className="kit-pass-organisation">VALORA FOUNDATION</span>
              <Image src="/brand/crest.png" alt="" width={105} height={100} />
              <h3>VALORA<br /><em>MUN</em><sup>’26</sup></h3>
              <div className="kit-pass-date">14 NOVEMBER 2026</div>
              <div className="kit-pass-role">DELEGATE <span>↗</span></div>
            </div>
            <div className="kit-pass-back" aria-hidden={!flipped}>
              <span className="kit-pass-organisation">VALORA MUN 2026</span>
              <h3>Your kit.</h3>
              {event.includes.find(group => group.title === "Your delegate kit")?.items.map(item => <span key={item} className="kit-back-item">{item}</span>)}
              <span className="kit-back-footer">Included in your delegate fee</span>
            </div>
          </div>
        </motion.div>
        <button type="button" className="kit-flip-button" onClick={() => setFlipped(value => !value)} aria-pressed={flipped}><RotateCw size={15} />{flipped ? "Show delegate card" : "View the kit"}</button>
      </>}
    </div>
    <div className="kit-copy"><div className="eyebrow"><span />VALORA MUN 2026</div><h2>The delegate<br /><em>experience.</em></h2>
      <div className="kit-inclusions">{items.map(item => <div className="kit-inclusion" key={item.title}><item.icon size={21} strokeWidth={1.3} /><div><strong>{item.title}</strong><span>{item.note}</span></div></div>)}</div>
      <div className="kit-copy-footer"><span>₹{event.fee.toLocaleString("en-IN")} <small>/ delegate</small></span><Link href={`/events/${event.slug}/register`} className="text-link">Register <ArrowUpRight size={17} /></Link></div>
    </div>
  </div></section>;
}
