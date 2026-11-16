import { LineCard } from "@/components/LineCard";
import { ArtworkFit } from "./ArtworkFit";
import type { ProductSlug } from "@/lib/commerce/catalog";
import type { Selection } from "@/lib/commerce/personalization";

/** Flat geometry describes a proposed placement, never a manufactured sample.
 * The caption is optional: grid tiles sit beside their own product name, so
 * they omit it instead of repeating the concept disclaimer six times. */
export function ProductPreview({ product, selection, variant = "center", featured = false, compact = false, label }: {
  product: ProductSlug; selection: Selection; variant?: string; featured?: boolean; compact?: boolean; label?: string;
}) {
  return <figure className={`shop-preview${featured ? " shop-preview-featured" : ""}${compact ? " shop-preview-compact" : ""}`}>
    <div className="shop-preview-stage">
      <div className={`shop-object-scene shop-scene-${product}`} aria-hidden="true">
        <div className={`shop-object shop-object-${product}${variant === "lower" ? " shop-placement-lower" : ""}`}>
          <div className="shop-artwork">
            <ArtworkFit><LineCard payload={selection.payload} id={selection.sourceId} actions={false} className="shop-rendered-card" /></ArtworkFit>
          </div>
        </div>
      </div>
    </div>
    {label !== undefined && <figcaption>{label}</figcaption>}
  </figure>;
}
