import { cardFontFamily, cardScript } from "@/lib/card-presentation";
import { formatStampDate } from "@/lib/line";
import type { Ink } from "@/lib/inks";

/** Crooked ownership stamp; date is already selected by cardPresentation.
 * Accept raw ISO dates for existing non-card callers, without reformatting
 * a Bengali date based on the reader's name. */
export function StampMark({ name, date, ink, animate = false, scale = 1 }: {
  name: string; date: string; ink: Ink; animate?: boolean; scale?: number;
}) {
  const nameScript = cardScript(name);
  const stampDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? formatStampDate(date) : date;
  const dateScript = cardScript(stampDate);
  return (
    <div className={`inline-flex flex-col items-center justify-center rounded-md border-[2.5px] text-center ${animate ? "animate-stamp-in" : ""}`}
      style={{ color: ink.stamp, borderColor: ink.stamp, transform: animate ? undefined : "rotate(-6.5deg)",
        width: "min(90%, 260px)", minWidth: 0, padding: `${10 * scale}px ${16 * scale}px`,
        borderRadius: 6 * scale, borderWidth: 2.5 * scale }} aria-label={`Carried by ${name}, ${stampDate}`}>
      <span className="font-mono font-semibold uppercase"
        style={{ fontSize: 9 * scale, letterSpacing: "0.28em" }}>Carried by</span>
      <span lang={nameScript === "bengali" ? "bn" : "en"} className="font-serif font-semibold"
        style={{ fontFamily: cardFontFamily(nameScript, "serif", "dom"), fontSize: 20 * scale,
          lineHeight: nameScript === "bengali" ? 1.6 : 1.3, marginTop: 2 * scale,
          width: "100%", minWidth: 0, overflowWrap: "anywhere" }}>
        {name}
      </span>
      <span lang={dateScript === "bengali" ? "bn" : "en"} className="font-mono font-medium"
        style={{ fontFamily: cardFontFamily(dateScript, "mono", "dom"), fontSize: 8 * scale,
          letterSpacing: dateScript === "bengali" ? 0 : "0.22em", lineHeight: 1.65, marginTop: 2 * scale,
          width: "100%", minWidth: 0, overflowWrap: "anywhere" }}>
        {stampDate}
      </span>
    </div>
  );
}
