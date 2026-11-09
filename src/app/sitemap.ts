import type { MetadataRoute } from "next";
import { BOOKS } from "@/lib/books";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...BOOKS.map((book) => ({ url: `${SITE_URL}/b/${book.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${SITE_URL}/shop`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
