import { SPINE_COLORS, originalName, type Book, spineHeight } from "@/lib/books";
import { leanFor, ryFor } from "@/lib/tilt";

/**
 * A book drawn as a book-cloth spine, top-to-bottom title, author at the foot.
 * Pure CSS, so the whole shelf renders instantly and nothing can 404.
 * On the shelf it stands in 3D, seen a hair off square (a few books lean);
 * a hovering reader pulls it forward off the shelf. The fore-edge shows a
 * sliver of pages. Compact spines stay flat.
 */
export function BookSpine({
  book,
  className = "",
  height,
  compact = false,
}: {
  book: Book;
  className?: string;
  height?: number;
  compact?: boolean;
}) {
  const c = SPINE_COLORS[book.spine];
  const h = height ?? spineHeight(book);

  if (compact) {
    return (
      <div
        className={`relative flex flex-col items-center justify-between overflow-hidden rounded-[3px] ${className}`}
        style={{
          backgroundColor: c.bg,
          color: c.text,
          height: h,
          width: 26,
          backgroundImage:
            "linear-gradient(90deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 9%, rgba(255,255,255,0.10) 26%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.22) 100%)",
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
            style={{ fontSize: 9.5, letterSpacing: "0.02em", maxWidth: h - 10 }}
          >
            {originalName(book)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`spine-3d relative flex flex-col items-center justify-between overflow-hidden rounded-[3px] ${className}`}
      style={
        {
          backgroundColor: c.bg,
          color: c.text,
          height: h,
          width: 96,
          backgroundImage:
            "linear-gradient(90deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 9%, rgba(255,255,255,0.10) 26%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.22) 100%)",
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
          style={{ fontSize: 15, letterSpacing: "0.02em" }}
        >
          {originalName(book)}
        </span>
      </div>
      <span
        className="w-full text-center font-mono leading-tight opacity-80"
        style={{ fontSize: 8.5, letterSpacing: "0.06em" }}
      >
        {book.author}
      </span>
      <span
        className="font-mono opacity-60"
        style={{ fontSize: 8 }}
      >
        {book.year < 0 ? `${Math.abs(book.year)} BC` : book.year}
      </span>
    </div>
  );
}
