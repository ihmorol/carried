import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cardFontFamily, cardPresentation, CARD_TYPOGRAPHY } from "@/lib/card-presentation";
import { CARD_SURFACES, estimateTextWidth, fitText, graphemes, layoutCardText, wrapText } from "@/lib/text-layout";
import { INKS } from "@/lib/inks";
import { getBook, type Book } from "@/lib/books";
import { formatStampDate, formatStampDateBn, type LinePayload } from "@/lib/line";

vi.mock("@/components/UnderlineButton", () => ({ UnderlineButton: () => null }));
vi.mock("next/link", () => ({ default: ({ children }: { children: ReactElement }) => children }));
const ogStore = vi.hoisted(() => ({ resolveLine: vi.fn(), resolveBookForLine: vi.fn(), findBook: vi.fn() }));
vi.mock("@/lib/store", () => ogStore);
vi.mock("next/og", () => ({ ImageResponse: class {
  constructor(public element: ReactElement, public options: { width: number; height: number; fonts: unknown[] }) {}
} }));

const base: LinePayload = { v: 1, b: "the-alchemist", q: "The journey stays with me.", n: "Amara", s: "paper", d: "2026-01-12" };
const nativeBook: Book = { slug: "native-test", title: "Romanized title", titleBn: "বাংলা বই", author: "Romanized author", authorBn: "বাংলা লেখক", year: 2024, spine: "forest", tags: [] };
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("shared card content and modern sans typography", () => {
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
    const banglaQuote = cardPresentation({ ...base, q: "বইটি carried with me", n: "Amara" }, nativeBook)!;
    expect(banglaQuote.date).toBe(formatStampDateBn(base.d));
    expect(banglaQuote.nameScript).toBe("latin");
    const banglaName = cardPresentation({ ...base, n: "অমরা" }, nativeBook)!;
    expect(banglaName.date).toBe(formatStampDate(base.d));
    expect(banglaName.nameScript).toBe("bengali");
  });
  it("keeps the role argument compatible while using the same proportional families and script fallbacks", () => {
    for (const surface of ["dom", "canvas", "og"] as const) for (const script of ["latin", "bengali"] as const) {
      const family = cardFontFamily(script, "serif", surface);
      expect(family).toBe(cardFontFamily(script, "mono", surface));
      expect(family).not.toMatch(/Fraunces|Plex|Noto|monospace/);
      if (surface === "dom") {
        expect(family).toContain("var(--font-manrope)");
        expect(family).toContain("var(--font-anek-bangla)");
        expect(family).toMatch(/sans-serif$/);
      } else {
        expect(family).toContain(surface === "canvas" ? '"Manrope Export"' : '"Manrope"');
        expect(family).toContain(surface === "canvas" ? '"Anek Bangla Export"' : '"Anek Bangla"');
      }
    }
    expect(cardFontFamily("bengali", "mono", "canvas")).toMatch(/^"Anek Bangla Export"/);
    expect(cardFontFamily("latin", "serif", "og")).toMatch(/^"Manrope"/);
    expect(estimateTextWidth("Wide iii", 16, "mono")).toBe(estimateTextWidth("Wide iii", 16, "serif"));
  });
  it("supports URL-carried books and enriched legacy books without changing text", () => {
    const legacy = { ...base, b: nativeBook.slug };
    expect(cardPresentation(legacy)).toBeUndefined();
    expect(cardPresentation(legacy, nativeBook)?.title).toBe(nativeBook.titleBn);
    expect(cardPresentation({ ...legacy, bt: "Full title", ba: "Full author", by: -100 })?.byline).toBe("Full author · 100 BC");
  });
  it("DOM preserves all content, including unbroken limits, and is not client-only", async () => {
    const { LineCard } = await import("@/components/LineCard");
    const payload = { ...base, q: "M".repeat(220), n: "M".repeat(24) };
    const book = { ...nativeBook, titleBn: "W".repeat(90), authorBn: "A".repeat(60) };
    const content = cardPresentation(payload, book)!;
    const html = renderToStaticMarkup(createElement(LineCard, { payload, book, id: "test-id", actions: false }));
    for (const text of [content.quote, content.name, content.title, content.byline, content.date]) expect(html).toContain(text);
    expect(html).toContain("overflow-wrap:anywhere");
    expect(html).not.toMatch(/line-clamp|text-overflow:ellipsis|h-full|flex-1/);
    expect(html).toContain("No.");
  });
  it("DOM uses readable metadata, compact natural height, normal case, and script-specific leading", async () => {
    const { LineCard } = await import("@/components/LineCard");
    for (const [q, leading] of [["A little hope.", "1.4"], ["বইটি মনে রয়ে যায়।", "1.5"]]) {
      const html = renderToStaticMarkup(createElement(LineCard, { payload: { ...base, q }, id: "compact", size: "lg", actions: false, asLink: true }));
      const quote = html.match(/<p\b[^>]*>/)?.[0] ?? "";
      expect(quote).toContain(`line-height:${leading}`);
      expect(quote).toContain("font-size:clamp(20px,");
      expect(quote).toContain("24px)");
      expect(html).not.toMatch(/font-style:italic|uppercase|letter-spacing:(?!0)|h-full|flex-1|“|rotate\(/);
      expect(html).toContain("font-size:12px");
      const sizes = Array.from(html.matchAll(/font-size:(\d+)px/g), (match) => Number(match[1]));
      expect(sizes.every((size) => size >= 12 && size <= 24)).toBe(true);
    }
  });
  it("StampMark retains formatted Bengali dates and uses a small horizontal signature", async () => {
    const { StampMark } = await import("@/components/StampMark");
    const date = formatStampDateBn(base.d);
    const html = renderToStaticMarkup(createElement(StampMark, { name: "Amara", date, ink: INKS.moss, animate: true }));
    expect(html).toContain(date);
    expect(html).toContain("var(--font-manrope)");
    expect(html).toContain("var(--font-anek-bangla)");
    expect(html).not.toMatch(/rotate\(|animate-stamp-in|uppercase|font-serif|font-mono/);
    expect(html).toContain("border-width:1px");
    expect(html).toContain("font-size:14px");
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
  it("keeps short Latin and Bengali quotes next to their provenance, with unused space outside the group", () => {
    for (const q of ["I remember.", "মনে থাকে।"]) for (const surface of ["png", "og"] as const) {
      const content = cardPresentation({ ...base, q }, nativeBook)!;
      const layout = layoutCardText(content, surface);
      const regions = layout.regions;
      const frame = CARD_SURFACES[surface];
      expect(layout.quote.fontSize).toBe(CARD_TYPOGRAPHY.quote * frame.scale);
      expect(regions.provenance.y - (regions.quote.y + layout.quote.height)).toBeGreaterThan(0);
      expect(regions.provenance.y - (regions.quote.y + layout.quote.height)).toBeLessThanOrEqual(32 * frame.scale);
      expect(regions.title.y - (regions.provenance.y + regions.provenance.height)).toBeLessThanOrEqual(4 * frame.scale + 0.01);
      expect(regions.byline.y - (regions.title.y + layout.title.height)).toBeLessThanOrEqual(2 * frame.scale + 0.01);
      expect(regions.stamp.y - (regions.byline.y + layout.byline.height)).toBeLessThanOrEqual(24 * frame.scale);
      expect((layout.composition.y + layout.composition.height / 2)).toBeCloseTo(frame.height / 2);
      expect(regions.stamp.y + regions.stamp.height).toBeCloseTo(layout.composition.y + layout.composition.height);
    }
  });
  it("fits 220/24/90/60 limits in adaptive PNG/OG groups without losing any text", () => {
    const inputs = [
      { ...base, q: "M".repeat(220), n: "W".repeat(24) },
      { ...base, q: "ব".repeat(220), n: "ব".repeat(24) },
      { ...base, q: "আ".repeat(220), n: "আ".repeat(24) },
      { ...base, q: "mwmw ".repeat(44), n: "w".repeat(24) },
      { ...base, q: "বাংলা and Latin, ".repeat(15).slice(0, 220), n: "Amara অমরা" },
    ];
    const books = [
      { ...nativeBook, titleBn: "M".repeat(90), authorBn: "W".repeat(60) },
      { ...nativeBook, titleBn: "ব".repeat(90), authorBn: "ব".repeat(60) },
      { ...nativeBook, titleBn: "আ".repeat(90), authorBn: "কৌ".repeat(30) },
      nativeBook,
    ];
    for (const payload of inputs) for (const book of books) for (const surface of ["png", "og"] as const) {
      const content = cardPresentation(payload, book)!;
      const layout = layoutCardText(content, surface);
      const regions = layout.regions;
      const frame = CARD_SURFACES[surface];
      for (const role of ["quote", "title", "byline", "name", "date"] as const) {
        expect(layout[role].lines.join("")).toBe(content[role]);
        expect(layout[role].height).toBe(regions[role].height);
        expect(layout[role].lines.every((text) => estimateTextWidth(text, layout[role].fontSize) <= regions[role].width)).toBe(true);
      }
      expect(layout.quote.lineHeight / layout.quote.fontSize).toBeCloseTo(content.quoteScript === "bengali" ? 1.5 : 1.4);
      expect(regions.quote.y + regions.quote.height).toBeLessThan(regions.provenance.y);
      expect(regions.provenance.y - (regions.quote.y + regions.quote.height)).toBeLessThanOrEqual(32 * frame.scale);
      expect(regions.title.y + regions.title.height).toBeLessThanOrEqual(regions.byline.y);
      expect(regions.byline.y + regions.byline.height).toBeLessThan(regions.stamp.y);
      expect(regions.name.y).toBeGreaterThan(regions.stamp.y);
      expect(regions.name.y + regions.name.height).toBeLessThan(regions.stamp.y + regions.stamp.height);
      expect(regions.date.x).toBeGreaterThan(regions.name.x + regions.name.width);
      expect(layout.composition.y).toBeGreaterThanOrEqual(frame.padding);
      expect(layout.composition.y + layout.composition.height).toBeLessThanOrEqual(frame.height - frame.padding);
    }
  });
  it("throws rather than silently cropping text outside the fit bounds", () => {
    expect(() => fitText("unrenderable", { width: 1, height: 1, minFontSize: 16, maxFontSize: 20, leading: 1.5,
      measure: (text, size) => text.length * size })).toThrow(RangeError);
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

describe("server-side OG content and resolution", () => {
  it("resolves legacy line book metadata through the core resolver and matches the DOM", async () => {
    const { default: OgImage } = await import("@/app/l/[id]/opengraph-image");
    const payload = { ...base, b: "native-test", q: "বাংলা carried across the surfaces", n: "Amara" };
    ogStore.resolveLine.mockResolvedValue(payload);
    ogStore.resolveBookForLine.mockResolvedValue(nativeBook);
    const image = await OgImage({ params: Promise.resolve({ id: "legacy-id" }) }) as unknown as { element: ReactElement; options: { width: number; height: number } };
    expect(ogStore.resolveBookForLine).toHaveBeenCalledWith(payload);
    expect(image.options.width).toBe(1200); expect(image.options.height).toBe(630);
    const html = renderToStaticMarkup(image.element);
    const content = cardPresentation(payload, nativeBook)!;
    const textContent = html.replace(/<[^>]*>/g, "");
    for (const text of [content.quote, content.name, content.title, content.byline, content.date]) expect(textContent).toContain(text);
    expect(html).toContain('"Manrope", "Anek Bangla"'.replace(/"/g, "&quot;"));
    expect(html).not.toMatch(/italic|letter-spacing:(?!0)|rotate\(|CARRIED|Fraunces|Plex|Noto/);
  });
  it("unknown line/book uses the readable sans fallback rather than crashing", async () => {
    const { default: LineOg } = await import("@/app/l/[id]/opengraph-image");
    const { default: BookOg } = await import("@/app/b/[slug]/opengraph-image");
    ogStore.resolveLine.mockResolvedValue(undefined);
    ogStore.findBook.mockResolvedValue(undefined);
    for (const image of [await LineOg({ params: Promise.resolve({ id: "missing" }) }), await BookOg({ params: Promise.resolve({ slug: "missing" }) })]) {
      const html = renderToStaticMarkup((image as unknown as { element: ReactElement }).element);
      expect(html).toContain("Carried");
      expect(html).toContain("background-color:#fffefa");
      expect(html).toContain("Manrope");
    }
  });
  it("book and site OG use only the new normal-case sans families", async () => {
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
      expect(markup).not.toMatch(/Fraunces|Plex|Noto|italic|CARRIED|letter-spacing:(?!0)/);
    }
  });
  it("encodes short and maximum bilingual cards with actual local OG font bytes", async () => {
    const { default: OgImage } = await import("@/app/l/[id]/opengraph-image");
    const { ImageResponse } = await vi.importActual<typeof import("next/og")>("next/og");
    for (const quote of ["I remember.", "মনে থাকে।", "M".repeat(220), "আ".repeat(220), "বাংলা Latin mixed ".repeat(14).slice(0, 220)]) {
      const payload = { ...base, b: "native-test", q: quote, n: "M".repeat(24), s: "moss" as const };
      const book = { ...nativeBook, titleBn: "ব".repeat(90), authorBn: "ব".repeat(60) };
      ogStore.resolveLine.mockResolvedValue(payload);
      ogStore.resolveBookForLine.mockResolvedValue(book);
      const image = await OgImage({ params: Promise.resolve({ id: "render-test" }) }) as unknown as { element: ReactElement; options: ConstructorParameters<typeof ImageResponse>[1] };
      const bytes = new Uint8Array(await new ImageResponse(image.element, image.options).arrayBuffer());
      expect(Array.from(bytes.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      const view = new DataView(bytes.buffer);
      expect(view.getUint32(16)).toBe(1200); expect(view.getUint32(20)).toBe(630);
    }
  }, 30000);
  it("ships exactly six static local faces, matching the source files, and caches reads", async () => {
    const { loadOgFonts } = await import("@/lib/og-fonts");
    const fonts = loadOgFonts();
    expect(loadOgFonts()).toBe(fonts);
    expect(fonts).toHaveLength(6);
    for (const name of ["Manrope", "Anek Bangla"]) {
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
    font: "", letterSpacing: "0px",
    fillText: vi.fn(function (this: { font: string; letterSpacing: string }, value: string, x: number, y: number) {
      drawn.push(value); textCalls.push({ value, x, y, font: this.font, spacing: this.letterSpacing });
    }),
    measureText: vi.fn(function (this: { font: string }, value: string) {
      const size = Number(/([\d.]+)px/.exec(this.font)?.[1] ?? 20);
      return { width: estimateTextWidth(value, size) };
    }),
    fillRect: vi.fn(), strokeRect: vi.fn(), roundRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
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

describe("explicit canvas font registration and compact export", () => {
  it("loads six static faces even when check misleadingly says true, then caches repeat export", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const mock = mockCanvas();
    const payload = { ...base, q: "বাংলা travels with me", n: "Amara" };
    await exportLineCard(payload, "first", nativeBook);
    expect(mock.load).toHaveBeenCalledTimes(6);
    expect(mock.add).toHaveBeenCalledTimes(6);
    expect(mock.check).not.toHaveBeenCalled();
    expect(mock.canvas.width).toBe(1080); expect(mock.canvas.height).toBe(1350);
    const content = cardPresentation(payload, nativeBook)!;
    for (const text of [content.quote, content.title, content.byline, content.name, content.date]) expect(mock.drawn.join("")).toContain(text);
    await exportLineCard(payload, "second", nativeBook);
    expect(mock.load).toHaveBeenCalledTimes(6);
    expect(mock.add).toHaveBeenCalledTimes(6);
    expect(mock.add.mock.calls.map(([font]) => font.family)).toEqual([
      "Manrope Export", "Manrope Export", "Manrope Export", "Anek Bangla Export", "Anek Bangla Export", "Anek Bangla Export",
    ]);
  });
  it("draws the same compact content-based placement without decorative quote, italics or tracking", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const mock = mockCanvas();
    const payload = { ...base, q: "I remember." };
    const content = cardPresentation(payload, nativeBook)!;
    const layout = layoutCardText(content, "png");
    await exportLineCard(payload, "compact", nativeBook);
    const quote = mock.textCalls.find((call) => call.value === payload.q)!;
    const label = mock.textCalls.find((call) => call.value === "Carried out of")!;
    expect(quote.y).toBe(layout.regions.quote.y);
    expect(label.y - (quote.y + layout.quote.height)).toBeLessThanOrEqual(32 * CARD_SURFACES.png.scale);
    expect(mock.textCalls.every((call) => call.spacing === "0px" && !/italic|Fraunces|Plex|Noto/.test(call.font))).toBe(true);
    expect(mock.drawn).not.toContain("“");
    expect(mock.ctx.rotate).not.toHaveBeenCalled();
  });
  it("exports every character at all input limits without ellipsis", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    for (const q of ["M".repeat(220), "ব".repeat(220)]) {
      const mock = mockCanvas();
      const payload = { ...base, q, n: "W".repeat(24) };
      const book = { ...nativeBook, titleBn: "ব".repeat(90), authorBn: "ব".repeat(60) };
      const content = cardPresentation(payload, book)!;
      await exportLineCard(payload, "limits", book);
      const joined = mock.drawn.join("");
      for (const text of [content.quote, content.title, content.byline, content.name, content.date]) expect(joined).toContain(text);
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
