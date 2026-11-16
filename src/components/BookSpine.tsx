import { SPINE_COLORS, originalName, type Book, spineHeight } from "@/lib/books";
import { isBengali } from "@/lib/line";
import { leanFor, ryFor } from "@/lib/tilt";

/**
 * Authored cloth, without image lookups. Shelf spines have separate physical
 * planes and a full-height title; the shelf link carries readable metadata.
 * Existing detail and compact search spines retain their original dimensions.
 */
export function BookSpine({
  book,
  className = "",
  height,
  compact = false,
  variant = "default",
}: {
  book: Book;
  className?: string;
  height?: number;
  compact?: boolean;
  variant?: "default" | "shelf";
}) {
  const c = SPINE_COLORS[book.spine];
  const h = height ?? spineHeight(book);
  const cloth = {
    backgroundColor: c.bg,
    color: c.text,
  };

  if (compact) {
    return (
      <div
        className={`relative flex flex-col items-center justify-between overflow-hidden rounded-[3px] ${className}`}
        style={{
          ...cloth,
          height: h,
          width: 26,
          boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.18), 0 1px 2px rgba(28,22,12,0.25)",
        }}
        aria-hidden="true"
      >
        <div
          className="flex flex-1 items-center justify-center py-1"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          <span
            className="font-serif font-semibold leading-none"
            style={{ fontSize: 9.5, letterSpacing: "normal", maxWidth: h - 10 }}
          >
            {originalName(book)}
          </span>
        </div>
      </div>
    );
  }

  if (variant === "shelf") {
    const title = originalName(book);
    const longTitle = title.length > 50;
    const shelfHeight = Math.max(238, Math.min(332, height ?? spineHeight(book, longTitle ? 316 : 238, 332)));
    return (
      <span
        className={`book-spine book-spine--shelf ${className}`}
        style={{
          "--spine-cloth": c.bg,
          "--spine-ink": c.text,
          "--spine-deep": c.deep,
          "--spine-height": `${shelfHeight}px`,
          "--spine-title-size": `${longTitle ? 14 : title.length > 30 ? 16 : 18}px`,
          "--ry": `${ryFor(book.slug)}deg`,
          "--lean": `${leanFor(book.slug)}deg`,
        } as React.CSSProperties}
        aria-hidden="true"
      >
        <span className="book-spine-back" />
        <span className="book-spine-pages" />
        <span className="book-spine-top" />
        <span className="book-spine-face">
          <span className="book-spine-title" lang={isBengali(title) ? "bn" : "en"}>{title}</span>
        </span>
      </span>
    );
  }

  return (
    <div
      className={`spine-3d relative flex flex-col items-center justify-between overflow-hidden rounded-[3px] ${className}`}
      style={
        {
          ...cloth,
          height: h,
          width: 96,
          boxShadow:
            "inset 0 -6px 0 rgba(0,0,0,0.18), 0 2px 3px rgba(28,22,12,0.22), 0 16px 26px -12px rgba(28,22,12,0.30)",
          "--ry": `${ryFor(book.slug)}deg`,
          "--lean": `${leanFor(book.slug)}deg`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      {/* fore-edge: the page block peeking past the cloth */}
      <span
        aria-hidden="true"
        className="absolute bottom-1 right-0 top-1 w-[5px]"
        style={{
          backgroundColor: "var(--color-paper)",
          borderLeft: "1px solid rgba(28,22,12,0.16)",
          borderRight: "1px solid rgba(28,22,12,0.28)",
        }}
      />
      {/* head & foot bands, like stamped cloth */}
      <div
        className="h-1.5 w-6 rounded-sm"
        style={{ backgroundColor: "rgba(0,0,0,0.14)" }}
      />
      <div
        className="flex flex-1 items-center justify-center py-2"
        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
      >
        <span
          className="font-serif font-semibold leading-none"
          style={{ fontSize: 15, letterSpacing: "normal", lineHeight: 1.15 }}
        >
          {originalName(book)}
        </span>
      </div>
      <span
        className="w-full text-center font-sans leading-tight"
        style={{ fontSize: 10, letterSpacing: "normal" }}
      >
        {book.author}
      </span>
      <span
        className="font-sans"
        style={{ fontSize: 10 }}
      >
        {book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}
      </span>
    </div>
  );
}
