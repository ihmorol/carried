import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { Personalizer } from "@/components/shop/Personalizer";
import { getProduct } from "@/lib/commerce/catalog";
import { exampleSelection, parsePersonalization, type ShopQuery } from "@/lib/commerce/personalization";
import "../shop.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return product ? { title: `${product.name.en} concept · Carried`, description: product.description.en } : { title: "Concept not found · Carried" };
}
export default async function ProductPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<ShopQuery> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const product = getProduct(slug);
  if (!product) notFound();
  const initial = parsePersonalization(query);
  return <><Header /><main id="main-content" tabIndex={-1} className="shop-page"><Personalizer key={`${slug}:${JSON.stringify(query)}`} product={product} initial={initial} example={exampleSelection()} /></main><Footer /></>;
}
