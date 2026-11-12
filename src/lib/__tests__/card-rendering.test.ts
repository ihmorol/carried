import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EDITION_SHARED_COPY, cardFontFamily, cardPresentation, editionCopy,
} from "@/lib/card-presentation";
import {
  EDITION_ARTWORK, EDITION_OG, editionLeading, estimateTextWidth, fitText, graphemes,
  layoutEditionArtwork, layoutEditionOg, wrapText, type EditionText,
} from "@/lib/text-layout";
import { INKS } from "@/lib/inks";
import { CARD_TEMPLATES, DEFAULT_CARD_TEMPLATE, type CardTemplateId } from "@/lib/card-templates";
import { getBook, type Book } from "@/lib/books";
import { accessionNo, formatStampDate, formatStampDateBn, type LinePayload } from "@/lib/line";

vi.mock("@/components/UnderlineButton", () => ({ UnderlineButton: () => null }));
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: (props: { href: string; "aria-label"?: string; children: ReactElement }) =>
      createElement("a", { href: props.href, "aria-label": props["aria-label"] }, props.children),
  };
});
const ogStore = vi.hoisted(() => ({ resolveLine: vi.fn(), resolveBookForLine: vi.fn(), findBook: vi.fn() }));
vi.mock("@/lib/store", () => ogStore);
vi.mock("next/og", () => ({ ImageResponse: class {
  constructor(public element: ReactElement, public options: { width: number; height: number; fonts: unknown[] }) {}
} }));

