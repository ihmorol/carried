import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { INKS, INK_IDS, isInkId, type InkId } from "@/lib/inks";
import { CARD_FONTS, CARD_FONT_IDS, isCardFontId } from "@/lib/card-fonts";
import { PATTERN_IDS, cardArtSvg, isPatternId, type PatternId } from "@/lib/card-art";
import { STYLE_GROUPS } from "@/lib/card-style";
import { encodeLine, decodeLine, encodePayload, LineError, type LinePayload } from "@/lib/line";
import { validateLineInput, StoreError, MemoryStore, type LineInput } from "@/lib/store";
import type { CardFontId } from "@/lib/card-fonts";

/* ── WCAG relative luminance / contrast ── */

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

describe("style collections", () => {
  it("puts every ink in exactly one collection", () => {
    for (const id of INK_IDS) {
      const owners = STYLE_GROUPS.filter((g) => g.inks.includes(id));
      expect(owners.map((g) => g.id), id).toHaveLength(1);
    }
  });

  it("lists only valid ids, at least three of each", () => {
    for (const g of STYLE_GROUPS) {
      for (const i of g.inks) expect(isInkId(i), `${g.id} ink ${i}`).toBe(true);
      for (const p of g.patterns) expect(isPatternId(p), `${g.id} pattern ${p}`).toBe(true);
      for (const f of g.fonts) expect(isCardFontId(f), `${g.id} font ${f}`).toBe(true);
      expect(g.inks.length, g.id).toBeGreaterThanOrEqual(3);
      expect(g.patterns.length, g.id).toBeGreaterThanOrEqual(3);
      expect(g.fonts.length, g.id).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("ink contrast (WCAG)", () => {
  it.each(INK_IDS)("%s reads clearly", (id) => {
    const ink = INKS[id];
    expect(contrast(ink.text, ink.bg), `${id} text/bg`).toBeGreaterThanOrEqual(7);
    expect(contrast(ink.soft, ink.bg), `${id} soft/bg`).toBeGreaterThanOrEqual(3);
    expect(contrast(ink.stamp, ink.bg), `${id} stamp/bg`).toBeGreaterThanOrEqual(3);
  });
});

describe("payload style fields", () => {
  const base = {
    bookSlug: "the-alchemist",
    text: "The treasure was never behind the dunes.",
    name: "Amara",
    ink: "paper" as const,
    date: "2026-01-12",
  };
  const legacy: LinePayload = {
    v: 1,
    b: base.bookSlug,
    q: base.text,
    n: base.name,
    s: base.ink,
    d: base.date,
  };

  it("keeps pre-collection ids byte-identical", () => {
    const { id, payload } = encodeLine(base);
    expect(id).toBe(encodePayload(legacy));
    expect("p" in payload).toBe(false);
    expect("f" in payload).toBe(false);
  });

  it("omits the default pattern and face", () => {
    const { id, payload } = encodeLine({ ...base, pattern: "classic", font: "fraunces" });
    expect(id).toBe(encodePayload(legacy));
    expect("p" in payload).toBe(false);
    expect("f" in payload).toBe(false);
  });

  it("round-trips a chosen pattern and face", () => {
    const { id, payload } = encodeLine({ ...base, pattern: "deco", font: "caveat" });
    expect(payload.p).toBe("deco");
    expect(payload.f).toBe("caveat");
    expect(decodeLine(id)).toEqual(payload);
  });

  it("rejects unknown patterns and faces", () => {
    const badP = encodePayload({ ...legacy, p: "glitter" as PatternId });
    const badF = encodePayload({ ...legacy, f: "comic-sans" as CardFontId });
    expect(() => decodeLine(badP)).toThrow(LineError);
    expect(() => decodeLine(badF)).toThrow(LineError);
  });
});

describe("store style validation", () => {
  const input: LineInput = { q: "A line worth carrying.", n: "Amara", s: "paper" };

  it("rejects unknown p/f with a 400", () => {
    for (const bad of [
      { ...input, p: "glitter" as PatternId },
      { ...input, f: "comic-sans" as CardFontId },
    ]) {
      try {
        validateLineInput(bad);
        expect.unreachable();
      } catch (e) {
        expect(e).toBeInstanceOf(StoreError);
        expect((e as StoreError).status).toBe(400);
      }
    }
  });

  it("passes valid p/f through and drops defaults", () => {
    expect(validateLineInput({ ...input, p: "botanical", f: "playfair" })).toMatchObject({
      p: "botanical",
      f: "playfair",
    });
    const plain = validateLineInput({ ...input, p: "classic", f: "fraunces" });
    expect(plain.p).toBeUndefined();
    expect(plain.f).toBeUndefined();
  });

  it("MemoryStore keeps p/f in the payload", async () => {
    const store = new MemoryStore();
    const rec = await store.addLine("the-alchemist", { ...input, s: "kraft", p: "letterpress", f: "cormorant" });
    expect(rec.payload.s).toBe("kraft");
    expect(rec.payload.p).toBe("letterpress");
    expect(rec.payload.f).toBe("cormorant");
    expect(await store.getLineById(rec.id)).toEqual(rec.payload);
  });
});

describe("card art", () => {
  const sizes: [number, number][] = [
    [320, 420],
    [1080, 1350],
    [1200, 630],
  ];
  const sampleInks: InkId[] = ["paper", "midnight", "mustard", "onyx", "cotton"];

  it("classic draws nothing extra", () => {
    for (const [w, h] of sizes) expect(cardArtSvg("classic", INKS.paper, w, h)).toBeNull();
  });

  it("every other pattern renders a clean flat SVG", () => {
    for (const id of PATTERN_IDS.filter((p) => p !== "classic")) {
      for (const inkId of sampleInks) {
        for (const [w, h] of sizes) {
          const svg = cardArtSvg(id, INKS[inkId], w, h);
          const where = `${id}/${inkId}/${w}x${h}`;
          expect(typeof svg, where).toBe("string");
          expect(svg!.startsWith("<svg"), where).toBe(true);
          expect(svg, where).not.toContain("NaN");
          expect(svg, where).not.toMatch(/Gradient/i);
        }
      }
    }
  });
});

describe("card fonts", () => {
  it("ships every face in public/fonts", () => {
    for (const id of CARD_FONT_IDS) {
      const f = CARD_FONTS[id];
      for (const spec of [f.quote, f.name]) {
        expect(existsSync(join(process.cwd(), "public", "fonts", spec.file)), `${id}: ${spec.file}`).toBe(true);
      }
    }
  });
});
