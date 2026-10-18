import type { MetadataRoute } from "next";
import { services } from "./data/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://willyfab.com";
  const publicRoutes = ["", "/about", "/services", "/projects", "/gallery", "/contact", "/privacy"];
  const entries: MetadataRoute.Sitemap = publicRoutes.map((route) => ({
    url: new URL(route, baseUrl).toString(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));

  for (const service of services) {
    entries.push({
      url: new URL(`/services/${service.slug}`, baseUrl).toString(),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
