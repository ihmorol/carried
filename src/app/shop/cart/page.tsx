import type { Metadata } from "next";
import { Header, Footer } from "@/components/Chrome";
import { CartView } from "@/components/shop/CartView";
import { parsePersonalization, type ShopQuery } from "@/lib/commerce/personalization";
import "../shop.css";

export const metadata: Metadata = { title: "Your cart · Carried", description: "Your device-local collection of personalized product concepts. No orders or charges. Download your digital cards for free.", robots: { index: false, follow: true } };
export default async function CartPage({ searchParams }: { searchParams: Promise<ShopQuery> }) {
  const initial = parsePersonalization(await searchParams);
  return <><Header /><main id="main-content" tabIndex={-1} className="shop-page"><CartView selection={initial.selection} /></main><Footer /></>;
}
