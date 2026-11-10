import type { CSSProperties } from "react";
import { INKS } from "@/lib/inks";
import { estimateTextWidth, fitText } from "@/lib/text-layout";
import type { EditionId, EditionProps, PreviewLanguage, PreviewLine } from "./types";
import "./editions.css";

const LABELS = {
  en: {
    bookplate: "A reader’s bookplate",
    poster: "A line, made yours",
    ticket: "Reader’s ticket",
    afterReading: "After reading",
    carriedBy: "Carried by",
    dated: "Dated",
    language: "English",
  },
  bn: {
    bookplate: "পাঠকের স্মারক",
    poster: "নিজের করে রাখা কথা",
    ticket: "পাঠকের টিকিট",
    afterReading: "বইটি পড়ে",
    carriedBy: "সঙ্গে রেখেছেন",
    dated: "তারিখ",
    language: "বাংলা",
  },
} satisfies Record<PreviewLanguage, Record<string, string>>;

type FitRegion = { width: number; height: number; size: number; min: number };
type EditionStyle = CSSProperties & Record<`--edition-${string}`, string | number>;

// Print-space pixels at 360 × 450. Floors scale with the artwork, not the viewport.
const TYPE_REGIONS: Record<EditionId, Record<"quote" | "name" | "book" | "author", FitRegion>> = {
  bookplate: {
    quote: { width: 288, height: 200, size: 36, min: 14 },
    name: { width: 166, height: 42, size: 23, min: 9 },
    book: { width: 288, height: 28, size: 14, min: 9 },
    author: { width: 288, height: 28, size: 11, min: 9 },
  },
  poster: {
    quote: { width: 304, height: 197, size: 44, min: 14 },
    name: { width: 164, height: 42, size: 25, min: 9 },
    book: { width: 304, height: 28, size: 15, min: 9 },
    author: { width: 304, height: 28, size: 11, min: 9 },
  },
  ticket: {
    quote: { width: 300, height: 196, size: 34, min: 14 },
    name: { width: 96, height: 54, size: 21, min: 9 },
    book: { width: 159, height: 40, size: 14, min: 9 },
    author: { width: 159, height: 40, size: 11, min: 9 },
  },
};

function languageOf(text: string, fallback: PreviewLanguage): PreviewLanguage {
  if (/[\u0980-\u09ff]/u.test(text)) return "bn";
  return /[a-z]/iu.test(text) ? "en" : fallback;
}

function leading(language: PreviewLanguage, edition: EditionId, role: "quote" | "name" | "metadata") {
  if (language === "bn") return role === "name" ? 1.5 : role === "quote" ? 1.45 : 1.4;
  if (role === "quote") return edition === "poster" ? 1.12 : 1.27;
  return role === "name" ? 1.15 : 1.35;
}

function fittedText(text: string, region: FitRegion, lineHeight: number, breakAnywhere = false) {
  const normalized = text.replace(/\s+/gu, " ");
  // The emergency layout permits grapheme-safe breaks instead of unreadable type.
  // Join words for measuring that wrapping policy only; never rewrite rendered text.
  const measured = breakAnywhere ? normalized.replace(/ /gu, "\u2060") : normalized;
  return fitText(measured, {
    width: region.width,
    height: region.height,
    maxFontSize: region.size,
    minFontSize: region.min,
    leading: lineHeight,
    measure: (value, size) => estimateTextWidth(breakAnywhere ? value.replace(/\u2060/gu, " ") : value, size),
  });
}

function containerSize(pixels: number): string {
  return `${(pixels / 3.6).toFixed(6)}cqw`;
}

