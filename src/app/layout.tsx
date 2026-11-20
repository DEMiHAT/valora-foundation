import { siteOrigin } from "@/lib/site-origin";
import type { Metadata } from "next";
import "./globals.css";
import "./public-polish.css";
import "./refine.css";
import { Instrument_Sans, Newsreader } from "next/font/google";

const display = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const text = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Valora Foundation — Knowledge. Growth. Empathy.",
    template: "%s | Valora Foundation",
  },
  description:
    "A foundation helping young people learn, grow, lead with empathy and create meaningful community impact.",
  icons: {
    icon: [{ url: "/brand/crest.png", type: "image/png" }],
    shortcut: "/brand/crest.png",
    apple: "/brand/crest.png",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${text.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
