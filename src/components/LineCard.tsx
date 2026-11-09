import Link from "next/link";
import type { Book } from "@/lib/books";
import { accessionNo, isBengali } from "@/lib/line";
import { cardFontFamily, cardPresentation } from "@/lib/card-presentation";
import { INKS } from "@/lib/inks";
import type { LinePayload } from "@/lib/line";
import { StampMark } from "./StampMark";
import { UnderlineButton } from "./UnderlineButton";

/** The canonical artifact is server-rendered. Native browser wrapping lets
 * small cards grow rather than clipping valid text or hiding it behind a stamp. */
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
  const s = size === "lg" ? 1.3 : 1;
  const bn = content.quoteScript === "bengali";
  const quoteSize = (payload.q.length > 170 ? 16 : payload.q.length > 110 ? 18 : payload.q.length > 60 ? 20 : 22) * s;
  const wrapping = { overflowWrap: "anywhere" as const, minWidth: 0 };
  const body = (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono font-semibold uppercase"
        style={{ fontSize: 9 * s, letterSpacing: "0.24em", color: ink.soft }}>
        <span style={{ color: ink.text }}>Carried</span>
        <span>No. {accessionNo(id)}</span>
      </div>
      <div className="relative flex-1" style={{ paddingTop: 28 * s, paddingBottom: 16 * s, minWidth: 0 }}>
        {!bn && <span aria-hidden="true" className="pointer-events-none absolute -top-1 font-serif italic"
          style={{ fontSize: 64 * s, lineHeight: 1, color: ink.rule, left: -6 * s }}>“</span>}
        <p lang={bn ? "bn" : "en"} className="relative font-serif"
          style={{ ...wrapping, fontFamily: cardFontFamily(content.quoteScript, "serif", "dom"),
            fontSize: quoteSize, lineHeight: bn ? 1.7 : 1.5, fontStyle: bn ? "normal" : "italic", whiteSpace: "pre-wrap" }}>
          {content.quote}
        </p>
      </div>
      <div style={{ borderTop: `1px solid ${ink.rule}`, paddingTop: 10 * s, marginTop: 12 * s, minWidth: 0 }}>
        <div className="font-mono font-semibold uppercase"
          style={{ fontSize: 8 * s, letterSpacing: "0.26em", color: ink.soft }}>Carried out of</div>
        <div lang={content.titleScript === "bengali" ? "bn" : "en"} className="font-serif font-semibold"
          style={{ ...wrapping, fontFamily: cardFontFamily(content.titleScript, "serif", "dom"),
            fontSize: 15 * s, lineHeight: content.titleScript === "bengali" ? 1.65 : 1.35, marginTop: 3 * s }}>
          {content.title}
        </div>
        <div lang={content.authorScript === "bengali" ? "bn" : "en"} className="font-mono"
          style={{ ...wrapping, fontFamily: cardFontFamily(content.authorScript, "mono", "dom"),
            fontSize: 10 * s, lineHeight: 1.65, color: ink.soft, marginTop: 2 * s }}>
          {content.byline}
        </div>
      </div>
    </>
  );

  return (
    <div className={className} style={{ minWidth: 0 }}>
      <div className="card-rule relative flex h-full flex-col rounded-[4px]"
        style={{ backgroundColor: ink.bg, color: ink.text, borderColor: ink.rule, minWidth: 0,
          boxShadow: `inset 0 0 0 4px ${ink.bg}, inset 0 0 0 5px ${ink.rule}, 0 2px 5px rgba(28,22,12,0.10), 0 12px 24px -18px rgba(28,22,12,0.22)`,
          padding: 22 * s }}>
        {asLink ? <Link href={`/l/${id}`} className="flex flex-1 flex-col" style={{ minWidth: 0 }}
          aria-label={`Line carried out of ${content.title} by ${content.name}`}>{body}</Link> : body}
        {actions && <div className="flex flex-wrap items-center justify-between gap-2"
          style={{ borderTop: `1px solid ${ink.rule}`, marginTop: 12 * s, paddingTop: 8 * s }}>
          <UnderlineButton lineId={id} initialVotes={votes} onChange={onChange} ink={ink} />
          <span className="font-mono" lang={bn ? "bn" : "en"}
            style={{ fontFamily: cardFontFamily(content.quoteScript, "mono", "dom"), fontSize: 8 * s,
              letterSpacing: bn ? 0 : "0.16em", color: ink.soft }}>
            {votedLabel(payload.q, votes)}
          </span>
        </div>}
        <div className="flex justify-center" style={{ marginTop: 20 * s, marginBottom: 8 * s, minWidth: 0 }}>
          <StampMark name={content.name} date={content.date} ink={ink} animate={animateStamp} scale={s * 0.92} />
        </div>
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
