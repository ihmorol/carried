import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cardFontFamily, cardPresentation } from "@/lib/card-presentation";
import { CARD_REGIONS, estimateTextWidth, fitText, graphemes, layoutCardText, wrapText } from "@/lib/text-layout";
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

describe("shared card content", () => {
  it("uses original titles and native authors independently of the quote script", () => {
    const content = cardPresentation(base, nativeBook)!;
    expect(content.title).toBe(nativeBook.titleBn);
    expect(content.author).toBe(nativeBook.authorBn);
    expect(content.byline).toBe("বাংলা লেখক · 2024");
    expect(content.date).toBe(formatStampDate(base.d));
    expect(content.quoteScript).toBe("latin");
    expect(content.titleScript).toBe("bengali");
  });
  it("dates follow quote script while signatures follow ONLY name script", () => {
    const banglaQuote = cardPresentation({ ...base, q: "বইটি carried with me", n: "Amara" }, nativeBook)!;
    expect(banglaQuote.date).toBe(formatStampDateBn(base.d));
    expect(banglaQuote.nameScript).toBe("latin");
    const banglaName = cardPresentation({ ...base, n: "অমরা" }, nativeBook)!;
    expect(banglaName.date).toBe(formatStampDate(base.d));
    expect(banglaName.nameScript).toBe("bengali");
    expect(cardFontFamily("bengali", "mono", "canvas")).toContain("Noto Sans Bengali Export");
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
    expect(html).not.toContain("line-clamp");
    expect(html).not.toContain("text-overflow:ellipsis");
    expect(html).toContain("No.");
  });
  it("StampMark never reinterprets an already formatted Bengali date", async () => {
    const { StampMark } = await import("@/components/StampMark");
    const date = formatStampDateBn(base.d);
    const html = renderToStaticMarkup(createElement(StampMark, { name: "Amara", date, ink: INKS.moss }));
    expect(html).toContain(date);
    expect(html).toContain("var(--font-fraunces)");
    expect(html).toContain("var(--font-noto-sans-bengali)");
  });
});

