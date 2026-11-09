import { CARD_SPACING, CARD_TYPOGRAPHY, CARD_WEIGHTS, cardFontFamily, cardLeading, cardScript } from "@/lib/card-presentation";
import { formatStampDate } from "@/lib/line";
import type { Ink } from "@/lib/inks";

/** Quiet horizontal ownership mark. Keep the legacy animate/scale props,
 * but never reintroduce rotation or shrink metadata below readable size.
 * Dates are selected by cardPresentation; ISO input supports older callers. */
export function StampMark({ name, date, ink, scale = 1 }: {
  name: string; date: string; ink: Ink; animate?: boolean; scale?: number;
}) {
  const nameScript = cardScript(name);
  const stampDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? formatStampDate(date) : date;
  const dateScript = cardScript(stampDate);
  const s = Math.max(1, scale);
  return (
    <div className="grid items-center rounded-md border"
      style={{ color: ink.stamp, borderColor: ink.stamp, borderWidth: 1, width: "100%", minWidth: 0,
        gridTemplateColumns: "minmax(0, 1.38fr) minmax(0, 1fr)", gap: CARD_SPACING.signatureColumnGap * s,
        padding: `${CARD_SPACING.signaturePaddingY * s}px ${CARD_SPACING.signaturePaddingX * s}px` }}
      aria-label={`Carried by ${name}, ${stampDate}`}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: cardFontFamily("latin", "mono", "dom"), fontWeight: CARD_WEIGHTS.metadata,
          fontSize: CARD_TYPOGRAPHY.metadata * s, lineHeight: cardLeading("latin") }}>Carried by</div>
        <div lang={nameScript === "bengali" ? "bn" : "en"}
          style={{ fontFamily: cardFontFamily(nameScript, "serif", "dom"), fontWeight: CARD_WEIGHTS.name,
            fontSize: CARD_TYPOGRAPHY.name * s, lineHeight: cardLeading(nameScript), marginTop: CARD_SPACING.signatureNameGap * s,
            minWidth: 0, overflowWrap: "anywhere" }}>
          {name}
        </div>
      </div>
      <div lang={dateScript === "bengali" ? "bn" : "en"}
        style={{ fontFamily: cardFontFamily(dateScript, "mono", "dom"), fontWeight: CARD_WEIGHTS.date,
          fontSize: CARD_TYPOGRAPHY.metadata * s, lineHeight: cardLeading(dateScript), textAlign: "right",
          minWidth: 0, overflowWrap: "anywhere" }}>
        {stampDate}
      </div>
    </div>
  );
}
