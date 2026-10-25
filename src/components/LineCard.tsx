import Link from "next/link";
import { getBook } from "@/lib/books";
import { accessionNo } from "@/lib/line";
import { INKS } from "@/lib/inks";
import type { LinePayload } from "@/lib/line";
import { StampMark } from "./StampMark";

/**
 * The catalog card — the artifact people share. Same design language as
 * the canvas export and the OG image: double rule, Fraunces italic line,
 * ledger metadata, the ownership stamp.
 */
export function LineCard({
  payload,
  id,
  size = "sm",
  animateStamp = false,
  asLink = false,
  className = "",
}: {
  payload: LinePayload;
  /** the encoded id, for the accession number */
  id: string;
  size?: "sm" | "lg";
  animateStamp?: boolean;
  asLink?: boolean;
  className?: string;
}) {
  const ink = INKS[payload.s];
  const book = getBook(payload.b);
  if (!book) return null;

  const s = size === "lg" ? 1.3 : 1;
  const len = payload.q.length;
  const quoteSize = (len > 170 ? 15 : len > 110 ? 17 : len > 60 ? 19 : 21) * s;

  const body = (
    <div
      className="card-rule relative flex flex-col h-full rounded-[4px]"
      style={{
        backgroundColor: ink.bg,
        color: ink.text,
        borderColor: ink.rule,
        boxShadow: `inset 0 0 0 4px ${ink.bg}, inset 0 0 0 5px ${ink.rule}b3, 0 8px 24px rgba(28,22,12,0.10)`,
        padding: 22 * s,
      }}
    >
      {/* ledger head */}
      <div
        className="flex items-baseline justify-between font-mono font-semibold uppercase"
        style={{ fontSize: 9 * s, letterSpacing: "0.24em", color: ink.soft }}
      >
        <span style={{ color: ink.text }}>Carried</span>
        <span>No. {accessionNo(id)}</span>
      </div>

      {/* the line */}
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
          className="relative font-serif italic"
          style={{
            fontSize: quoteSize,
            lineHeight: 1.5,
            paddingTop: 14 * s,
            textWrap: "pretty",
          }}
        >
          {payload.q}
        </p>
      </div>

      {/* provenance */}
      <div style={{ marginTop: 16 * s }}>
        <div style={{ borderTop: `1px solid ${ink.rule}`, paddingTop: 10 * s }}>
          <div
            className="font-mono font-semibold uppercase"
            style={{ fontSize: 8 * s, letterSpacing: "0.26em", color: ink.soft }}
          >
            Carried out of
          </div>
          <div
            className="font-serif font-semibold"
            style={{ fontSize: 15 * s, lineHeight: 1.25, marginTop: 3 * s }}
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

      {/* the stamp */}
      <div
        className="flex justify-center"
        style={{ marginTop: 18 * s }}
      >
        <StampMark name={payload.n} date={payload.d} ink={ink} animate={animateStamp} scale={s * 0.92} />
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link
        href={`/l/${id}`}
        className={`group block transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 ${className}`}
        aria-label={`Line carried out of ${book.title} by ${payload.n}`}
      >
        {body}
      </Link>
    );
  }
  return body;
}
