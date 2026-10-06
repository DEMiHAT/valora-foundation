"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
const links = [
  ["About", "/about"],
  ["Initiatives", "/initiatives"],
  ["Events", "/events"],
  ["Schools", "/events/valora-mun/delegation"],
  ["Partners", "/partners"],
  ["Media", "/media"],
  ["Contact", "/contact"],
];
export function Navigation() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const activeHref = links.filter(([, href]) => path.startsWith(href)).sort((a,b) => b[1].length-a[1].length)[0]?.[1];
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <>
      <div className="announcement-bar">
        <span>THE INAUGURAL VALORA MUN</span>
        <span className="announcement-date">14 NOVEMBER 2026</span>
        <Link href="/events/valora-mun">
          Conference details <ArrowUpRight size={13} />
        </Link>
      </div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Valora Foundation home">
          <Image
            src="/brand/crest.png"
            alt="Valora Foundation crest"
            width={52}
            height={50}
            priority
          />
          <span>
            VALORA<small>FOUNDATION</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([name, href]) => (
            <Link
              key={href}
              className={activeHref === href ? "active" : ""}
              aria-current={activeHref === href ? "page" : undefined}
              href={href}
            >
              {name}
            </Link>
          ))}
        </nav>
        <Link href="/events/valora-mun/register" className="header-cta">
          Register <ArrowUpRight size={16} />
        </Link>
        <button
          ref={toggle}
          className="mobile-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        {open && (
          <nav
            id="mobile-nav"
            className="mobile-nav"
            aria-label="Mobile navigation"
          >
            {links.map(([name, href]) => (
              <Link href={href} key={href} aria-current={activeHref === href ? "page" : undefined} onClick={() => setOpen(false)}>
                {name}
                <ArrowUpRight size={17} />
              </Link>
            ))}
            <Link href="/events/valora-mun/register">
              Register for Valora MUN
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
