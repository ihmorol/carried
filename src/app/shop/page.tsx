import type { Metadata } from "next";
import { Header, Footer } from "@/components/Chrome";
import { ShopExplorer } from "@/components/shop/ShopExplorer";
import { SEED_LINES } from "@/lib/seeds";
import { parsePersonalization, type ShopQuery } from "@/lib/commerce/personalization";
import "./shop.css";

export const metadata: Metadata = { title: "The reading room shop · Carried", description: "Personalize five physical product concepts with your Carried card. Ordering is not open; digital cards are free." };
export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopQuery> }) {
  const query = await searchParams;
  const seed = SEED_LINES.find(line => line.b === "the-alchemist") ?? SEED_LINES[0];
  return <><Header /><main id="main-content" tabIndex={-1} className="shop-page"><ShopExplorer key={JSON.stringify(query)} initial={parsePersonalization(query)} example={{ payload: seed, sourceId: seed.id, isExample: true }} /></main><Footer /></>;
}