describe("word and grapheme safe region fitting", () => {
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
  it("retains tabs, repeated spaces and newlines", () => {
    const text = "one  two\tthree\nfour";
    expect(wrapText(text, 7, (value) => value.length).join("")).toBe(text);
  });
  it("fits valid limits inside non-overlapping PNG/OG regions with full text", () => {
    const inputs = [
      { ...base, q: "M".repeat(220), n: "W".repeat(24) },
      { ...base, q: "ব".repeat(220), n: "ব".repeat(24) },
      { ...base, q: "বাংলা and Latin, ".repeat(13).slice(0, 220), n: "Amara অমরা" },
    ];
    const books = [
      { ...nativeBook, titleBn: "M".repeat(90), authorBn: "W".repeat(60) },
      { ...nativeBook, titleBn: "ব".repeat(90), authorBn: "ব".repeat(60) },
      nativeBook,
    ];
    for (const payload of inputs) for (const book of books) for (const surface of ["png", "og"] as const) {
      const content = cardPresentation(payload, book)!;
      const layout = layoutCardText(content, surface);
      for (const role of ["quote", "title", "byline", "name"] as const) {
        expect(layout[role].lines.join("")).toBe(content[role]);
        expect(layout[role].height).toBeLessThanOrEqual(CARD_REGIONS[surface][role].height);
        expect(layout[role].lines.every((text) => estimateTextWidth(text, layout[role].fontSize, role === "byline" ? "mono" : "serif") <= CARD_REGIONS[surface][role].width)).toBe(true);
      }
      const region = CARD_REGIONS[surface];
      expect(region.quote.y + region.quote.height).toBeLessThan(region.title.y);
      expect(region.title.y + region.title.height).toBeLessThanOrEqual(region.byline.y);
      if (surface === "png") {
        const angle = 6.5 * Math.PI / 180;
        const rotatedHalfHeight = (region.stamp.height * Math.cos(angle) + region.stamp.width * Math.sin(angle)) / 2;
        const center = region.stamp.y + region.stamp.height / 2;
        expect(center - rotatedHalfHeight).toBeGreaterThan(region.byline.y + region.byline.height);
        expect(center + rotatedHalfHeight).toBeLessThan(1280);
      }
      else expect(region.title.x + region.title.width).toBeLessThan(region.stamp.x);
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
describe("three accessible house inks", () => {
  it("body, metadata and normal-sized stamp text each meet 4.5:1", () => {
    expect(Object.keys(INKS)).toHaveLength(3);
    for (const ink of Object.values(INKS)) {
      expect(contrast(ink.text, ink.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(ink.soft, ink.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(ink.stamp, ink.bg)).toBeGreaterThanOrEqual(4.5);
    }
    expect(INKS.moss.stamp).toBe(INKS.midnight.stamp);
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
    expect(html).toContain('"Fraunces", "Noto Serif Bengali"'.replace(/"/g, "&quot;"));
  });
  it("unknown line/book uses the readable three-ink fallback rather than crashing", async () => {
    const { default: LineOg } = await import("@/app/l/[id]/opengraph-image");
    const { default: BookOg } = await import("@/app/b/[slug]/opengraph-image");
    ogStore.resolveLine.mockResolvedValue(undefined);
    ogStore.findBook.mockResolvedValue(undefined);
    for (const image of [await LineOg({ params: Promise.resolve({ id: "missing" }) }), await BookOg({ params: Promise.resolve({ slug: "missing" }) })]) {
      const html = renderToStaticMarkup((image as unknown as { element: ReactElement }).element);
      expect(html).toContain("CARRIED");
      expect(html).toContain("background-color:#faf6ea");
    }
  });
  it("book OG keeps native title and author readable", async () => {
    const { default: BookOg } = await import("@/app/b/[slug]/opengraph-image");
    ogStore.findBook.mockResolvedValue(nativeBook);
    const image = await BookOg({ params: Promise.resolve({ slug: nativeBook.slug }) });
    const html = renderToStaticMarkup((image as unknown as { element: ReactElement }).element);
    expect(html).toContain(nativeBook.titleBn);
    expect(html).toContain(nativeBook.authorBn);
    expect(html).toContain("Noto Serif Bengali");
    expect(html).toContain("Noto Sans Bengali");
  });
  it("encodes max-length Latin and mixed Bengali OG artwork with the real local renderer", async () => {
    const { default: OgImage } = await import("@/app/l/[id]/opengraph-image");
    const { ImageResponse } = await vi.importActual<typeof import("next/og")>("next/og");
    for (const quote of ["M".repeat(220), "বাংলা Latin mixed ".repeat(12).slice(0, 220)]) {
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
  it("ships static local OG fonts and caches file reads", async () => {
    const { loadOgFonts } = await import("@/lib/og-fonts");
    const fonts = loadOgFonts();
    expect(loadOgFonts()).toBe(fonts);
    expect(fonts.every((font) => font.data.byteLength > 0)).toBe(true);
    expect(fonts.map((font) => font.name)).toContain("Noto Serif Bengali");
    expect(fonts.map((font) => font.name)).toContain("Noto Sans Bengali");
  });
});

function mockCanvas() {
  const drawn: string[] = [];
  const ctx = {
    font: "", letterSpacing: "0px", fillText: vi.fn((value: string) => drawn.push(value)),
    measureText: vi.fn(function (this: { font: string }, value: string) {
      const size = Number(/(\d+)px/.exec(this.font)?.[1] ?? 20);
      return { width: estimateTextWidth(value, size, this.font.includes("Plex") || this.font.includes("Sans") ? "mono" : "serif") };
    }),
    fillRect: vi.fn(), strokeRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
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
  return { drawn, canvas, ctx, add, check, load };
}

describe("explicit canvas font registration", () => {
  it("loads every static face on cold export even when check misleadingly says true, then caches repeat export", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const mock = mockCanvas();
    const payload = { ...base, q: "বাংলা travels with me", n: "Amara" };
    await exportLineCard(payload, "first", nativeBook);
    expect(mock.load).toHaveBeenCalledTimes(11);
    expect(mock.add).toHaveBeenCalledTimes(11);
    expect(mock.check).not.toHaveBeenCalled();
    expect(mock.canvas.width).toBe(1080); expect(mock.canvas.height).toBe(1350);
    const content = cardPresentation(payload, nativeBook)!;
    for (const text of [content.quote, content.title, content.byline, content.name, content.date]) expect(mock.drawn).toContain(text);
    await exportLineCard(payload, "second", nativeBook);
    expect(mock.load).toHaveBeenCalledTimes(11);
    expect(mock.add).toHaveBeenCalledTimes(11);
  });
  it("exports every character at all input limits without ellipsis", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const mock = mockCanvas();
    const payload = { ...base, q: "M".repeat(220), n: "W".repeat(24) };
    const book = { ...nativeBook, titleBn: "ব".repeat(90), authorBn: "ব".repeat(60) };
    const content = cardPresentation(payload, book)!;
    await exportLineCard(payload, "limits", book);
    const joined = mock.drawn.join("");
    for (const text of [content.quote, content.title, content.byline, content.name, content.date]) expect(joined).toContain(text);
    const stampStart = mock.ctx.save.mock.invocationCallOrder[0];
    for (const call of mock.ctx.fillText.mock.calls) {
      expect(call[0]).not.toContain("…");
    }
    expect(stampStart).toBeGreaterThan(mock.ctx.stroke.mock.invocationCallOrder[0]);
  });
  it("waits for actual loads before measuring or drawing", async () => {
    vi.resetModules();
    const { exportLineCard } = await import("@/lib/canvas");
    const mock = mockCanvas();
    let finish!: () => void;
    mock.load.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    // Use one shared barrier for all faces.
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
