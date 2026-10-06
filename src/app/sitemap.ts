import { siteOrigin } from "@/lib/site-origin";
import type { MetadataRoute } from "next";
import { events } from "@/data/events";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return [
    "",
    "/about",
    "/initiatives",
    "/events",
    "/partners",
    "/media",
    "/contact",
    ...events.map((e) => "/events/" + e.slug),
    ...events.map((e) => "/events/" + e.slug + "/delegation"),
  ].map((route) => ({
    url: new URL(route, origin).toString(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
