import { LineCard } from "@/components/LineCard";
import type { ProductSlug } from "@/lib/commerce/catalog";
import type { Selection } from "@/lib/commerce/personalization";

/** Flat geometry describes a proposed placement, never a manufactured sample. */
export function ProductPreview({ product, selection, variant = "center", featured = false, compact = false, label }: {
  product: ProductSlug; selection: Selection; variant?: string; featured?: boolean; compact?: boolean; label: string;
}) {
  return <figure className={`shop-preview${featured ? " shop-preview-featured" : ""}${compact ? " shop-preview-compact" : ""}`}>
    <div className="shop-preview-stage">
      <div className={`shop-object-scene shop-scene-${product}`} aria-hidden="true">
        <div className={`shop-object shop-object-${product}${variant === "lower" ? " shop-placement-lower" : ""}`}>
          <div className="shop-artwork">
            <LineCard payload={selection.payload} id={selection.sourceId} actions={false} className="shop-rendered-card" />
          </div>
        </div>
      </div>
    </div>
    <figcaption>{label}</figcaption>
  </figure>;
}