function typesetting(content: PreviewLine, edition: EditionId): { style: EditionStyle; dense: boolean } {
  const regions = TYPE_REGIONS[edition];
  const quoteLeading = leading(languageOf(content.quote, content.language), edition, "quote");
  const nameLeading = leading(languageOf(content.name, content.language), edition, "name");
  const bookLeading = leading(languageOf(content.book, content.language), edition, "metadata");
  const authorLeading = leading(languageOf(content.author, content.language), edition, "metadata");
  let book = fittedText(content.book, regions.book, bookLeading);
  let author = fittedText(content.author, regions.author, authorLeading);
  let nameRegion = regions.name;
  let quoteTop = edition === "bookplate" ? 74 : edition === "poster" ? 70 : 95;
  let quoteInset = (360 - regions.quote.width) / 2;
  const creditHeight = 12.35 + 3 + book.height + author.height;
  let quoteHeight = edition === "ticket" ? regions.quote.height : (edition === "bookplate" ? 330 : 326) - creditHeight - 6 - quoteTop;
  let dense = false;
  let quote;
  try {
    quote = fittedText(content.quote, { ...regions.quote, height: quoteHeight }, quoteLeading);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    dense = true;
    quoteTop = edition === "bookplate" ? 46 : edition === "poster" ? 44 : 40;
    quoteInset = edition === "bookplate" ? 22 : 16;
    quoteHeight = 264;
    quote = fittedText(content.quote, { ...regions.quote, width: 360 - quoteInset * 2, height: quoteHeight }, quoteLeading, true);
    if (edition !== "ticket") {
      const creditWidth = edition === "bookplate" ? 316 : 304;
      const labelWidth = estimateTextWidth(LABELS[content.language].afterReading, 9);
      book = fittedText(content.book, { width: creditWidth - labelWidth - 4, height: 28, size: 9, min: 9 }, bookLeading, true);
      author = fittedText(content.author, { width: creditWidth, height: 28, size: 9, min: 9 }, authorLeading, true);
      nameRegion = { ...nameRegion, height: 28, size: 18 };
    }
  }
  let name;
  let nameBreaks = false;
  try {
    name = fittedText(content.name, nameRegion, nameLeading);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    nameBreaks = true;
    name = fittedText(content.name, nameRegion, nameLeading, true);
  }
  return {
    dense,
    style: {
      "--edition-quote-size": containerSize(quote.fontSize),
      "--edition-quote-leading": quoteLeading,
      "--edition-quote-top": containerSize(quoteTop),
      "--edition-quote-inset": containerSize(quoteInset),
      "--edition-quote-height": containerSize(quoteHeight),
      "--edition-name-size": containerSize(name.fontSize),
      "--edition-name-leading": nameLeading,
      "--edition-name-break": nameBreaks ? "anywhere" : "auto",
      "--edition-book-size": containerSize(book.fontSize),
      "--edition-book-leading": bookLeading,
      "--edition-author-size": containerSize(author.fontSize),
      "--edition-author-leading": authorLeading,
    },
  };
}

function Quote({ content }: { content: PreviewLine }) {
  return (
    <blockquote className="edition-quote" lang={languageOf(content.quote, content.language)}>
      <p>{content.quote}</p>
    </blockquote>
  );
}

function BookCredit({ content }: { content: PreviewLine }) {
  return (
    <div className="edition-book-credit">
      <p className="edition-reading-label">{LABELS[content.language].afterReading}</p>
      <cite className="edition-book-title" lang={languageOf(content.book, content.language)}>
        {content.book}
      </cite>
      <p className="edition-book-author" lang={languageOf(content.author, content.language)}>
        {content.author}
      </p>
    </div>
  );
}

function ReaderName({ content }: { content: PreviewLine }) {
  return (
    <span className="edition-reader-name" lang={languageOf(content.name, content.language)}>
      {content.name}
    </span>
  );
}

function DateLine({ content }: { content: PreviewLine }) {
  return (
    <p className="edition-date">
      <span>{LABELS[content.language].dated}</span>{" "}
      <span lang={languageOf(content.date, content.language)}>{content.date}</span>
    </p>
  );
}

function BookplateFrame() {
  return (
    <svg className="edition-bookplate-frame" viewBox="0 0 360 450" aria-hidden="true" focusable="false">
      <rect className="edition-frame-rule" x="13.5" y="13.5" width="333" height="423" />
    </svg>
  );
}

function Bookplate({ content, stampKey }: Pick<EditionProps, "content" | "stampKey">) {
  const labels = LABELS[content.language];
  return (
    <>
      <BookplateFrame />
      <header className="edition-bookplate-heading">
        <p className="edition-bookplate-wordmark" lang="en">Carried</p>
        <p className="edition-bookplate-caption">{labels.bookplate}</p>
      </header>
      <Quote content={content} />
      <BookCredit content={content} />
      <div className="edition-bookplate-ownership">
        <div key={stampKey ?? 0} className="edition-stamp edition-bookplate-mark" data-stamped={stampKey ? "true" : undefined}>
          <span className="edition-reader-label">{labels.carriedBy}</span>
          <ReaderName content={content} />
          <span className="edition-signature-rule" aria-hidden="true" />
          <DateLine content={content} />
        </div>
      </div>
      <p className="edition-accession edition-bookplate-accession" lang="en">{content.accession}</p>
    </>
  );
}