const base: LinePayload = { v: 1, b: "the-alchemist", q: "The journey stays with me.", n: "Amara", s: "paper", d: "2026-01-12" };
const nativeBook: Book = { slug: "native-test", title: "Romanized title", titleBn: "বাংলা বই", author: "Romanized author", authorBn: "বাংলা লেখক", year: 2024, spine: "forest", tags: [] };
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function editionText(payload: LinePayload, id: string, book: Book): EditionText {
  const content = cardPresentation(payload, book)!;
  return {
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
}

const atLimit = (edition: CardTemplateId, latin = false): LinePayload => ({
  ...base,
  ct: edition,
  q: latin ? "M".repeat(220) : "আ".repeat(220),
  n: latin ? "W".repeat(24) : "আ".repeat(24),
  b: nativeBook.slug,
});
const limitBook = (latin = false): Book => ({
  ...nativeBook,
  titleBn: latin ? "W".repeat(90) : "আ".repeat(90),
  authorBn: latin ? "W".repeat(60) : "কৌ".repeat(30),
});

describe("shared card content and edition resolution", () => {
  it("uses original titles and native authors independently of the quote script", () => {
    const content = cardPresentation(base, nativeBook)!;
    expect(content.title).toBe(nativeBook.titleBn);
    expect(content.author).toBe(nativeBook.authorBn);
    expect(content.byline).toBe("বাংলা লেখক · 2024");
    expect(content.date).toBe(formatStampDate(base.d));
    expect(content.quoteScript).toBe("latin");
    expect(content.titleScript).toBe("bengali");
  });
  it("dates follow quote script while signatures follow only name script", () => {
    const banglaQuote = cardPresentation({ ...base, q: "বইটি carried with me" }, nativeBook)!;
    expect(banglaQuote.date).toBe(formatStampDateBn(base.d));
    expect(banglaQuote.nameScript).toBe("latin");
    const banglaName = cardPresentation({ ...base, n: "অমরা" }, nativeBook)!;
    expect(banglaName.date).toBe(formatStampDate(base.d));
    expect(banglaName.nameScript).toBe("bengali");
  });
  it("resolves the display edition from ct and keeps legacy payloads on the house edition without writing it back", () => {
    for (const edition of CARD_TEMPLATES) {
      expect(cardPresentation({ ...base, ct: edition }, nativeBook)!.edition).toBe(edition);
    }
    const legacy = { ...base, b: nativeBook.slug };
    expect(cardPresentation(legacy, nativeBook)!.edition).toBe(DEFAULT_CARD_TEMPLATE);
    expect(legacy).not.toHaveProperty("ct");
    // The rendered DOM never mutates the payload either.
    const snapshot = JSON.stringify(legacy);
    const decoded = JSON.parse(JSON.stringify(legacy)) as LinePayload;
    expect(decoded.ct).toBeUndefined();
    expect(JSON.stringify(legacy)).toBe(snapshot);
  });
  it("splits the two voices: text roles lead with the display serif while meta keeps the script-ordered sans", () => {
    for (const surface of ["dom", "canvas", "og"] as const) for (const script of ["latin", "bengali"] as const) {
      const suffix = surface === "canvas" ? " Export" : "";
      const meta = cardFontFamily(script, "meta", surface);
      const text = cardFontFamily(script, "text", surface);
      // Meta is the interface voice alone: no display serif, no banned face.
      expect(meta).not.toMatch(/Fraunces|Plex|Noto|font-book|monospace/);
      // The text voice leads with Noto Serif Bengali and never falls back to a banned face.
      expect(text).toMatch(new RegExp(surface === "dom" ? "^var\\(--font-book\\)" : `^"Noto Serif Bengali${suffix}"`));
      expect(text).not.toMatch(/Fraunces|Plex|Noto Sans|monospace/);
      if (surface === "dom") {
        expect(meta).toContain("var(--font-manrope)");
        expect(meta).toContain("var(--font-anek-bangla)");
        expect(meta).toMatch(/sans-serif$/);
        expect(text).toContain("var(--font-manrope)");
        expect(text).toContain("var(--font-anek-bangla)");
        expect(text).toMatch(/sans-serif$/);
      } else {
        expect(meta).toContain(`"Manrope${suffix}"`);
        expect(meta).toContain(`"Anek Bangla${suffix}"`);
        expect(text).toContain(`"Manrope${suffix}"`);
        expect(text).toContain(`"Anek Bangla${suffix}"`);
      }
      // Script order: the text's own script resolves first behind the voice's lead.
      const own = script === "bengali"
        ? surface === "dom" ? "var(--font-anek-bangla)" : `"Anek Bangla${suffix}"`
        : surface === "dom" ? "var(--font-manrope)" : `"Manrope${suffix}"`;
      const other = script === "bengali"
        ? surface === "dom" ? "var(--font-manrope)" : `"Manrope${suffix}"`
        : surface === "dom" ? "var(--font-anek-bangla)" : `"Anek Bangla${suffix}"`;
      for (const family of [meta, text]) {
        expect(family.indexOf(own)).toBeGreaterThanOrEqual(0);
        expect(family.indexOf(own)).toBeLessThan(family.indexOf(other));
      }
    }
    expect(cardFontFamily("bengali", "meta", "canvas")).toMatch(/^"Anek Bangla Export"/);
    expect(cardFontFamily("latin", "meta", "og")).toMatch(/^"Manrope"/);
    // Fitting roles measure the serif voice: one estimator, conservatively wider units.
    expect(estimateTextWidth("Wide iii", 16, "quote")).toBe(estimateTextWidth("Wide iii", 16, "book"));
    expect(estimateTextWidth("Wide iii", 16, "quote")).toBeGreaterThan(estimateTextWidth("Wide iii", 16));
  });
  it("supports URL-carried books and enriched legacy books without changing text", () => {
    const legacy = { ...base, b: nativeBook.slug };
    expect(cardPresentation(legacy)).toBeUndefined();
    expect(cardPresentation(legacy, nativeBook)?.title).toBe(nativeBook.titleBn);
    expect(cardPresentation({ ...legacy, bt: "Full title", ba: "Full author", by: -100 })?.byline).toBe("Full author · 100 BC");
  });
});

describe("three edition DOM compositions", () => {
  async function renderLineCard(payload: LinePayload, props: Record<string, unknown> = {}) {
    const { LineCard } = await import("@/components/LineCard");
    const { LocaleProvider } = await import("@/components/LocaleProvider");
    return renderToStaticMarkup(createElement(LocaleProvider, null, createElement(LineCard, { payload, book: nativeBook, id: "test-id", actions: false, ...props })));
  }

  it("renders every edition with its full content and its approved furniture", async () => {
    for (const edition of CARD_TEMPLATES) {
      const payload = { ...base, ct: edition, b: nativeBook.slug };
      const content = cardPresentation(payload, nativeBook)!;
      const html = await renderLineCard(payload, { asLink: true, animateStamp: true });
      for (const value of [content.quote, content.name, content.title, content.author, content.date, accessionNo("test-id")]) {
        expect(html).toContain(String(value));
      }
      expect(html).toContain(editionCopy(edition, content.quoteScript));
      expect(html).toContain(EDITION_SHARED_COPY.afterReading[content.quoteScript]);
      expect(html).toContain(EDITION_SHARED_COPY.carriedBy[content.quoteScript]);
      expect(html).toContain(`data-edition="${edition.replace(/-v\d+$/, "")}"`);
      expect(html).toContain("edition-stamp");
      expect(html).toContain('data-stamped="true"');
      expect(html).not.toMatch(/line-clamp|text-overflow:ellipsis/);
      // The payload stays exactly as minted; the edition is display-only.
      expect(JSON.stringify(payload)).toBe(JSON.stringify({ ...base, ct: edition, b: nativeBook.slug }));
    }
  });
  it("keeps fitted quote and book spans in the display voice despite inherited language selectors", async () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    // JSDOM does not resolve this language/inheritance cascade like Chromium.
    const inheritRule = /\.edition-artwork\s+:is\(\.edition-quote,\s*\.edition-book-title\)\s+:is\(p,\s*\.edition-lines,\s*\.edition-line\)\s*\{\s*font-family:\s*inherit;\s*\}/;
    expect(css).toMatch(inheritRule);
    expect(css.search(inheritRule)).toBeGreaterThan(css.indexOf(".edition-artwork :lang(en)"));
    expect(css.search(inheritRule)).toBeGreaterThan(css.indexOf(".edition-artwork :lang(bn)"));
    for (const edition of CARD_TEMPLATES) for (const bengali of [false, true]) {
      const payload = { ...base, ct: edition, q: bengali ? "ভয়কে নাম ধরে ডাকলে পথটা সহজ হয়।" : base.q };
      const html = await renderLineCard(payload);
      expect(html).toContain(`class="edition-quote" lang="${bengali ? "bn" : "en"}"`);
      for (const role of ["edition-quote", "edition-book-title", "edition-book-author", "edition-reader-name"]) {
        const fitted = new RegExp(`class="${role}"[^>]*>[\\s\\S]*?class="edition-lines"[^>]*>[\\s\\S]*?class="edition-line"`);
        expect(html).toMatch(fitted);
      }
    }
  });
  it("ports the bookplate's hairline plate rule and signature ownership", async () => {
    const html = await renderLineCard({ ...base, ct: "bookplate-v1", b: nativeBook.slug });
    expect(html).toContain("edition-bookplate-frame");
    expect(html).toContain("edition-frame-rule");
    expect(html).toContain("edition-bookplate-mark");
    expect(html).toContain("edition-signature-rule");
    expect(html).toContain("edition-bookplate-accession");
    expect(html).toContain("Carried");
  });
  it("ports the poster's reversed field and coral band credit line", async () => {
    const html = await renderLineCard({ ...base, ct: "poster-v1", b: nativeBook.slug });
    expect(html).toContain("edition-poster-field");
    expect(html).toContain("edition-poster-band");
    expect(html).toContain("edition-poster-credit");
    expect(html).toContain("--edition-poster-bg");
  });
  it("ports the ticket's die-cut stock, perforation, stub and cancellation", async () => {
    const html = await renderLineCard({ ...base, ct: "ticket-v1", b: nativeBook.slug });
    expect(html).toContain("edition-ticket-stock");
    expect(html).toContain("edition-ticket-perforation");
    expect(html).toContain("edition-ticket-stub");
    expect(html).toContain("edition-cancellation-mark");
    expect(html).toContain("edition-ticket-dateline");
  });
  it("keeps legacy payloads on the bookplate without adding ct to the payload", async () => {
    const payload: LinePayload = { ...base, b: nativeBook.slug };
    const html = await renderLineCard(payload);
    expect(html).toContain("edition-bookplate-frame");
    expect(html).toContain("edition-bookplate-mark");
    expect(html).toContain('data-edition="bookplate"');
    expect(html).not.toContain('data-edition="poster"');
    expect(html).not.toContain('data-edition="ticket"');
    expect("ct" in payload).toBe(false);
  });
  it("keeps the vote/actions row outside the painted surface in page tokens", async () => {
    const withActions = await renderLineCard({ ...base, ct: "poster-v1", b: nativeBook.slug }, { actions: true, votes: 2 });
    expect(withActions).toContain("edition-actions");
    expect(withActions).toContain("underlined ×2");
    expect(withActions.indexOf("edition-actions")).toBeGreaterThan(withActions.indexOf("</article>"));
    const withoutActions = await renderLineCard({ ...base, ct: "poster-v1", b: nativeBook.slug });
    expect(withoutActions).not.toContain("edition-actions");
  });
  it("asLink wraps only the artwork, with the actions row outside the anchor", async () => {
    const html = await renderLineCard({ ...base, ct: "ticket-v1", b: nativeBook.slug }, { asLink: true, actions: true });
    expect(html).toContain(`<a href="/l/test-id"`);
    expect(html.indexOf("<a")).toBeLessThan(html.indexOf("<article"));
    expect(html.indexOf("</a>")).toBeLessThan(html.indexOf("edition-actions"));
    expect(html).toContain(`aria-label="Line carried out of ${nativeBook.titleBn} by Amara"`);
  });
  it("preserves every character of the 220/24/90/60 limits in all editions, including Bangla", async () => {
    for (const edition of CARD_TEMPLATES) for (const latin of [true, false]) {
      const payload = atLimit(edition, latin);
      const book = limitBook(latin);
      const content = cardPresentation(payload, book)!;
      const html = await renderLineCard(payload, { book });
      for (const value of [content.quote, content.name, content.title, content.author]) expect(html).toContain(value);
      expect(html).not.toMatch(/…|line-clamp|text-overflow:ellipsis/);
      // The DOM's density flag mirrors the layout's decision exactly.
      const dense = layoutEditionArtwork(editionText(payload, "density-check", book), edition).dense;
      expect(html.includes('data-density="dense"')).toBe(dense);
    }
  });
  it("typesets Bangla names at 1.5 leading and floors the quote at 14px print size", async () => {
    const bn = editionText({ ...base, q: "বইটি মনে রয়ে যায়।", n: "অমরা" }, "test-id", nativeBook);
    for (const edition of CARD_TEMPLATES) {
      const layout = layoutEditionArtwork(bn, edition);
      expect(layout.nameLeading).toBe(1.5);
      expect(layout.quoteLeading).toBe(1.45);
      const short = layoutEditionArtwork(editionText(base, "test-id", nativeBook), edition);
      expect(short.quote.fontSize).toBeGreaterThanOrEqual(14);
      expect(short.name.fontSize).toBeGreaterThanOrEqual(9);
    }
    expect(editionLeading("latin", "poster-v1", "quote")).toBe(1.12);
    expect(editionLeading("latin", "bookplate-v1", "name")).toBe(1.15);
  });
});

