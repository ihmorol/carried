"use client";
import Link from "next/link";
import { useState } from "react";
import { Bag, Minus, Plus, Trash, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { CartError, cartStore, type CartItem } from "@/lib/commerce/cart";
import { getProduct, getVariant } from "@/lib/commerce/catalog";
import { useShopCopy } from "@/lib/commerce/copy";
import { useCart } from "@/lib/commerce/hooks";
import { selectionHref, type Selection } from "@/lib/commerce/personalization";
import { ProductPreview } from "./ProductPreview";
import { OrderingNote, ShopNav } from "./ShopCommon";
import { DownloadCard } from "./DownloadCard";

function CartRow({ item, onStatus }: { item: CartItem; onStatus: (status: "removed" | "quantitySaved" | "quantityError" | "missingError") => void }) {
  const { c, text, locale } = useShopCopy();
  const product = getProduct(item.productSlug)!;
  function setQuantity(qty: number) {
    try { cartStore.setQuantity(item.key, qty); onStatus("quantitySaved"); }
    catch (error) { onStatus(error instanceof CartError && error.code === "missing" ? "missingError" : "quantityError"); }
  }
  return <article className="shop-cart-row">
    <ProductPreview product={product.slug} selection={item} variant={item.variant} compact label={c("diagram")} />
    <div className="shop-cart-item-main">
      <h2>{text(product.name)}</h2>
      <p className="shop-source-label">{c(item.isExample ? "example" : "own")}</p>
      <blockquote>{item.payload.q}</blockquote>
      <p className="shop-cart-attribution">{item.payload.n} · {c(item.payload.s)} · {text(getVariant(product, item.variant)!.name)}</p>
      <p className="shop-note">{c("noPrice")}</p>
      <div className="shop-cart-item-actions">
        <Link className="shop-text-link" href={selectionHref(`/shop/${product.slug}`, item, { variant: item.variant, edit: item.key, qty: item.qty })}><PencilSimple size={18} aria-hidden />{c("edit")}</Link>
        <button className="shop-text-button" type="button" onClick={() => { cartStore.remove(item.key); onStatus("removed"); }}><Trash size={18} aria-hidden />{c("remove")}</button>
      </div>
      <DownloadCard selection={item} />
    </div>
    <div className="shop-cart-quantity"><span>{c("qty")}</span><div className="shop-quantity-stepper"><button type="button" aria-label={c("fewer")} disabled={item.qty <= 1} onClick={() => setQuantity(item.qty - 1)}><Minus size={17} aria-hidden /></button><output aria-label={c("qty")}>{item.qty.toLocaleString(locale)}</output><button type="button" aria-label={c("more")} disabled={item.qty >= 10} onClick={() => setQuantity(item.qty + 1)}><Plus size={17} aria-hidden /></button></div></div>
  </article>;
}
export function CartView({ selection }: { selection: Selection | null }) {
  const { c } = useShopCopy(); const { items, persisted, issue, ready } = useCart();
  const [status, setStatus] = useState<"removed" | "quantitySaved" | "quantityError" | "missingError" | null>(null);
  return <div className="shop-shell page-content">
    <ShopNav selection={selection ?? items[0] ?? null} back />
    <div className="shop-page-heading"><h1 className="page-title">{c("cart")}</h1><p>{c("cartBody")}</p></div>
    {!persisted && <p className="shop-error" role="status">{c("memory")}</p>}
    {issue && <p className="shop-error" role="alert">{c("corrupt")}</p>}
    <div className="shop-cart-layout">
      <div>
        {!ready ? <p className="shop-note" role="status">{c("loadingCart")}</p> : items.length ? <section className="shop-cart-items" aria-label={c("local")}>
          {items.map(item => <CartRow key={item.key} item={item} onStatus={setStatus} />)}
        </section> : <section className="shop-cart-empty"><Bag size={44} weight="light" aria-hidden /><h2>{c("empty")}</h2><p>{c("emptyBody")}</p><Link className="ui-button" href={selectionHref("/shop", selection)}>{c("browse")}</Link></section>}
        <p className={`shop-cart-status${status === "quantityError" || status === "missingError" ? " shop-error" : ""}`} role="status" aria-live="polite">{status ? c(status) : ""}</p>
      </div>
      <aside className="shop-cart-summary panel"><OrderingNote /><Link className="ui-button ui-button-secondary" href={selectionHref("/shop", selection ?? items[0] ?? null)}>{c("browse")}</Link></aside>
    </div>
  </div>;
}
