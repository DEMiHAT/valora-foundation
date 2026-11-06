"use client";

import { useState } from "react";
import { ArrowUpRight, Sprout, Heart, BookOpen } from "lucide-react";
import Link from "next/link";
import { SculptureScene, type SculptureVariant } from "./sculpture-scene";

const values = [
  { name: "Knowledge", text: "Understand the issues.", icon: BookOpen },
  { name: "Growth", text: "Build confidence. Grow through experience.", icon: Sprout },
  { name: "Empathy", text: "Listen to other perspectives.", icon: Heart },
];

export function OrbitalHero({ sceneUrl }: { sceneUrl?: string }) {
  const [active, setActive] = useState(0);
  const variants: SculptureVariant[] = ["orbit", "growth", "bloom"];
  const ValueIcon = values[active].icon;
  return (
    <section className="orbit-hero">
      <div className="orbit-grid-bg" aria-hidden="true" />
      <div className="container orbit-hero-grid">
        <div className="orbit-copy">
          <span className="live-label">KNOWLEDGE. GROWTH. EMPATHY.</span>
          <h1>Valora<br /><em>Foundation.</em></h1>
          <p>Learning and leadership opportunities for young people, guided by knowledge, growth and empathy.</p>
          <div className="hero-actions">
            <Link href="/about" className="button button-gold">About Valora <ArrowUpRight size={20} /></Link>
            <Link href="/contact" className="orbit-text-link">Work with us <ArrowUpRight size={17} /></Link>
          </div>
        </div>
        <div className="orbital-interaction">
          <div className="hero-scene-shell">
            <div className="hero-scene-aura" aria-hidden="true" />
            {sceneUrl && active === 0 ? <iframe src={sceneUrl} title="Interactive Valora Spline scene" className="spline-scene" loading="lazy" /> : <SculptureScene variant={variants[active]} className="hero-webgl-scene" />}
          </div>
          <div className="orbital-value" aria-live="polite"><ValueIcon size={23} /><div><strong>{values[active].name}</strong><span>{values[active].text}</span></div><span className="orbital-value-index">0{active+1} / 03</span></div>
          <div className="orbit-value-controls" aria-label="Explore Valora values">{values.map((v, i) => <button type="button" key={v.name} aria-pressed={active === i} onClick={() => setActive(i)}>{v.name}</button>)}</div>
        </div>
      </div>
      <div className="container orbit-bottom"><a href="#our-purpose">ABOUT THE FOUNDATION <span>↓</span></a></div>
    </section>
  );
}
