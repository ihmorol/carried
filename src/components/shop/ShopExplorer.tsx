"use client";
import Link from "next/link";
import { useState } from "react";
import { SquaresFour } from "@phosphor-icons/react/dist/ssr";
import { CATALOG, type ProductSlug } from "@/lib/commerce/catalog";
import { useShopCopy } from "@/lib/commerce/copy";
import { useShopSelection } from "@/lib/commerce/hooks";
import { selectionHref, type Personalization, type Selection } from "@/lib/commerce/personalization";
import { ProductPreview } from "./ProductPreview";
import { LinePicker } from "./LinePicker";
import { ConceptArrow, FORMAT_ICONS, OrderingNote, ShopNav } from "./ShopCommon";
import { DownloadCard } from "./DownloadCard";

export function ShopExplorer({ initial, example }: { initial: Personalization; example: Selection }) {
  const { c, text } = useShopCopy();
  const { selection, setSelection, saved } = useShopSelection(initial.selection, example, Boolean(initial.issue));
  const [category, setCategory] = useState<ProductSlug | "all">("all");
  const products = category === "all" ? CATALOG : CATALOG.filter(product => product.category === category);
  return <div className="shop-shell page-content">
    <ShopNav selection={selection} />
    <div className="shop-page-heading"><h1 className="page-title">{c("shop")}</h1><p>{c("introBody")}</p></div>
    {initial.issue && <p className="shop-error shop-link-error" role="alert">{c("invalidLink")}</p>}
    <div className="shop-dashboard">
      <aside className="shop-sidebar panel" aria-label={c("selected")}>
        <LinePicker selection={selection} saved={saved} example={example} onChange={setSelection} />
        <div className="shop-sidebar-download"><p className="shop-note">{c("digital")}</p><DownloadCard selection={selection} /></div>
      </aside>
      <div className="shop-main-column">
        <section className="shop-feature">
          <ProductPreview product="art-print" selection={selection} featured label={c("diagram")} />
          <div className="shop-feature-copy">
            <h2>{c("featured")}</h2>
            <p>{c("featureBody")}</p>
            <Link href={selectionHref("/shop/art-print", selection)} className="ui-button">{c("personalize")}<ConceptArrow /></Link>
            <p className="shop-note">{c("noPrice")}</p>
          </div>
        </section>
        <nav className="shop-category-strip" aria-label={c("formats")}>
          <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}><SquaresFour size={22} aria-hidden />{c("all")}</button>
          {CATALOG.map(product => { const Icon = FORMAT_ICONS[product.slug]; return <button type="button" key={product.slug} aria-pressed={category === product.slug} onClick={() => setCategory(product.slug)}><Icon size={22} aria-hidden />{text(product.name)}</button>; })}
        </nav>
        <section className="shop-product-section" aria-label={c("formats")}>
          <div className="shop-section-heading"><h2 className="section-title">{c("formats")}</h2><p className="shop-note">{c("concept")}</p></div>
          <div className="shop-product-grid">
            {products.map(product => <article key={product.slug} className="shop-product-tile">
              <Link href={selectionHref(`/shop/${product.slug}`, selection)} className="shop-product-media-link" aria-label={`${c("explore")} · ${text(product.name)}`}>
                <ProductPreview product={product.slug} selection={selection} />
              </Link>
              <div className="shop-product-details"><Link href={selectionHref(`/shop/${product.slug}`, selection)}><h3>{text(product.name)}</h3><ConceptArrow /></Link><p>{text(product.description)}</p></div>
            </article>)}
          </div>
        </section>
        <OrderingNote />
      </div>
    </div>
  </div>;
}