describe("word and grapheme safe content-led fitting", () => {
  it("wraps at words before breaking unbroken tokens, preserving every character", () => {
    const lines = wrapText("one two three", 7, (text) => text.length);
    expect(lines).toEqual(["one two", " three"]);
    expect(lines.join("")).toBe("one two three");
    const text = "M".repeat(220);
    const wrapped = wrapText(text, 17, (value) => value.length);
    expect(wrapped.join("")).toBe(text);
    expect(wrapped.every((line) => line.length <= 17)).toBe(true);
  });
  it("does not split Bengali conjuncts, combining marks, or emoji sequences", () => {
    const text = "ক্ষি\u200dক্ষি e\u0301 👩‍👩‍👧‍👦";
    const wrapped = wrapText(text, 3, (value) => graphemes(value).length);
    expect(wrapped.join("")).toBe(text);
    const offsets = new Set([0]);
    let offset = 0;
    for (const cluster of graphemes(text)) { offset += cluster.length; offsets.add(offset); }
    offset = 0;
    for (const line of wrapped) { offset += line.length; expect(offsets.has(offset)).toBe(true); }
  });
  it("bounds wide Manrope letters and Anek Bangla spacing marks, not just average Latin glyphs", () => {
    expect(estimateTextWidth("mwmw", 100)).toBeGreaterThanOrEqual(335);
    expect(estimateTextWidth("আআ", 100)).toBeGreaterThanOrEqual(252.4);
    expect(estimateTextWidth("কৌ", 100)).toBeGreaterThanOrEqual(159.5);
    expect(estimateTextWidth("কি", 100)).toBeGreaterThan(estimateTextWidth("ক", 100));
    expect(estimateTextWidth("e\u0301", 100)).toBe(estimateTextWidth("e", 100));
  });
  it("retains tabs, repeated spaces and newlines", () => {
    const text = "one  two\tthree\nfour";
    expect(wrapText(text, 7, (value) => value.length).join("")).toBe(text);
  });
  it("throws rather than silently cropping text outside the fit bounds", () => {
    expect(() => fitText("unrenderable", { width: 1, height: 1, minFontSize: 16, maxFontSize: 20, leading: 1.5,
      measure: (text, size) => text.length * size })).toThrow(RangeError);
  });
});

