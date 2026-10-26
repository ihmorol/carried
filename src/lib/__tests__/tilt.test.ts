import { describe, expect, it } from "vitest";
import { hashStr, leanFor, ryFor, tiltFor } from "../tilt";

describe("hashStr", () => {
  it("is deterministic", () => {
    expect(hashStr("carried")).toBe(hashStr("carried"));
    expect(hashStr("")).toBe(hashStr(""));
  });

  it("stays in a fixed range", () => {
    for (let i = 0; i < 500; i++) {
      const h = hashStr(`line-${i}`);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(4294967296);
    }
  });

  it("spreads sequential ids apart", () => {
    const buckets = new Set(Array.from({ length: 50 }, (_, i) => hashStr(`line-${i}`) % 100));
    expect(buckets.size).toBeGreaterThan(25);
  });
});

describe("tiltFor", () => {
  it("returns the same angle for the same id", () => {
    expect(tiltFor("amar-bondhu-rashed-1a044")).toBe(
      tiltFor("amar-bondhu-rashed-1a044"),
    );
  });

  it("stays within half the spread", () => {
    for (let i = 0; i < 500; i++) {
      const t = tiltFor(`line-${i}`, 3.4);
      expect(Math.abs(t)).toBeLessThanOrEqual(1.7);
    }
  });

  it("does not deal every card the same angle", () => {
    const angles = new Set(Array.from({ length: 50 }, (_, i) => tiltFor(`line-${i}`)));
    expect(angles.size).toBeGreaterThan(10);
  });

  it("rounds to a tenth of a degree", () => {
    for (let i = 0; i < 100; i++) {
      const t = tiltFor(`line-${i}`);
      expect(Number(t.toFixed(1))).toBe(t);
    }
  });
});

describe("ryFor", () => {
  it("sits between -15 and -10 degrees", () => {
    for (let i = 0; i < 300; i++) {
      const r = ryFor(`book-${i}`);
      expect(r).toBeGreaterThanOrEqual(-15);
      expect(r).toBeLessThanOrEqual(-10);
    }
  });
});

describe("leanFor", () => {
  it("leans roughly one book in eight, always left", () => {
    const leans = Array.from({ length: 800 }, (_, i) => leanFor(`slug-${i}`)).filter(
      (l) => l !== 0,
    );
    expect(leans.length).toBeGreaterThan(60);
    expect(leans.length).toBeLessThan(140);
    expect(leans.every((l) => l === -4)).toBe(true);
  });
});
