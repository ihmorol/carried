"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Bag } from "@phosphor-icons/react/dist/ssr";
import { LineCard } from "@/components/LineCard";
import { encodePayload } from "@/lib/line";
import { LINE_MAX, NAME_MAX } from "@/lib/site";
import { CartError, cartStore, makeCartItem } from "@/lib/commerce/cart";
import { getVariant, type Product } from "@/lib/commerce/catalog";
import { useShopCopy } from "@/lib/commerce/copy";
import { useCart, useShopSelection } from "@/lib/commerce/hooks";
import { selectionHref, type Personalization, type Selection } from "@/lib/commerce/personalization";
import { ProductPreview } from "./ProductPreview";
import { LinePicker } from "./LinePicker";
import { OrderingNote, ShopNav } from "./ShopCommon";
import { DownloadCard } from "./DownloadCard";

export function Personalizer({ product, initial, example }: { product: Product; initial: Personalization; example: Selection }) {
  const { c, text } = useShopCopy();
  const { selection, setSelection, saved } = useShopSelection(initial.selection, example, Boolean(initial.issue));
  const { persisted, ready } = useCart();
  const [variant, setVariant] = useState(getVariant(product, initial.variant ?? "")?.id ?? product.variants[0].id);
  const [qty, setQty] = useState(String(initial.qty ?? 1));
  const [editKey, setEditKey] = useState(initial.editKey);
  const [linkRecovered, setLinkRecovered] = useState(!initial.issue);
  const [status, setStatus] = useState<"saved" | "quantity" | "full" | "missing" | "invalid" | null>(null);
  function change(next: Selection) { setSelection(next); setStatus(null); setLinkRecovered(true); }
  function editText(field: "q" | "n", value: string) {
    const payload = { ...selection.payload, [field]: value };
    // Editing the authored text/signature creates a new accession; ink alone does not.
    change({ payload, sourceId: encodePayload(payload), isExample: selection.isExample });
  }
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (!linkRecovered) throw new CartError("invalid");
      const input = { ...selection, productSlug: product.slug, variant, qty: Number(qty) };
      cartStore.save(input, editKey);
      setEditKey(makeCartItem(input).key);
      setStatus("saved");
    } catch (error) { setStatus(error instanceof CartError ? error.code : "invalid"); }
  }
  const validText = Boolean(selection.payload.q.trim() && selection.payload.n.trim());
  return <div className="shop-shell page-content">
    <ShopNav selection={validText ? selection : initial.selection} back />
    <div className="shop-page-heading"><h1 className="page-title">{text(product.name)}</h1><p>{text(product.description)}</p></div>
    {initial.issue && <p className="shop-error" role="alert">{c("invalidLink")}</p>}
    <div className="shop-personalizer-grid">
      <div className="shop-personalizer-media">
        <ProductPreview product={product.slug} selection={selection} variant={variant} featured label={c("diagram")} />
        <section className="shop-artwork-note"><h2 className="section-title">{c("artwork")}</h2><p>{c("artworkBody")}</p><p>{c("placementHint")}</p></section>
      </div>
      <div className="shop-personalizer-controls panel">
        <LinePicker selection={selection} saved={saved} example={example} onChange={change} showCard={false} />
        <form onSubmit={save} className="shop-personalizer-form">
          <label className="shop-field"><span>{c("lineText")}</span><textarea className="field-input" value={selection.payload.q} onChange={event => editText("q", event.target.value)} maxLength={LINE_MAX} rows={3} required /></label>
          <label className="shop-field"><span>{c("signature")}</span><input className="field-input" value={selection.payload.n} onChange={event => editText("n", event.target.value)} maxLength={NAME_MAX} required /></label>
          <fieldset className="shop-fieldset"><legend>{c("placement")}</legend><div className="shop-placement-options">{product.variants.map(option => <label key={option.id} className={option.id === variant ? "is-selected" : ""}><input type="radio" name="placement" value={option.id} checked={variant === option.id} onChange={() => { setVariant(option.id); setStatus(null); }} />{text(option.name)}</label>)}</div></fieldset>
          <label className="shop-field shop-quantity-field"><span>{c("qty")}</span><input className="field-input" type="number" min={1} max={10} step={1} required inputMode="numeric" value={qty} onChange={event => { setQty(event.target.value); setStatus(null); }} aria-describedby="shop-qty-hint" /><small id="shop-qty-hint">{c("qtyHint")}</small></label>
          <p className="shop-note">{c("noPrice")}</p>
          <button type="submit" className="ui-button shop-save-button" disabled={!ready || !validText || !linkRecovered || status === "saved"}>{status === "saved" ? <Check size={19} aria-hidden /> : <Bag size={19} aria-hidden />}{c(initial.editKey ? "replace" : "save")}</button>
          {status === "saved" && <div className="shop-save-status" role="status"><p>{c(initial.editKey ? "replaced" : "saved")}</p><Link className="shop-text-link" href={selectionHref("/shop/cart", selection)}>{c("cart")}</Link></div>}
          {status && status !== "saved" && <p className="shop-error" role="alert">{c(status === "quantity" ? "quantityError" : status === "full" ? "fullError" : status === "missing" ? "missingError" : "invalidError")}</p>}
          {!persisted && <p className="shop-error" role="status">{c("memory")}</p>}
        </form>
        <div className="shop-personalizer-digital"><p className="shop-note">{c("digital")}</p>{validText && <DownloadCard selection={selection} />}</div>
      </div>
    </div>
    <section className="shop-full-artwork"><h2 className="section-title">{c("artwork")}</h2><LineCard payload={selection.payload} id={selection.sourceId} actions={false} className="shop-full-card" /></section>
    <OrderingNote />
  </div>;
}
