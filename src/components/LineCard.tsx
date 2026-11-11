import Link from "next/link";
import { getBook } from "@/lib/books";
import { accessionNo, isBengali, formatStampDate, formatStampDateBn } from "@/lib/line";
import { resolveStyle } from "@/lib/card-style";
import { cssFamily } from "@/lib/card-fonts";
import type { LinePayload } from "@/lib/line";
import { StampMark } from "./StampMark";
import { UnderlineButton } from "./UnderlineButton";
import { CardArt } from "./CardArt";

/**
 * The catalog card, the artifact people share. Same design language as
 * the canvas export and the OG image: double rule, Fraunces italic line,
 * ledger metadata, the ownership stamp, and the underline vote.
 */
export function LineCard({
  payload,
  id,
  size = "sm",
  animateStamp = false,
  asLink = false,
  className = "",
  votes = 0,
  actions = true,
  onChange,
}: {
  payload: LinePayload;
  /** the id, slug or legacy encoded, used for the accession no + vote target */
  id: string;
  size?: "sm" | "lg";
  animateStamp?: boolean;
  asLink?: boolean;
  className?: string;
  /** initial underline count; the button keeps it live */
  votes?: number;
  /** the preview card in the composer hides the vote strip */
  actions?: boolean;
  /** fired after a vote lands, feeds use it to re-sort */
  onChange?: (lineId: string, votes: number, voted: boolean) => void;
}) {
  const { ink, pattern, font } = resolveStyle(payload);
  const book = getBook(payload.b);
  if (!book) return null;

  const s = size === "lg" ? 1.3 : 1;
  const len = payload.q.length;
  const bn = isBengali(payload.q);
  const quoteSize = (len > 170 ? 15 : len > 110 ? 17 : len > 60 ? 19 : 21) * s * (bn ? 1 : font.scale);
  const family = cssFamily(font);

  const head = (
    <div
      className="flex items-baseline justify-between font-mono font-semibold uppercase"
      style={{ fontSize: 9 * s, letterSpacing: "0.24em", color: ink.soft }}
    >
      <span style={{ color: ink.text }}>Carried</span>
      <span>No. {accessionNo(id)}</span>
    </div>
  );

  const quoteBlock = (
    <div className="relative flex-1 pt-3">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1 font-serif italic"
        style={{
          fontSize: 64 * s,
          lineHeight: 1,
          color: ink.rule,
          opacity: 0.65,
          left: -6 * s,
        }}
      >
        &ldquo;
      </span>
      <p
        className="relative"
        style={{
          fontFamily: bn ? "var(--font-serif)" : family,
          fontSize: quoteSize,
          lineHeight: bn ? 1.7 : font.leading,
          paddingTop: 14 * s,
          fontStyle: bn ? "normal" : font.quote.style,
          fontWeight: bn ? 500 : font.quote.weight,
          textWrap: "pretty",
        }}
      >
        {payload.q}
      </p>
    </div>
  );

  const provenance = (
    <div style={{ marginTop: 16 * s }}>
      <div style={{ borderTop: `1px solid ${ink.rule}`, paddingTop: 10 * s }}>
        <div
          className="font-mono font-semibold uppercase"
          style={{ fontSize: 8 * s, letterSpacing: "0.26em", color: ink.soft }}
        >
          Carried out of
        </div>
        <div
          style={{
            fontFamily: family,
            fontWeight: font.name.weight,
            fontStyle: font.name.style,
            fontSize: 15 * s * font.scale,
            lineHeight: 1.25,
            marginTop: 3 * s,
          }}
        >
          {book.title}
        </div>
        <div
          className="font-mono"
          style={{ fontSize: 9.5 * s, color: ink.soft, marginTop: 2 * s }}
        >
          {book.author} · {book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}
        </div>
      </div>
    </div>
  );

  const voteStrip = actions ? (
    <div
      className="flex items-center justify-between"
      style={{ borderTop: `1px solid ${ink.rule}`, marginTop: 12 * s, paddingTop: 8 * s }}
    >
      <UnderlineButton lineId={id} initialVotes={votes} onChange={onChange} />
      <span
        className="font-mono uppercase"
        style={{ fontSize: 8 * s, letterSpacing: "0.2em", color: ink.soft }}
      >
        {votedLabel(payload.q, votes)}
      </span>
    </div>
  ) : null;

  const stamp = (
    <div className="flex justify-center" style={{ marginTop: 14 * s }}>
      <StampMark
        name={payload.n}
        date={bn ? formatStampDateBn(payload.d) : formatStampDate(payload.d)}
        ink={ink}
        font={font}
        animate={animateStamp}
        scale={s * 0.92}
      />
    </div>
  );

  const inner = (
    <div className="relative flex flex-1 flex-col">
      {asLink ? (
        <Link
          href={`/l/${id}`}
          className="flex flex-1 flex-col"
          aria-label={`Line carried out of ${book.title} by ${payload.n}`}
        >
          {head}
          {quoteBlock}
          {provenance}
        </Link>
      ) : (
        <>
          {head}
          {quoteBlock}
          {provenance}
        </>
      )}
      {voteStrip}
      {stamp}
    </div>
  );

  const card = (
    <div
      className={`${pattern.frame ? "" : "card-rule"} relative flex h-full flex-col rounded-[4px]`}
      data-pattern={pattern.id}
      data-font={font.id}
      style={{
        backgroundColor: ink.bg,
        color: ink.text,
        borderColor: ink.rule,
        // The drop shadow is page dressing: the canvas export and the
        // OG image render the card edge to edge, no shadow, and that
        // is the artifact people download and share. Patterns that
        // draw their own frame drop the double rule.
        boxShadow: pattern.frame
          ? "0 1px 2px rgba(28,22,12,0.10), 0 18px 36px -18px rgba(28,22,12,0.28)"
          : `inset 0 0 0 4px ${ink.bg}, inset 0 0 0 5px ${ink.rule}b3, 0 1px 2px rgba(28,22,12,0.10), 0 18px 36px -18px rgba(28,22,12,0.28)`,
        padding: 22 * s,
      }}
    >
      {pattern.id !== "classic" && <CardArt pattern={pattern.id} ink={ink} />}
      {inner}
    </div>
  );

  return (
    <div
      className={`${className} ${
        asLink ? "lift block" : ""
      }`}
    >
      {card}
    </div>
  );
}

function votedLabel(q: string, votes: number): string {
  const bn = isBengali(q);
  if (votes === 0) return bn ? "এখনো আন্ডারলাইন নেই" : "not yet underlined";
  if (votes === 1) return bn ? "একবার আন্ডারলাইন" : "underlined once";
  return bn ? `আন্ডারলাইন ×${votes}` : `underlined ×${votes}`;
}
