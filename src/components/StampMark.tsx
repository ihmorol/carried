import { formatStampDate } from "@/lib/line";
import type { Ink } from "@/lib/inks";
import { cssFamily, type CardFont } from "@/lib/card-fonts";
import { isBengali } from "@/lib/line";

/**
 * The rubber stamp, the ownership moment. Ink-textured via mask,
 * slightly crooked, always in stamp red (or the ink's stamp color).
 */
export function StampMark({
  name,
  date,
  ink,
  font,
  animate = false,
  scale = 1,
}: {
  name: string;
  date: string;
  ink: Ink;
  /** the card typeface; the signature is set in it */
  font?: CardFont;
  animate?: boolean;
  scale?: number;
}) {
  return (
    <div
      className={`inline-flex flex-col items-center justify-center rounded-md border-[2.5px] px-4 py-2.5 text-center ${
        animate ? "animate-stamp-in" : ""
      } stamp-ink`}
      style={{
        color: ink.stamp,
        borderColor: ink.stamp,
        transform: animate ? undefined : "rotate(-6.5deg)",
        opacity: 0.88,
        minWidth: 148 * scale,
        padding: `${10 * scale}px ${16 * scale}px`,
        borderRadius: 6 * scale,
        borderWidth: 2.5 * scale,
      }}
      aria-label={`Carried by ${name}`}
    >
      <span
        className="font-mono font-semibold uppercase"
        style={{ fontSize: 9 * scale, letterSpacing: "0.28em" }}
      >
        Carried by
      </span>
      <span
        className="font-serif font-semibold leading-tight"
        style={{
          ...(font && font.id !== "fraunces" && !isBengali(name)
            ? {
                fontFamily: cssFamily(font),
                fontWeight: font.name.weight,
                fontStyle: font.name.style,
              }
            : {}),
          fontSize: 20 * scale * (font && !isBengali(name) ? font.scale : 1),
          letterSpacing: "0.02em",
          marginTop: 2 * scale,
          maxWidth: 220 * scale,
        }}
      >
        {name}
      </span>
      <span
        className="font-mono font-medium uppercase"
        style={{ fontSize: 8 * scale, letterSpacing: "0.22em", marginTop: 2 * scale }}
      >
        {formatStampDate(date)}
      </span>
    </div>
  );
}
