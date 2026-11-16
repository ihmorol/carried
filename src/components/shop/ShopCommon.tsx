"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bag, FrameCorners, BookmarkSimple, Tote, Notebook, Coffee } from "@phosphor-icons/react/dist/ssr";
import { useCart } from "@/lib/commerce/hooks";
import { useShopCopy } from "@/lib/commerce/copy";
import type { ProductSlug } from "@/lib/commerce/catalog";
import { selectionHref, type Selection } from "@/lib/commerce/personalization";

export const FORMAT_ICONS = { "art-print": FrameCorners, bookmark: BookmarkSimple, tote: Tote, notebook: Notebook, mug: Coffee } satisfies Record<ProductSlug, typeof FrameCorners>;
export function ShopNav({ selection, back = false }: { selection: Selection | null; back?: boolean }) {
  const { c, locale } = useShopCopy(); const { items } = useCart();
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  return <nav className="shop-nav" aria-label={c("shop")}>
    <Link href={selectionHref("/shop", selection)} className="shop-nav-home">
      {back ? <ArrowLeft size={18} aria-hidden /> : <FrameCorners size={18} aria-hidden />}{c(back ? "back" : "browse")}
    </Link>
    <Link href={selectionHref("/shop/cart", selection)} className="ui-button ui-button-secondary shop-cart-link">
      <Bag size={19} aria-hidden />{c("cart")} <span className="shop-cart-count">{count.toLocaleString(locale)}</span>
    </Link>
  </nav>;
}
export function OrderingNote() {
  const { c } = useShopCopy();
  return <section className="shop-ordering" aria-label={c("closed")}>
    <h2 className="section-title">{c("closed")}</h2>
    <p>{c("closedBody")}</p>
    <p className="shop-digital-note">{c("digital")}</p>
  </section>;
}
export function ConceptArrow() { return <ArrowRight size={20} aria-hidden />; }
