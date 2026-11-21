import type { Metadata } from "next";
import { Header, Footer } from "@/components/Chrome";
import { ShopExplorer } from "@/components/shop/ShopExplorer";
import { exampleSelection, parsePersonalization, type ShopQuery } from "@/lib/commerce/personalization";
import "./shop.css";

export const metadata: Metadata = { title: "The reading room shop · Carried", description: "Personalize six planned print products with your Carried card. Ordering is not open; digital cards are free." };
export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopQuery> }) {
  const query = await searchParams;
  return <><Header /><main id="main-content" tabIndex={-1} className="shop-page"><ShopExplorer key={JSON.stringify(query)} initial={parsePersonalization(query)} example={exampleSelection()} /></main><Footer /></>;
}
