"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cardArtSvg, svgDataUri, type PatternId } from "@/lib/card-art";
import type { Ink } from "@/lib/inks";

/**
 * Paints a card pattern behind the DOM card. It measures the card and
 * renders the exact SVG the canvas export and the OG image use, at the
 * card's real pixel size, so the artwork never stretches.
 */
export function CardArt({ pattern, ink }: { pattern: PatternId; ink: Ink }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      // layout size, not the bounding box: tilted cards report a larger box
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const svg = size && size.w > 0 && size.h > 0 ? cardArtSvg(pattern, ink, size.w, size.h) : null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      style={
        svg
          ? { backgroundImage: `url("${svgDataUri(svg)}")`, backgroundSize: "100% 100%" }
          : undefined
      }
    />
  );
}