describe("per-edition artwork fitting", () => {
  it("fits the 220/24/90/60 limits in every edition without losing any character", () => {
    const inputs = [
      { q: "M".repeat(220), n: "W".repeat(24) },
      { q: "ব".repeat(220), n: "ব".repeat(24) },
      { q: "আ".repeat(220), n: "আ".repeat(24) },
      { q: "mwmw ".repeat(44), n: "w".repeat(24) },
      { q: "বাংলা and Latin, ".repeat(15).slice(0, 220), n: "Amara অমরা" },
      { q: "A short line.", n: "Rowan" },
    ];
    const books = [limitBook(true), limitBook(false), nativeBook];
    for (const edition of CARD_TEMPLATES) for (const input of inputs) for (const book of books) {
      const text = editionText({ ...base, ct: edition, b: nativeBook.slug, ...input }, "fit-test", book);
      const layout = layoutEditionArtwork(text, edition);
      const normalized = (value: string) => value.replace(/\u2060/gu, " ").replace(/\s+/gu, " ");
      for (const role of ["quote", "name", "book", "author"] as const) {
        const fit = layout[role];
        expect(fit.lines.join("").replace(/\u2060/gu, " ")).toBe(normalized(text[role]));
        expect(fit.height).toBeGreaterThan(0);
        expect(fit.lines.every((line) => estimateTextWidth(line, fit.fontSize) > 0)).toBe(true);
      }
      // Floors survive every density; the quote block stays on the artwork.
      expect(layout.quote.fontSize).toBeGreaterThanOrEqual(14);
      expect(layout.name.fontSize).toBeGreaterThanOrEqual(9);
      expect(layout.quoteTop).toBeGreaterThanOrEqual(40);
      expect(layout.quoteTop + layout.quoteHeight).toBeLessThanOrEqual(EDITION_ARTWORK.height);
      expect(layout.quoteInset).toBeGreaterThan(0);
    }
  });
  it("switches to the dense emergency layout for extreme quotes while keeping full text and floors", () => {
    for (const edition of CARD_TEMPLATES) {
      const text = editionText(atLimit(edition), "dense-test", limitBook(false));
      const layout = layoutEditionArtwork(text, edition);
      expect(layout.dense).toBe(true);
      expect(layout.quote.fontSize).toBeGreaterThanOrEqual(14);
      expect(layout.quote.lines.join("").replace(/\u2060/gu, " ")).toBe(text.quote);
      if (edition !== "ticket-v1") {
        expect(layout.book.fontSize).toBe(8);
        expect(layout.author.fontSize).toBe(8);
      }
      expect(layout.name.fontSize).toBeLessThanOrEqual(18);
    }
  });
  it("keeps short lines beside their provenance in the approved furniture", () => {
    const text = editionText(base, "test-id", nativeBook);
    const layout = layoutEditionArtwork(text, "bookplate-v1");
    expect(layout.quote.fontSize).toBe(28);
    expect(layout.quoteTop).toBe(82);
    expect(layout.quoteInset).toBe(36);
    const poster = layoutEditionArtwork(text, "poster-v1");
    expect(poster.quote.fontSize).toBe(34);
    expect(editionLeading(text.language, "poster-v1", "quote")).toBe(1.12);
  });
  it("reserves real label height and a clear gap before the book credit", () => {
    for (const edition of ["bookplate-v1", "poster-v1"] as const) {
      const text = editionText({ ...base, q: "A longer reflection. ".repeat(10) }, "credit-gap", nativeBook);
      const layout = layoutEditionArtwork(text, edition);
      expect(layout.credit.top - (layout.quoteTop + layout.quoteHeight)).toBeGreaterThanOrEqual(12);
    }
  });
  it("keeps a maximum Bengali name inside the Ticket's circular claim", () => {
    const text = editionText({ ...base, n: "আ".repeat(24) }, "ticket-name", nativeBook);
    const layout = layoutEditionArtwork(text, "ticket-v1");
    // The furthest name corner must fit the 52px radius, not merely its square box.
    const bottom = (12.35 + 2 + layout.name.height) / 2;
    expect(Math.hypot(39, bottom)).toBeLessThanOrEqual(52);
    expect(layout.name.fontSize).toBeGreaterThanOrEqual(9);
  });
});

