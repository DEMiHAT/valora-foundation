"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Layers,
  ScanLine,
  Settings2,
  FileInput,
  History,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
const nav = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Participants", href: "/admin/participants", icon: Users },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Allocations", href: "/admin/allocations", icon: Layers },
  { name: "Digital IDs", href: "/admin/ids", icon: ScanLine },
  { name: "Form imports", href: "/admin/imports", icon: FileInput },
  { name: "Event settings", href: "/admin/settings", icon: Settings2 },
  { name: "Activity & email", href: "/admin/activity", icon: History },
];
export function AdminShell({
  children,
  username,
}: {
  children: React.ReactNode;
  username: string;
}) {
  const path = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  async function logout() {
    try {
      const r = await fetch("/api/admin/logout", { method: "POST" });
      if (!r.ok) throw Error("Sign out failed. Please try again.");
      router.replace("/admin/login");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
        <Link href="/" className="brand admin-brand">
          <Image
            src="/brand/crest.png"
            width={45}
            height={43}
            alt="Valora crest"
          />
          <span>
            VALORA<small>FOUNDATION</small>
          </span>
        </Link>
        <span className="admin-nav-label">ORGANISER WORKSPACE</span>
        <nav aria-label="Organiser navigation">
          {nav.map((n) => (
            <Link
              href={n.href}
              key={n.href}
              onClick={() => setOpen(false)}
              className={path === n.href ? "selected" : ""}
            >
              <n.icon size={17} />
              {n.name}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/">
            View foundation website <ArrowUpRight size={15} />
          </Link>
          <span>{username}</span>
          <button onClick={logout}>
            <LogOut size={15} />
            Sign out
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <button
            className="admin-menu"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close organiser menu" : "Open organiser menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span>FOUNDATION / EVENT OPERATIONS</span>
          <Link href="/verify">
            <ScanLine size={16} /> Verify an E-ID
          </Link>
        </header>
        <main id="main" className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
