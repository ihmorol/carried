import Link from "next/link";
import type { CSSProperties } from "react";
import type { Book } from "@/lib/books";
import { accessionNo, isBengali, type LinePayload } from "@/lib/line";
import {
  EDITION_SHARED_COPY, EDITION_WEIGHTS, cardPresentation, editionCopy,
} from "@/lib/card-presentation";
import type { CardTemplateId } from "@/lib/card-templates";
import { editionCqw, layoutEditionArtwork, type EditionLayout, type EditionText } from "@/lib/text-layout";
import { INKS, type Ink } from "@/lib/inks";
import { SITE_NAME } from "@/lib/site";
import { UnderlineButton } from "./UnderlineButton";

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
  const text: EditionText = {
    quote: content.quote,
    name: content.name,
    book: content.title,
    author: content.author,
    date: content.date,
    accession: accessionNo(id),
    language: content.quoteScript,
    quoteScript: content.quoteScript,
    nameScript: content.nameScript,
    bookScript: content.titleScript,
    authorScript: content.authorScript,
    dateScript: content.dateScript,
  };
  const layout = layoutEditionArtwork(text, edition);
  const copy = editionCopy(edition, content.quoteScript);
  const shared = EDITION_SHARED_COPY;
  const lang = (script: "latin" | "bengali") => script === "bengali" ? "bn" : "en";
  const label = { fontWeight: EDITION_WEIGHTS.label } as const;
  // Re-press the mark when the stamped content changes; otherwise it stays inked.
  const stampKey = animateStamp ? `${text.quote}:${text.name}:${text.date}` : undefined;
  const quote = (
    <blockquote className="edition-quote" lang={lang(text.quoteScript)}>
      <p>{text.quote}</p>
    </blockquote>
  );
  const credit = (
    <div className="edition-book-credit">
      <p className="edition-reading-label">{shared.afterReading[text.language]}</p>
      <cite className="edition-book-title" lang={lang(text.bookScript)}>{text.book}</cite>
      <p className="edition-book-author" lang={lang(text.authorScript)}>{text.author}</p>
    </div>
  );
  const readerName = (
    <span className="edition-reader-name" lang={lang(text.nameScript)}>{text.name}</span>
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
          <svg className="edition-bookplate-frame" viewBox="0 0 360 450" aria-hidden="true" focusable="false">
            <path className="edition-frame-outer" d="M36 14H324V26H338V424H324V436H36V424H22V26H36Z" />
            <path className="edition-frame-inner" d="M42 21H318V33H331V417H318V429H42V417H29V33H42Z" />
            <path className="edition-frame-corners" d="M22 48H13V34M338 48H347V34M22 402H13V416M338 402H347V416" />
            <path className="edition-frame-diamonds" d="M180 10L184 14L180 18L176 14ZM180 432L184 436L180 440L176 436Z" />
          </svg>
          <header className="edition-bookplate-heading">
            <p className="edition-bookplate-wordmark" lang="en">{SITE_NAME}</p>
            <p className="edition-bookplate-caption">{copy}</p>
          </header>
          {quote}
          {credit}
          <div className="edition-bookplate-ownership">
            <div key={stampKey ?? 0} className="edition-stamp edition-oval-seal" data-stamped={stampKey ? "true" : undefined}>
              <span className="edition-reader-label" style={label}>{shared.carriedBy[text.language]}</span>
              {readerName}
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
          <div className="edition-poster-band" aria-hidden="true">
            <span className="edition-poster-quotation" lang="en">”</span>
          </div>
          <div key={stampKey ?? 0} className="edition-stamp edition-poster-stamp" data-stamped={stampKey ? "true" : undefined}>
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
                <circle className="edition-cancellation-outer" cx="66" cy="56" r="50" />
                <circle className="edition-cancellation-inner" cx="66" cy="56" r="45" />
                <path className="edition-cancellation-lines" d="M0 43H10M0 49H10M0 55H10M122 57H132M122 63H132M122 69H132" />
                <path className="edition-cancellation-ticks" d="M64 13H68M64 99H68" />
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
      {actions && (
        <div className="edition-actions">
          <UnderlineButton lineId={id} initialVotes={votes} onChange={onChange} />
          <span lang={lang(text.quoteScript)}>{votedLabel(text.quote, votes)}</span>
        </div>
      )}
    </div>
  );
}

type EditionStyle = CSSProperties & Record<`--edition-${string}`, string | number>;

/** Ink palette and fitted type as inline custom properties, exactly like the
 * approved board: the stylesheet owns composition, the content owns numbers. */
function editionStyle(ink: Ink, _edition: CardTemplateId, layout: EditionLayout): EditionStyle {
  return {
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
    "--edition-name-size": editionCqw(layout.name.fontSize),
    "--edition-name-leading": String(layout.nameLeading),
    "--edition-name-break": layout.nameBreaks ? "anywhere" : "auto",
    "--edition-book-size": editionCqw(layout.book.fontSize),
    "--edition-book-leading": String(layout.bookLeading),
    "--edition-author-size": editionCqw(layout.author.fontSize),
    "--edition-author-leading": String(layout.authorLeading),
  };
}

function votedLabel(q: string, votes: number): string {
  const bn = isBengali(q);
  if (votes === 0) return bn ? "এখনো আন্ডারলাইন নেই" : "not yet underlined";
  if (votes === 1) return bn ? "একবার আন্ডারলাইন" : "underlined once";
  return bn ? `আন্ডারলাইন ×${votes}` : `underlined ×${votes}`;
}
