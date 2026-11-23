"use client";
import { useState } from "react";
import Image from "next/image";
import { Eyebrow } from "./public";
import { Modal } from "./modal";

type Founder = {
  key: string;
  name: string;
  role: string;
  photo: string;
  alt: string;
  heading: React.ReactNode;
  paragraphs: string[];
  closing: string;
  align: "left" | "right";
};

const founders: Founder[] = [
  {
    key: "neha",
    name: "Neha Gokul",
    role: "Founder & Executive Director",
    photo: "/leadership/neha-portrait-garden.jpeg",
    alt: "Neha Gokul, Founder and Executive Director of Valora Foundation",
    heading: <>A belief in what<br /><em>can be built.</em></>,
    paragraphs: [
      "Every meaningful change begins with a belief — the belief that the world can be better than it is today.",
      "Valora Foundation was born from that belief. We envision an organisation that does not simply create opportunities, but challenges the limitations that prevent people from accessing them. An organisation where a young person’s potential is never defined by their circumstances, where leadership is nurtured through action, and where knowledge becomes the foundation for lasting change.",
      "Inspired by the spirit of growth, Valora represents more than a name. It represents a commitment to building people, transforming perspectives and creating possibilities that extend beyond generations.",
      "Our ambition goes beyond individual initiatives or momentary impact. We aspire to build platforms that bring people together, ideas that inspire action and opportunities that create measurable change in society.",
      "We do not believe in waiting for a better future. We believe in creating the people, platforms and possibilities that will shape it.",
      "Because the true measure of an organisation is not how far its name travels, but how deeply its impact reaches.",
    ],
    closing: "Welcome to Valora.",
    align: "left",
  },
  {
    key: "sanjay",
    name: "Sanjay A R",
    role: "Founder & President",
    photo: "/leadership/sanjay-founder-portrait.jpeg",
    alt: "Sanjay A R, Founder and President of Valora Foundation",
    heading: <>Growth without<br /><em>limits.</em></>,
    paragraphs: [
      "As the Founder and President of Valora Foundation, my vision is to build an organisation driven by Knowledge, Growth and Empathy.",
      "Inspired by the Tamil word “Valar” (வளர்), meaning to grow, flourish and develop, Valora stands for creating equal access to opportunities and development, irrespective of geography or background. Our phoenix-inspired identity symbolises resilience, renewal and the courage to rise and rebuild.",
      "We aspire to empower youngsters with meaningful platforms, nurture leadership and create opportunities that translate into tangible social impact. Our purpose is not merely to create initiatives, but to create change that genuinely matters.",
      "We believe growth should never be limited by where someone comes from, but empowered by the opportunities they receive.",
    ],
    closing: "Valora Foundation — Knowledge. Growth. Empathy.",
    align: "right",
  },
];

function FounderTile({ founder: f, onOpen }: { founder: Founder; onOpen: (key: string) => void }) {
  return (
    <button
      type="button"
      className={`founder-tile founder-tile-${f.align}`}
      onClick={() => onOpen(f.key)}
      aria-haspopup="dialog"
    >
      <span className="founder-tile-photo">
        <Image src={f.photo} alt={f.alt} fill sizes="(max-width: 700px) 85vw, 400px" />
      </span>
      <span className="founder-tile-caption">
        <strong>{f.name}</strong>
        <span>{f.role}</span>
        <span className="founder-tile-cta">Read the message</span>
      </span>
    </button>
  );
}

export function FoundersSection() {
  const [open, setOpen] = useState<string | null>(null);
  const active = founders.find((f) => f.key === open) ?? null;
  return (
    <section className="section founders-section">
      <div className="container">
        <div className="founders-intro">
          <Eyebrow>FROM OUR FOUNDERS</Eyebrow>
          <h2>Two people.<br /><em>One belief.</em></h2>
        </div>
        <div className="founders-grid">
          <FounderTile founder={founders[0]} onOpen={setOpen} />
          <div className="founders-divider" aria-hidden="true">
            <span className="founders-divider-mark">வளர்</span>
            <span className="founders-divider-line" />
            <span className="founders-divider-word">VALORA</span>
          </div>
          <FounderTile founder={founders[1]} onOpen={setOpen} />
        </div>
      </div>
      {active && (
        <Modal title={`${active.name} · ${active.role}`} onClose={() => setOpen(null)}>
          <div className="founder-message-modal">
            <span className="founder-message-quote" aria-hidden="true">“</span>
            <h3>{active.heading}</h3>
            <div className="founder-message-copy">
              {active.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              <p className="founder-message-closing">{active.closing}</p>
            </div>
            <footer className="founder-message-signature">
              <strong>{active.name}</strong>
              <span>{active.role} · Valora Foundation</span>
            </footer>
          </div>
        </Modal>
      )}
    </section>
  );
}
