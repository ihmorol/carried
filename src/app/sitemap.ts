import type { MetadataRoute } from "next";
import { BOOKS } from "@/lib/books";
import { SEED_LINES } from "@/lib/seeds";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...BOOKS.map((b) => ({
      url: `${SITE_URL}/b/${b.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...SEED_LINES.map((l) => ({
      url: `${SITE_URL}/l/${l.id}`,
      lastModified: new Date(l.d),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
