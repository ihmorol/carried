import Link from "next/link";
import type { CSSProperties } from "react";
import type { Book } from "@/lib/books";
import type { LinePayload } from "@/lib/line";
import {
  EDITION_SHARED_COPY, EDITION_WEIGHTS, cardPresentation, editionCopy, editionText,
} from "@/lib/card-presentation";
import type { CardTemplateId } from "@/lib/card-templates";
import { editionCqw, layoutEditionArtwork, type EditionLayout, type TextFit } from "@/lib/text-layout";
import { INKS, type Ink } from "@/lib/inks";
import { SITE_NAME } from "@/lib/site";
import { LineActions } from "./LineActions";

/** The three approved collectible editions, ported from the design board.
 * The artwork is a fixed 4:5 painted surface; the vote/actions row lives
 * OUTSIDE it in page tokens. LineCard keeps its prop API for Composer,
 * shop, shelf and feed callers. The legacy `size` hint remains accepted;
 * edition type is content-fitted, so it no longer selects a clamp. */
export function LineCard({
  payload, book, id, animateStamp = false, asLink = false,
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
  const content = cardPresentation(payload, book);
  if (!content) return null;
  const ink = INKS[payload.s];
  const edition = content.edition;
  const short = edition.replace(/-v\d+$/, "");
  const text = editionText(content, id);
  const layout = layoutEditionArtwork(text, edition);
  const copy = editionCopy(edition, content.quoteScript);
  const shared = EDITION_SHARED_COPY;
  const lang = (script: "latin" | "bengali") => script === "bengali" ? "bn" : "en";
  const label = { fontWeight: EDITION_WEIGHTS.label } as const;
  // Re-press the mark when the stamped content changes; otherwise it stays inked.
  const stampKey = animateStamp ? `${text.quote}:${text.name}:${text.date}` : undefined;
  const quote = (
    <blockquote className="edition-quote" lang={lang(text.quoteScript)}>
      <p><FittedText value={text.quote} fit={layout.quote} /></p>
    </blockquote>
  );
  const credit = (
    <div className="edition-book-credit">
      <p className="edition-reading-label">{shared.afterReading[text.language]}</p>
      <cite className="edition-book-title" lang={lang(text.bookScript)}><FittedText value={text.book} fit={layout.book} /></cite>
      <p className="edition-book-author" lang={lang(text.authorScript)}><FittedText value={text.author} fit={layout.author} /></p>
    </div>
  );
  const readerName = (
    <span className="edition-reader-name" lang={lang(text.nameScript)}><FittedText value={text.name} fit={layout.name} /></span>
  );
  const dateLine = (
    <p className="edition-date">
      <span>{shared.dated[text.language]}</span>{" "}
      <span lang={lang(text.dateScript)}>{text.date}</span>
    </p>
  );

  const body = (
    <>
      {edition === "bookplate-v1" && (
        <>
          {/* One hairline plate rule: the whole frame is a single line now. */}
          <svg className="edition-bookplate-frame" viewBox="0 0 360 450" aria-hidden="true" focusable="false">
            <rect className="edition-frame-rule" x="13.5" y="13.5" width="333" height="423" />
          </svg>
          <header className="edition-bookplate-heading">
            <p className="edition-bookplate-wordmark" lang="en">{SITE_NAME}</p>
            <p className="edition-bookplate-caption">{copy}</p>
          </header>
          {quote}
          {credit}
          <div className="edition-bookplate-ownership">
            <div key={stampKey ?? 0} className="edition-stamp edition-bookplate-mark" data-stamped={stampKey ? "true" : undefined}>
              <span className="edition-reader-label" style={label}>{shared.carriedBy[text.language]}</span>
              {readerName}
              <span className="edition-signature-rule" aria-hidden="true" />
              {dateLine}
            </div>
          </div>
          <p className="edition-accession edition-bookplate-accession" lang="en">{text.accession}</p>
        </>
      )}
      {edition === "poster-v1" && (
        <>
          <div className="edition-poster-field">
            <header className="edition-poster-heading">
              <p className="edition-poster-wordmark" lang="en">{SITE_NAME}</p>
              <p className="edition-accession" lang="en">{text.accession}</p>
            </header>
            {quote}
            {credit}
          </div>
          <div className="edition-poster-band" aria-hidden="true" />
          <div key={stampKey ?? 0} className="edition-stamp edition-poster-credit" data-stamped={stampKey ? "true" : undefined}>
            <span className="edition-reader-label" style={label}>{shared.carriedBy[text.language]}</span>
            {readerName}
            {dateLine}
          </div>
        </>
      )}
      {edition === "ticket-v1" && (
        <>
          <svg className="edition-ticket-stock" viewBox="0 0 360 450" aria-hidden="true" focusable="false">
            <path className="edition-ticket-paper" d="M12 0H348A12 12 0 0 0 360 12V320A13 13 0 0 0 360 346V438A12 12 0 0 0 348 450H12A12 12 0 0 0 0 438V346A13 13 0 0 0 0 320V12A12 12 0 0 0 12 0Z" />
            <path className="edition-ticket-stub-stock" d="M13 333H347A13 13 0 0 0 360 346V438A12 12 0 0 0 348 450H12A12 12 0 0 0 0 438V346A13 13 0 0 0 13 333Z" />
            <path className="edition-ticket-perforation" d="M19 333H341" />
            <path className="edition-ticket-edge" d="M18 7H342M353 18V312M7 18V312M18 443H342" />
          </svg>
          <div className="edition-ticket-body">
            <header className="edition-ticket-heading">
              <p className="edition-ticket-wordmark" lang="en">{SITE_NAME}</p>
              <p className="edition-accession" lang="en">{text.accession}</p>
            </header>
            <p className="edition-ticket-title">{copy}</p>
            {quote}
            <div className="edition-ticket-dateline">
              {dateLine}
              <span className="edition-ticket-language">{shared.languageName[text.language]}</span>
            </div>
          </div>
          <footer className="edition-ticket-stub">
            {credit}
            <div key={stampKey ?? 0} className="edition-stamp edition-ticket-cancellation" data-stamped={stampKey ? "true" : undefined}>
              <svg className="edition-cancellation-mark" viewBox="0 0 132 112" aria-hidden="true" focusable="false">
                <circle className="edition-cancellation-outer" cx="66" cy="56" r="64" />
              </svg>
              <span className="edition-reader-label" style={label}>{shared.carriedBy[text.language]}</span>
              {readerName}
            </div>
          </footer>
        </>
      )}
    </>
  );

  const artwork = (
    <article
      className={`edition-artwork edition-${short}`}
      style={editionStyle(ink, edition, layout)}
      lang={lang(text.language)}
      data-edition={short}
      data-ink={ink.id}
      data-density={layout.dense ? "dense" : undefined}
      aria-label={`${copy}: ${text.quote}`}
    >
      {body}
    </article>
  );

  return (
    <div className={className} style={{ minWidth: 0, containerType: "inline-size" }}>
      {asLink
        ? <Link href={`/l/${id}`} className="block" style={{ minWidth: 0 }}
            aria-label={`Line carried out of ${content.title} by ${content.name}`}>{artwork}</Link>
        : artwork}
      {actions && <>
        <LineActions lineId={id} initialVotes={votes} onChange={onChange} language={lang(text.quoteScript)} />
        <details className="edition-transcript" lang={lang(text.quoteScript)}>
          <summary>{text.language === "bengali" ? "লাইন ও বইয়ের পরিচয় পড়ো" : "Read the line and its details"}</summary>
          <blockquote>{text.quote}</blockquote>
          <p><cite lang={lang(text.bookScript)}>{text.book}</cite><br /><span lang={lang(text.authorScript)}>{text.author}</span></p>
          <p>{shared.carriedBy[text.language]} <strong lang={lang(text.nameScript)}>{text.name}</strong> · <span lang={lang(text.dateScript)}>{text.date}</span></p>
        </details>
      </>}
    </div>
  );
}

function FittedText({ value, fit }: { value: string; fit: TextFit }) {
  return (
    <>
      <span className="sr-only">{value}</span>
      <span className="edition-lines" aria-hidden="true">
        {fit.lines.map((line, index) => <span key={index} className="edition-line" style={{ height: editionCqw(fit.lineHeight) }}>{line.replace(/[\r\n\u2060]/gu, " ").trim()}</span>)}
      </span>
    </>
  );
}

type EditionStyle = CSSProperties & Record<`--edition-${string}`, string | number>;

/** Ink palette and fitted type as inline custom properties, exactly like the
 * approved board: the stylesheet owns composition, the content owns numbers. */
function editionStyle(ink: Ink, _edition: CardTemplateId, layout: EditionLayout): EditionStyle {
  return {
    color: _edition === "poster-v1" ? (ink.id === "midnight" ? ink.text : ink.bg) : ink.text,
    "--edition-bg": ink.bg,
    "--edition-text": ink.text,
    "--edition-soft": ink.soft,
    "--edition-rule": ink.rule,
    "--edition-coral": ink.stamp,
    "--edition-poster-bg": ink.id === "midnight" ? ink.bg : ink.text,
    "--edition-poster-text": ink.id === "midnight" ? ink.text : ink.bg,
    "--edition-quote-size": editionCqw(layout.quote.fontSize),
    "--edition-quote-leading": String(layout.quoteLeading),
    "--edition-quote-top": editionCqw(layout.quoteTop),
    "--edition-quote-inset": editionCqw(layout.quoteInset),
    "--edition-quote-height": editionCqw(layout.quoteHeight),
    "--edition-credit-top": editionCqw(layout.credit.top),
    "--edition-credit-inset": editionCqw(layout.credit.inset),
    "--edition-credit-width": editionCqw(layout.credit.width),
    "--edition-label-height": editionCqw(layout.credit.labelHeight),
    "--edition-credit-gap": editionCqw(layout.credit.gap),
    "--edition-metadata-size": editionCqw(layout.dense ? 8 : 11),
    "--edition-ownership-top": editionCqw(layout.ownership.top),
    "--edition-ownership-height": editionCqw(layout.ownership.height),
    "--edition-name-row": editionCqw(layout.ownership.nameHeight),
    "--edition-ticket-name-row": editionCqw(layout.name.height),
    "--edition-ownership-gap": editionCqw(layout.ownership.gap),
    "--edition-band-top": editionCqw(layout.bandTop),
    "--edition-name-size": editionCqw(layout.name.fontSize),
    "--edition-name-leading": String(layout.nameLeading),
    "--edition-name-break": layout.nameBreaks ? "anywhere" : "auto",
    "--edition-book-size": editionCqw(layout.book.fontSize),
    "--edition-book-leading": String(layout.bookLeading),
    "--edition-author-size": editionCqw(layout.author.fontSize),
    "--edition-author-leading": String(layout.authorLeading),
  };
}