function luminance(hex: string) {
  const channels = hex.match(/[\da-f]{2}/gi)!.map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
describe("three accessible modern inks", () => {
  it("uses the approved palette and readable primary, metadata and stamp text", () => {
    const colors = {
      paper: ["#fffefa", "#26292f", "#60646c", "#dfdfd5", "#b64450"],
      midnight: ["#252a34", "#fbfbf6", "#c0c4cd", "#49515f", "#ffa0aa"],
      moss: ["#e7eee6", "#293b34", "#53655a", "#becdbf", "#b64450"],
    };
    expect(Object.keys(INKS)).toHaveLength(3);
    for (const ink of Object.values(INKS)) {
      expect([ink.bg, ink.text, ink.soft, ink.rule, ink.stamp]).toEqual(colors[ink.id]);
      expect(contrast(ink.text, ink.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(ink.soft, ink.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(ink.stamp, ink.bg)).toBeGreaterThanOrEqual(4.5);
    }
    expect(INKS.moss.stamp).toBe(INKS.paper.stamp);
  });
});

describe("per-edition OG images", () => {
  it("fits the input limits in the landscape cuts without truncation, seating the Bengali extreme on the bookplate's tiered floor", () => {
    for (const edition of CARD_TEMPLATES) for (const latin of [true, false]) {
      const text = editionText(atLimit(edition, latin), "og-fit", limitBook(latin));
      const layout = layoutEditionOg(text, edition);
      const normalized = (value: string) => value.replace(/\s+/gu, " ");
      for (const role of ["quote", "name", "book", "author", "date"] as const) {
        expect(layout[role].lines.join("")).toBe(normalized(text[role]));
      }
      // Serif Bengali units seat the widest legal quote (220 × আ) on the
      // bookplate's 20px tiered floor (8 × 20 × 1.45 = 232 ≤ 250); everything
      // that fits at 22px or above keeps its approved size.
      const ogFloor = edition === "bookplate-v1" && !latin ? 20 : 22;
      expect(layout.quote.fontSize).toBeGreaterThanOrEqual(ogFloor);
      expect(layout.quote.height).toBeLessThanOrEqual(layout.regions.quote.height);
      expect(layout.name.fontSize).toBeGreaterThanOrEqual(14);
      for (const region of Object.values(layout.regions)) {
        expect(region.x).toBeGreaterThanOrEqual(0);
        expect(region.x + region.width).toBeLessThanOrEqual(EDITION_OG.width);
        expect(region.y).toBeGreaterThanOrEqual(0);
        expect(region.y + region.height).toBeLessThanOrEqual(EDITION_OG.height);
      }
    }
  });
  it("still refuses over-cap quotes rather than cropping on the landscape cut", () => {
    // The store caps quotes at 220 chars, so a 280-char Bengali line can only
    // reach layoutEditionOg through misuse. Even the 20px tiered floor cannot
    // seat it on the bookplate (9 × 20 × 1.45 = 261 > 250): the OG cut fails
    // loudly instead of cropping.
    const text = editionText({ ...atLimit("bookplate-v1"), q: "আ".repeat(280) }, "og-refusal", limitBook(false));
    expect(() => layoutEditionOg(text, "bookplate-v1")).toThrow(RangeError);
  });
  it("renders each edition's landscape identity with the full bilingual text", async () => {
    const { default: OgImage } = await import("@/app/l/[id]/opengraph-image");
    for (const edition of CARD_TEMPLATES) {
      const payload = { ...base, ct: edition, b: nativeBook.slug, q: "বাংলা carried across the surfaces", n: "অমরা" };
      ogStore.resolveLine.mockResolvedValue(payload);
      ogStore.resolveBookForLine.mockResolvedValue(nativeBook);
      const image = await OgImage({ params: Promise.resolve({ id: "edition-id" }) }) as unknown as { element: ReactElement; options: { width: number; height: number } };
      expect(image.options.width).toBe(1200);
      expect(image.options.height).toBe(630);
      const html = renderToStaticMarkup(image.element);
      const content = cardPresentation(payload, nativeBook)!;
      const text = html.replace(/<[^>]*>/g, "");
      for (const value of [content.quote, content.name, content.title, content.author, content.date, accessionNo("edition-id")]) {
        expect(text).toContain(value);
      }
      expect(text).toContain(EDITION_SHARED_COPY.carriedBy[content.quoteScript]);
      expect(html).toContain('"Manrope", "Anek Bangla"'.replace(/"/g, "&quot;"));
      // The text voice (wordmark, quote, book title) carries the display serif;
      // interface/meta text stays on the sans pair.
      expect(html).toContain('"Noto Serif Bengali"'.replace(/"/g, "&quot;"));
      expect(html).toContain('"Anek Bangla", "Manrope"'.replace(/"/g, "&quot;"));
      if (edition === "bookplate-v1") {
        // One hairline plate rule; the coral signature rule is the only mark.
        expect(html).toContain("border-top:3px solid");
        expect(html).not.toContain("border-radius:50%");
      }
      if (edition === "poster-v1") {
        // Straight credit line on the band; no rotated box remains.
        expect(html).not.toContain("rotate(-6deg)");
        expect(html).toContain(`background-color:${INKS.paper.stamp}`);
      }
      if (edition === "ticket-v1") {
        expect(html).toContain("stroke-dasharray");
        expect(html).toContain("<circle");
      }
      expect(html).not.toMatch(/italic|letter-spacing:(?!0)|CARRIED|Fraunces|Plex|Noto Sans|monospace/);
    }
  });
  it("unknown line/book uses the readable type fallback rather than crashing", async () => {
    const { default: LineOg } = await import("@/app/l/[id]/opengraph-image");
    const { default: BookOg } = await import("@/app/b/[slug]/opengraph-image");
    ogStore.resolveLine.mockResolvedValue(undefined);
    ogStore.findBook.mockResolvedValue(undefined);
    for (const image of [await LineOg({ params: Promise.resolve({ id: "missing" }) }), await BookOg({ params: Promise.resolve({ slug: "missing" }) })]) {
      const html = renderToStaticMarkup((image as unknown as { element: ReactElement }).element);
      expect(html).toContain("Carried");
      expect(html).toContain("background-color:#fffefa");
      // The fallback wordmark speaks the display serif voice.
      expect(html).toContain("Noto Serif Bengali");
      expect(html).toContain("Manrope");
    }
  });
  it("book and site OG speak in the two voices with normal-case type and no banned faces", async () => {
    const { default: BookOg } = await import("@/app/b/[slug]/opengraph-image");
    const { default: SiteOg } = await import("@/app/opengraph-image");
    ogStore.findBook.mockResolvedValue(nativeBook);
    const image = await BookOg({ params: Promise.resolve({ slug: nativeBook.slug }) });
    const html = renderToStaticMarkup((image as unknown as { element: ReactElement }).element);
    expect(html).toContain(nativeBook.titleBn);
    expect(html).toContain(nativeBook.authorBn);
    expect(html).toContain("Anek Bangla");
    for (const markup of [html, renderToStaticMarkup((SiteOg() as unknown as { element: ReactElement }).element)]) {
      expect(markup).toContain("Manrope");
      // Book title and wordmark carry the display serif; the banned faces stay out.
      expect(markup).toContain("Noto Serif Bengali");
      expect(markup).not.toMatch(/Fraunces|Plex|Noto Sans|italic|CARRIED|letter-spacing:(?!0)/);
    }
  });
  it("encodes short and long bilingual cards of every edition with actual local OG font bytes", async () => {
    const { default: OgImage } = await import("@/app/l/[id]/opengraph-image");
    const { ImageResponse } = await vi.importActual<typeof import("next/og")>("next/og");
    // The serif estimator seats seven 22px Bengali lines on the bookplate's
    // landscape quote region (210 chars); poster and ticket keep the full 220.
    const bengaliMax = (edition: CardTemplateId) => edition === "bookplate-v1" ? "আ".repeat(210) : "আ".repeat(220);
    for (const edition of CARD_TEMPLATES) for (const quote of ["I remember.", "মনে থাকে।", "M".repeat(220), bengaliMax(edition)]) {
      const payload = { ...base, ct: edition, b: "native-test", q: quote, n: "M".repeat(24), s: "moss" as const };
      const book = { ...nativeBook, titleBn: "ব".repeat(90), authorBn: "ব".repeat(60) };
      ogStore.resolveLine.mockResolvedValue(payload);
      ogStore.resolveBookForLine.mockResolvedValue(book);
      const image = await OgImage({ params: Promise.resolve({ id: "render-test" }) }) as unknown as { element: ReactElement; options: ConstructorParameters<typeof ImageResponse>[1] };
      const bytes = new Uint8Array(await new ImageResponse(image.element, image.options).arrayBuffer());
      expect(Array.from(bytes.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      const view = new DataView(bytes.buffer);
      expect(view.getUint32(16)).toBe(1200); expect(view.getUint32(20)).toBe(630);
    }
  }, 60000);
  it("ships exactly nine static local faces, matching the source files, and caches reads", async () => {
    const { loadOgFonts } = await import("@/lib/og-fonts");
    const fonts = loadOgFonts();
    expect(loadOgFonts()).toBe(fonts);
    expect(fonts).toHaveLength(9);
    for (const name of ["Noto Serif Bengali", "Manrope", "Anek Bangla"]) {
      expect(fonts.filter((font) => font.name === name).map((font) => font.weight)).toEqual([400, 500, 600]);
    }
    for (const font of fonts) {
      expect(font.style).toBe("normal");
      expect(font.data.readUInt32BE(0)).toBe(0x00010000);
      expect(font.data.equals(readFileSync(join(process.cwd(), "public", "fonts", `${font.name.replace(/ /g, "")}-${font.weight}.ttf`)))).toBe(true);
    }
  });
});

function mockCanvas() {
  const drawn: string[] = [];
  const textCalls: { value: string; x: number; y: number; font: string; spacing: string }[] = [];
  const ctx = {
    font: "", letterSpacing: "0px", fillStyle: "", strokeStyle: "", lineWidth: 0,
    textAlign: "left", textBaseline: "top", globalAlpha: 1,
    fillText: vi.fn(function (this: { font: string; letterSpacing: string }, value: string, x: number, y: number) {
      drawn.push(value); textCalls.push({ value, x, y, font: this.font, spacing: this.letterSpacing });
    }),
    measureText: vi.fn(function (this: { font: string }, value: string) {
      const size = Number(/([\d.]+)px/.exec(this.font)?.[1] ?? 20);
      return { width: estimateTextWidth(value, size) };
    }),
    fillRect: vi.fn(), strokeRect: vi.fn(), rect: vi.fn(), roundRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    stroke: vi.fn(), fill: vi.fn(), clip: vi.fn(), closePath: vi.fn(), arc: vi.fn(), ellipse: vi.fn(),
    setLineDash: vi.fn(), save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(),
  };
  const canvas = { width: 0, height: 0, getContext: vi.fn(() => ctx), toBlob: vi.fn((callback: (blob: Blob) => void) => callback(new Blob(["png"], { type: "image/png" }))) };
  const add = vi.fn(), check = vi.fn(() => true), load = vi.fn(async (): Promise<void> => undefined);
  class MockFontFace {
    constructor(public family: string, public source: string, public descriptors: unknown) {}
    async load() { await load(); return this; }
  }
  vi.stubGlobal("FontFace", MockFontFace);
  vi.stubGlobal("document", { fonts: { add, check, ready: Promise.resolve() }, createElement: vi.fn(() => canvas) });
  return { drawn, textCalls, canvas, ctx, add, check, load };
}

describe("explicit canvas font registration and per-edition export", () => {
  it("loads nine static faces even when check misleadingly says true, then caches repeat export", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const mock = mockCanvas();
    const payload = { ...base, q: "বাংলা travels with me", n: "Amara" };
    await exportLineCard(payload, "first", nativeBook);
    expect(mock.load).toHaveBeenCalledTimes(9);
    expect(mock.add).toHaveBeenCalledTimes(9);
    expect(mock.check).not.toHaveBeenCalled();
    expect(mock.canvas.width).toBe(1080); expect(mock.canvas.height).toBe(1350);
    const content = cardPresentation(payload, nativeBook)!;
    // Centered lines are drawn trimmed (the DOM collapses those spaces too).
    const spoken = mock.drawn.join(" ").replace(/\s+/gu, " ");
    for (const text of [content.quote, content.title, content.author, content.name, content.date]) expect(spoken).toContain(text);
    await exportLineCard(payload, "second", nativeBook);
    expect(mock.load).toHaveBeenCalledTimes(9);
    expect(mock.add).toHaveBeenCalledTimes(9);
    expect(mock.add.mock.calls.map(([font]) => font.family)).toEqual([
      "Noto Serif Bengali Export", "Noto Serif Bengali Export", "Noto Serif Bengali Export",
      "Manrope Export", "Manrope Export", "Manrope Export",
      "Anek Bangla Export", "Anek Bangla Export", "Anek Bangla Export",
    ]);
  });
  it("draws each edition's approved furniture with real measured fitting", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const cases: [CardTemplateId, (mock: ReturnType<typeof mockCanvas>) => void][] = [
      ["bookplate-v1", (mock) => {
        // One hairline plate rule plus the coral signature rule.
        expect(mock.ctx.strokeRect).toHaveBeenCalled();
        expect(mock.ctx.fillRect.mock.calls.length).toBeGreaterThanOrEqual(2);
      }],
      ["poster-v1", (mock) => {
        // Straight band credit: no rotated box, no decorative quotation mark.
        expect(mock.ctx.rotate).not.toHaveBeenCalled();
        expect(mock.ctx.fillRect.mock.calls.length).toBeGreaterThanOrEqual(2); // field + band
        expect(mock.drawn).not.toContain("”");
      }],
      ["ticket-v1", (mock) => {
        expect(mock.ctx.arc).toHaveBeenCalled(); // die-cut stock + cancellation
        expect(mock.ctx.setLineDash).toHaveBeenCalled(); // perforation
      }],
    ];
    for (const [edition, assert] of cases) {
      const mock = mockCanvas();
      await exportLineCard({ ...base, ct: edition, b: nativeBook.slug }, edition, nativeBook);
      expect(mock.canvas.width).toBe(EDITION_ARTWORK.width * EDITION_ARTWORK.scale);
      assert(mock);
    }
  });
  it("keeps centered Bookplate text inside the card and shares its vertical alignment", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const mock = mockCanvas();
    const payload: LinePayload = { ...base, ct: "bookplate-v1", q: "I remember." };
    await exportLineCard(payload, "centered", getBook(base.b));
    const quote = mock.textCalls.find((call) => call.value === payload.q)!;
    expect(quote.x).toBe(540);
    expect(quote.y).toBeGreaterThan(300);
    const label = mock.textCalls.find((call) => call.value === "After reading")!;
    expect(Number(/([\d.]+)px/.exec(label.font)![1])).toBeGreaterThanOrEqual(28.5);
  });
  it("uses a full-size Ticket cancellation mark rather than a CSS percentage as pixels", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const mock = mockCanvas();
    await exportLineCard({ ...base, ct: "ticket-v1" }, "ticket", getBook(base.b));
    // The cancellation ring keeps the DOM viewBox proportions (108/132).
    expect(mock.ctx.arc).toHaveBeenCalledWith(0, 0, expect.closeTo(64 * (108 / 132) * 3, 1), 0, expect.closeTo(Math.PI * 2, 5));
  });
  it("keeps the dense Poster band below the credit rather than painting over it", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const mock = mockCanvas();
    await exportLineCard(atLimit("poster-v1"), "dense", limitBook(false));
    expect(mock.ctx.fillRect).toHaveBeenCalledWith(0, 1110, 1080, 240);
    expect(mock.ctx.fillRect).not.toHaveBeenCalledWith(0, 999, 1080, 351);
  });
  it("uses canonical portrait line breaks even when browser measurements differ", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const payload: LinePayload = { ...base, ct: "poster-v1", q: "Fear loses its power when I name it and keep walking." };
    const mock = mockCanvas();
    mock.ctx.measureText.mockImplementation(function (this: { font: string }, value: string) {
      const size = Number(/([\d.]+)px/.exec(this.font)?.[1] ?? 20);
      return { width: estimateTextWidth(value, size) * 0.82 };
    });
    await exportLineCard(payload, "canonical", getBook(base.b));
    const lines = mock.textCalls.filter((call) => call.y > 200 && call.y < 900 && /600 /.test(call.font) && Number(/([\d.]+)px/.exec(call.font)![1]) > 80);
    const content = cardPresentation(payload, getBook(base.b))!;
    const fit = layoutEditionArtwork(editionText(payload, "canonical", content.book), "poster-v1").quote;
    expect(lines.map((call) => call.value.trim())).toEqual(fit.lines.map((line) => line.trim()));
  });
  it("draws the fitted quote at its layout position without decorative italics or tracking", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const mock = mockCanvas();
    const payload: LinePayload = { ...base, ct: "bookplate-v1", b: nativeBook.slug, q: "I remember." };
    const content = cardPresentation(payload, nativeBook)!;
    const text = editionText(payload, "compact", nativeBook);
    const layout = layoutEditionArtwork(text, content.edition);
    await exportLineCard(payload, "compact", nativeBook);
    const quote = mock.textCalls.find((call) => call.value === payload.q)!;
    expect(quote.y).toBeCloseTo((layout.quoteY + layout.quote.lineHeight / 2 + layout.quote.fontSize * 0.3) * EDITION_ARTWORK.scale);
    // The quote speaks the serif text voice; the meta labels never carry it.
    expect(quote.font).toContain('"Noto Serif Bengali Export"');
    expect(mock.textCalls.find((call) => call.value === "After reading")!.font).not.toContain("Noto");
    expect(mock.textCalls.every((call) => call.spacing === "0px" && !/italic|Fraunces|Plex|Noto Sans/.test(call.font))).toBe(true);
    expect(mock.drawn).not.toContain("“");
  });
  it("exports every character at all input limits in every edition without ellipsis", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    for (const edition of CARD_TEMPLATES) for (const latin of [true, false]) {
      const mock = mockCanvas();
      const payload = atLimit(edition, latin);
      const book = limitBook(latin);
      const content = cardPresentation(payload, book)!;
      await exportLineCard(payload, "limits", book);
      // Lines are drawn individually, so compare with the layout's own
      // line-break whitespace squeezed out.
      const squeezed = (value: string) => value.replace(/\s+/gu, "");
      const spoken = squeezed(mock.drawn.join(" "));
      for (const text of [content.quote, content.title, content.author, content.name, content.date]) expect(spoken).toContain(squeezed(text));
      for (const call of mock.ctx.fillText.mock.calls) expect(call[0]).not.toContain("…");
    }
  });
  it("waits for actual loads before measuring or drawing", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const mock = mockCanvas();
    let finish!: () => void;
    const barrier = new Promise<void>((resolve) => { finish = resolve; });
    mock.load.mockImplementation(() => barrier);
    const pending = exportLineCard(base, "delayed", getBook(base.b));
    await Promise.resolve(); await Promise.resolve();
    expect(mock.ctx.fillText).not.toHaveBeenCalled();
    expect(mock.ctx.measureText).not.toHaveBeenCalled();
    finish(); await pending;
    expect(mock.ctx.fillText).toHaveBeenCalled();
  });
  it("shares concurrent load promises and clears rejection for a successful retry", async () => {
    vi.resetModules();
    const { loadCanvasFont } = await import("@/lib/canvas");
    const mock = mockCanvas();
    mock.load.mockRejectedValueOnce(new Error("network unavailable"));
    const a = loadCanvasFont("Test Export", "test.ttf", "500", "normal");
    const b = loadCanvasFont("Test Export", "test.ttf", "500", "normal");
    expect(a).toBe(b);
    await expect(a).rejects.toThrow("network unavailable");
    expect(mock.add).not.toHaveBeenCalled();
    await loadCanvasFont("Test Export", "test.ttf", "500", "normal");
    expect(mock.load).toHaveBeenCalledTimes(2);
    expect(mock.add).toHaveBeenCalledTimes(1);
  });
});
