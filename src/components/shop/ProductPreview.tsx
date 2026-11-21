import type { ReactNode } from "react";
import { LineCard } from "@/components/LineCard";
import { ArtworkFit } from "./ArtworkFit";
import type { ProductSlug } from "@/lib/commerce/catalog";
import type { Selection } from "@/lib/commerce/personalization";

/* Decorative furniture drawn beside the card proof: the sibling plates of a
   sticker sheet, a box for the set, the copies behind a pack. Kiss-cut hairlines
   and plain sheets only — the composition stays a flat placement proposal. */
const DECOR: Partial<Record<ProductSlug, ReactNode>> = {
  "bookplate-set": (
    <>
      <i className="shop-plate shop-plate-b" aria-hidden />
      <i className="shop-plate shop-plate-c" aria-hidden />
      <i className="shop-plate shop-plate-d" aria-hidden />
    </>
  ),
  "gift-set": (
    <>
      <i className="shop-box-lid" aria-hidden />
      <i className="shop-box-bookmark" aria-hidden />
      <i className="shop-box-base" aria-hidden />
    </>
  ),
  "club-pack": (
    <>
      <i className="shop-copy shop-copy-2" aria-hidden />
      <i className="shop-copy shop-copy-3" aria-hidden />
    </>
  ),
};

/** Flat geometry describes a proposed placement, never a manufactured sample.
 * The caption is optional: grid tiles sit beside their own product name, so
 * they omit it instead of repeating the concept disclaimer six times. */
export function ProductPreview({ product, selection, variant = "center", featured = false, compact = false, label }: {
  product: ProductSlug; selection: Selection; variant?: string; featured?: boolean; compact?: boolean; label?: string;
}) {
  return <figure className={`shop-preview${featured ? " shop-preview-featured" : ""}${compact ? " shop-preview-compact" : ""}`}>
    <div className="shop-preview-stage">
      <div className={`shop-object-scene shop-scene-${product}`} aria-hidden="true">
        <div className={`shop-object shop-object-${product}`} data-variant={variant}>
          {DECOR[product]}
          <div className="shop-artwork">
            <ArtworkFit><LineCard payload={selection.payload} id={selection.sourceId} actions={false} className="shop-rendered-card" /></ArtworkFit>
          </div>
        </div>
      </div>
    </div>
    {label !== undefined && <figcaption>{label}</figcaption>}
  </figure>;
}
