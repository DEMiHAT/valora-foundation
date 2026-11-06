import { siteOrigin } from "@/lib/site-origin";
import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return [
    "",
    "/about",
    "/initiatives",
    "/events",
    "/volunteer",
    "/people",
    "/media",
    "/contact",
  ].map((route) => ({
    url: new URL(route, origin).toString(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
