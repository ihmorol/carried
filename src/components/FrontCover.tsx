"use client";

import { useState } from "react";
import { SPINE_COLORS, type SpineColor } from "@/lib/books";

/**
 * A book drawn as its front cover, 2:3, standing on the shelf ledge.
 * When a resolved cover image is present it fills the plate; otherwise the
 * book gets an authored typographic cover from its own book-cloth color —
 * labeled "Carried cover" so an original design never poses as the edition.
 * Artwork shading mirrors the approved preview study (design-preview/bookshelf.css).
 */
export function FrontCover({
  slug,
  title,
  author,
  spine,
  src,
  featured = false,
  className = "",
}: {
  slug: string;
  title: string;
  author: string;
  spine: SpineColor;
  src?: string;
  featured?: boolean;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src && failedSrc !== src);
  const cloth = SPINE_COLORS[spine] ?? SPINE_COLORS.charcoal;
  // Long titles step down so the fallback stays fully readable in the box.
  const titleSize = title.length > 26 ? "clamp(11px, 10cqi, 18px)" : title.length > 11 ? "clamp(11px, 11cqi, 19px)" : "clamp(14px, 16cqi, 28px)";

  return (
    <span className={`front-cover @container relative inline-block w-full align-bottom ${className}`} data-slug={slug}>
      <span
        className="front-cover-book relative isolate block aspect-2/3 w-full rounded-[1px_3px_3px_1px]"
        style={{
          boxShadow:
            "2px 3px 3px color-mix(in srgb, var(--color-ink) 12%, transparent), 8px 12px 17px color-mix(in srgb, var(--color-ink) 14%, transparent)",
        }}
      >
        {/* the page block peeking past the cloth at the fore-edge */}
        <span
          aria-hidden="true"
          className="absolute top-[4px] -right-[4px] bottom-[2px] left-[5px] -z-10 rounded-[0_3px_3px_0] border bg-[var(--color-paper-raised)]"
          style={{
            borderColor: "var(--color-rule)",
            boxShadow: "2px 0 0 color-mix(in srgb, var(--color-paper-raised) 70%, var(--color-rule))",
          }}
        />
        <span className="front-cover-face absolute inset-0 block overflow-hidden rounded-[inherit] bg-[var(--color-paper-raised)]">
          {showImage ? (
            // Native <img> on purpose: free archive scans, plain 2:3 plate.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="front-cover-image block h-full w-full object-contain"
              src={src}
              alt={`${title} by ${author}, front cover`}
              width={320}
              height={480}
              loading={featured ? "eager" : "lazy"}
              fetchPriority={featured ? "auto" : "low"}
              decoding="async"
              onError={() => setFailedSrc(src ?? null)}
            />
          ) : (
            <span
              className="front-cover-fallback absolute inset-0 flex flex-col overflow-hidden text-start"
              role="img"
              aria-label={`${title} by ${author}, Carried cover`}
              style={{ backgroundColor: cloth.bg, color: cloth.text, padding: "12% 11% 10% 13%" }}
            >
              <span className="font-medium" style={{ fontSize: "clamp(9px, 7cqi, 14px)", lineHeight: 1.5 }}>{author}</span>
              <span
                className="font-semibold"
                style={{ fontSize: titleSize, lineHeight: 1.3, marginTop: "9%", textWrap: "balance", overflowWrap: "anywhere" }}
              >
                {title}
              </span>
              <span aria-hidden="true" className="mt-auto block" style={{ width: "38%", height: "max(3px, 4cqi)", backgroundColor: cloth.deep }} />
            </span>
          )}
          {/* spine hinge + printed edge, shared by image and authored covers */}
          <span
            aria-hidden="true"
            className="front-cover-inset pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
            style={{
              border: "1px solid rgb(24 26 31 / 12%)",
              boxShadow: "inset 3px 0 0 rgb(24 26 31 / 12%), inset 5px 0 1px rgb(255 254 250 / 9%)",
            }}
          />
        </span>
      </span>
      <span
        className="front-cover-caption block text-start"
        style={{ height: 22, paddingTop: 7, fontSize: 10, lineHeight: 1.5, color: "var(--color-ink-soft)" }}
      >
        {showImage ? "" : "Carried cover"}
      </span>
    </span>
  );
}
