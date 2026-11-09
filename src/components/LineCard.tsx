import Link from "next/link";
import type { Book } from "@/lib/books";
import { accessionNo, isBengali } from "@/lib/line";
import { CARD_SPACING, CARD_TYPOGRAPHY, CARD_WEIGHTS, cardFontFamily, cardLeading, cardPresentation } from "@/lib/card-presentation";
import { INKS } from "@/lib/inks";
import type { LinePayload } from "@/lib/line";
import { StampMark } from "./StampMark";
import { UnderlineButton } from "./UnderlineButton";

/** Native wrapping gives the DOM intrinsic height. No fixed quote region or
 * stretched flex child can separate a short line from its provenance. */
export function LineCard({
  payload, book, id, size = "sm", animateStamp = false, asLink = false,
  className = "", votes = 0, actions = true, onChange,
}: {
  payload: LinePayload;
  book?: Book;
  id: string;
  size?: "sm" | "lg";
  animateStamp?: boolean;
  asLink?: boolean;
  className?: string;
  votes?: number;
  actions?: boolean;
  onChange?: (lineId: string, votes: number, voted: boolean) => void;
}) {
  const ink = INKS[payload.s];
  const content = cardPresentation(payload, book);
  if (!content) return null;
  const bn = content.quoteScript === "bengali";
  const wrapping = { overflowWrap: "anywhere" as const, minWidth: 0 };
  const body = (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2"
        style={{ fontSize: CARD_TYPOGRAPHY.metadata, lineHeight: cardLeading("latin"), fontWeight: CARD_WEIGHTS.metadata, color: ink.soft }}>
        <span style={{ color: ink.text }}>Carried</span>
        <span>No. {accessionNo(id)}</span>
      </div>
      <p lang={bn ? "bn" : "en"}
        style={{ ...wrapping, fontFamily: cardFontFamily(content.quoteScript, "serif", "dom"),
          fontSize: `clamp(${CARD_TYPOGRAPHY.quoteMin}px, ${size === "lg" ? "6.1cqw" : "5.6cqw"}, ${CARD_TYPOGRAPHY.quoteMax}px)`,
          fontWeight: CARD_WEIGHTS.quote, lineHeight: cardLeading(content.quoteScript), whiteSpace: "pre-wrap",
          marginTop: CARD_SPACING.headerGap }}>
        {content.quote}
      </p>
      <div style={{ marginTop: CARD_SPACING.quoteGap, minWidth: 0 }}>
        <div style={{ fontSize: CARD_TYPOGRAPHY.metadata, lineHeight: cardLeading("latin"), fontWeight: CARD_WEIGHTS.metadata, color: ink.soft }}>Carried out of</div>
        <div lang={content.titleScript === "bengali" ? "bn" : "en"}
          style={{ ...wrapping, fontFamily: cardFontFamily(content.titleScript, "serif", "dom"), fontWeight: CARD_WEIGHTS.title,
            fontSize: CARD_TYPOGRAPHY.title, lineHeight: cardLeading(content.titleScript), marginTop: CARD_SPACING.provenanceGap }}>
          {content.title}
        </div>
        <div lang={content.authorScript === "bengali" ? "bn" : "en"}
          style={{ ...wrapping, fontFamily: cardFontFamily(content.authorScript, "mono", "dom"), fontWeight: CARD_WEIGHTS.byline,
            fontSize: CARD_TYPOGRAPHY.metadata, lineHeight: cardLeading(content.authorScript), color: ink.soft, marginTop: CARD_SPACING.bylineGap }}>
          {content.byline}
        </div>
      </div>
    </>
  );

  return (
    <div className={className} style={{ minWidth: 0, containerType: "inline-size" }}>
      <div className="card-rule relative rounded-xl"
        style={{ backgroundColor: ink.bg, color: ink.text, borderColor: ink.rule, minWidth: 0,
          fontFamily: cardFontFamily("latin", "mono", "dom"),
          boxShadow: `inset 0 0 0 4px ${ink.bg}, inset 0 0 0 5px ${ink.rule}`,
          padding: CARD_SPACING.padding }}>
        {asLink ? <Link href={`/l/${id}`} className="block" style={{ minWidth: 0 }}
          aria-label={`Line carried out of ${content.title} by ${content.name}`}>{body}</Link> : body}
        <div style={{ marginTop: CARD_SPACING.signatureGap, minWidth: 0 }}>
          <StampMark name={content.name} date={content.date} ink={ink} animate={animateStamp} />
        </div>
        {actions && <div className="flex flex-wrap items-center justify-between gap-2"
          style={{ borderTop: `1px solid ${ink.rule}`, marginTop: 12, paddingTop: 8 }}>
          <UnderlineButton lineId={id} initialVotes={votes} onChange={onChange} ink={ink} />
          <span lang={bn ? "bn" : "en"}
            style={{ fontFamily: cardFontFamily(content.quoteScript, "mono", "dom"), fontSize: CARD_TYPOGRAPHY.metadata,
              lineHeight: cardLeading(content.quoteScript), color: ink.soft }}>
            {votedLabel(payload.q, votes)}
          </span>
        </div>}
      </div>
    </div>
  );
}

function votedLabel(q: string, votes: number): string {
  const bn = isBengali(q);
  if (votes === 0) return bn ? "এখনো আন্ডারলাইন নেই" : "not yet underlined";
  if (votes === 1) return bn ? "একবার আন্ডারলাইন" : "underlined once";
  return bn ? `আন্ডারলাইন ×${votes}` : `underlined ×${votes}`;
}