function Poster({ content, stampKey }: Pick<EditionProps, "content" | "stampKey">) {
  return (
    <>
      <div className="edition-poster-field">
        <header className="edition-poster-heading">
          <p className="edition-poster-wordmark" lang="en">Carried</p>
          <p className="edition-accession" lang="en">{content.accession}</p>
        </header>
        <Quote content={content} />
        <BookCredit content={content} />
      </div>
      <div className="edition-poster-band" aria-hidden="true" />
      <div key={stampKey ?? 0} className="edition-stamp edition-poster-credit" data-stamped={stampKey ? "true" : undefined}>
        <span className="edition-reader-label">{LABELS[content.language].carriedBy}</span>
        <ReaderName content={content} />
        <DateLine content={content} />
      </div>
    </>
  );
}

function TicketStock() {
  return (
    <svg className="edition-ticket-stock" viewBox="0 0 360 450" aria-hidden="true" focusable="false">
      <path className="edition-ticket-paper" d="M12 0H348A12 12 0 0 0 360 12V320A13 13 0 0 0 360 346V438A12 12 0 0 0 348 450H12A12 12 0 0 0 0 438V346A13 13 0 0 0 0 320V12A12 12 0 0 0 12 0Z" />
      <path className="edition-ticket-stub-stock" d="M13 333H347A13 13 0 0 0 360 346V438A12 12 0 0 0 348 450H12A12 12 0 0 0 0 438V346A13 13 0 0 0 13 333Z" />
      <path className="edition-ticket-perforation" d="M19 333H341" />
      <path className="edition-ticket-edge" d="M18 7H342M353 18V312M7 18V312M18 443H342" />
    </svg>
  );
}

function CancellationMark() {
  return (
    <svg className="edition-cancellation-mark" viewBox="0 0 132 112" aria-hidden="true" focusable="false">
      <circle className="edition-cancellation-outer" cx="66" cy="56" r="50" />
    </svg>
  );
}

function Ticket({ content, stampKey }: Pick<EditionProps, "content" | "stampKey">) {
  const labels = LABELS[content.language];
  return (
    <>
      <TicketStock />
      <div className="edition-ticket-body">
        <header className="edition-ticket-heading">
          <p className="edition-ticket-wordmark" lang="en">Carried</p>
          <p className="edition-accession" lang="en">{content.accession}</p>
        </header>
        <p className="edition-ticket-title">{labels.ticket}</p>
        <Quote content={content} />
        <div className="edition-ticket-dateline">
          <DateLine content={content} />
          <span className="edition-ticket-language">{labels.language}</span>
        </div>
      </div>
      <footer className="edition-ticket-stub">
        <BookCredit content={content} />
        <div key={stampKey ?? 0} className="edition-stamp edition-ticket-cancellation" data-stamped={stampKey ? "true" : undefined}>
          <CancellationMark />
          <span className="edition-reader-label">{labels.carriedBy}</span>
          <ReaderName content={content} />
        </div>
      </footer>
    </>
  );
}

/** Visual exploration only. No production renderer, persistence, or export side effects. */
export function EditionCard({ edition, content, ink, className, stampKey }: EditionProps) {
  const palette = INKS[ink];
  const typography = typesetting(content, edition);
  const style: EditionStyle = {
    "--edition-bg": palette.bg,
    "--edition-text": palette.text,
    "--edition-soft": palette.soft,
    "--edition-rule": palette.rule,
    "--edition-coral": palette.stamp,
    "--edition-poster-bg": ink === "midnight" ? palette.bg : palette.text,
    "--edition-poster-text": ink === "midnight" ? palette.text : palette.bg,
    ...typography.style,
  };

  return (
    <div
      className={["edition-card", className].filter(Boolean).join(" ")}
      style={style}
      lang={content.language}
      data-edition={edition}
      data-ink={ink}
      data-density={typography.dense ? "dense" : undefined}
    >
      <article className={`edition-artwork edition-${edition}`} aria-label={LABELS[content.language][edition]}>
        {edition === "bookplate" && <Bookplate content={content} stampKey={stampKey} />}
        {edition === "poster" && <Poster content={content} stampKey={stampKey} />}
        {edition === "ticket" && <Ticket content={content} stampKey={stampKey} />}
      </article>
    </div>
  );
}
