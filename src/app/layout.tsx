import { siteOrigin } from "@/lib/site-origin";
import type { Metadata } from "next";
import "./globals.css";
import "./public-polish.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Valora Foundation — Knowledge. Growth. Empathy.",
    template: "%s | Valora Foundation",
  },
  description:
    "A new foundation empowering individuals to learn, grow, lead with empathy and create meaningful community impact. Discover Valora MUN 2026.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
