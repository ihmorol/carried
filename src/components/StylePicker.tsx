"use client";

import { INKS, type InkId } from "@/lib/inks";
import { CARD_FONTS, cssFamily, type CardFontId } from "@/lib/card-fonts";
import { PATTERNS, cardArtSvg, svgDataUri, type PatternId } from "@/lib/card-art";
import { STYLE_GROUPS, groupDefaults, type CardStyle, type StyleGroupId } from "@/lib/card-style";
import { useLocale } from "./LocaleProvider";

/**
 * The style studio in the composer: pick a collection, then its color,
 * pattern and typeface. Every click restyles the live proof at once.
 */
export function StylePicker({
  group,
  style,
  onGroup,
  onChange,
}: {
  group: StyleGroupId;
  style: CardStyle;
  onGroup: (g: StyleGroupId) => void;
  onChange: (s: CardStyle) => void;
}) {
  const { t, locale } = useLocale();
  const bn = locale === "bn";
  const g = STYLE_GROUPS.find((x) => x.id === group) ?? STYLE_GROUPS[0];
  const ink = INKS[style.ink];

  function shuffle() {
    const pick = <T,>(xs: T[], not: T): T => {
      const pool = xs.length > 1 ? xs.filter((x) => x !== not) : xs;
      return pool[Math.floor(Math.random() * pool.length)];
    };
    onChange({
      ink: pick(g.inks, style.ink),
      pattern: pick(g.patterns, style.pattern),
      font: pick(g.fonts, style.font),
    });
  }

  const label =
    "font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-ink-faint)]";
  const chip = (active: boolean) =>
    `rounded-[3px] border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stamp)] ${
      active
        ? "border-[var(--color-ink)] bg-[var(--color-paper-raised)] shadow-[inset_0_0_0_1px_var(--color-ink)]"
        : "border-[var(--color-rule)] hover:border-[var(--color-ink-soft)]"
    }`;

  return (
    <div className="mt-3 space-y-6">
      {/* collections */}
      <div>
        <div className="flex items-center justify-between">
          <p className={label}>{t("c.3.group")}</p>
          <button
            type="button"
            onClick={shuffle}
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            {t("c.3.shuffle")}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label={t("c.3.group")}>
          {STYLE_GROUPS.map((x) => {
            const active = x.id === group;
            return (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  onGroup(x.id);
                  onChange(groupDefaults(x.id));
                }}
                className={`${chip(active)} flex flex-col items-start gap-2 px-2.5 py-2 text-left`}
              >
                <span className="flex gap-0.5" aria-hidden="true">
                  {x.inks.map((id) => (
                    <span
                      key={id}
                      className="h-3 w-3 rounded-[2px] border"
                      style={{ backgroundColor: INKS[id].bg, borderColor: INKS[id].rule }}
                    />
                  ))}
                </span>
                <span
                  className={`font-mono text-[11px] uppercase tracking-[0.12em] ${
                    active ? "font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]"
                  }`}
                >
                  {bn ? x.labelBn : x.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--color-ink-soft)]">
          {bn ? g.blurbBn : g.blurb}
        </p>
      </div>

      {/* color */}
      <div>
        <p className={label}>
          {t("c.3.ink")}: <span className="text-[var(--color-ink-soft)]">{bn ? ink.labelBn : ink.label}</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t("c.3.ink")}>
          {g.inks.map((id: InkId) => {
            const k = INKS[id];
            const active = id === style.ink;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={bn ? k.labelBn : k.label}
                title={bn ? k.labelBn : k.label}
                onClick={() => onChange({ ...style, ink: id })}
                className={`${chip(active)} flex items-center gap-2 px-3 py-2`}
              >
                <span
                  aria-hidden="true"
                  className="relative inline-flex h-6 w-6 items-center justify-center rounded-full border"
                  style={{ backgroundColor: k.bg, borderColor: k.rule }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: k.stamp }} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
                  {bn ? k.labelBn : k.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* pattern */}
      <div>
        <p className={label}>{t("c.3.pattern")}</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t("c.3.pattern")}>
          {g.patterns.map((id: PatternId) => {
            const pat = PATTERNS[id];
            const active = id === style.pattern;
            const svg = cardArtSvg(id, ink, 160, 200);
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ ...style, pattern: id })}
                className={`${chip(active)} flex w-[84px] flex-col items-center gap-1.5 p-1.5`}
              >
                <span
                  aria-hidden="true"
                  className="block h-[80px] w-[64px] rounded-[2px] border"
                  style={{
                    backgroundColor: ink.bg,
                    borderColor: ink.rule,
                    backgroundImage: svg ? `url("${svgDataUri(svg)}")` : undefined,
                    backgroundSize: "100% 100%",
                    boxShadow: pat.frame ? undefined : `inset 0 0 0 3px ${ink.bg}, inset 0 0 0 4px ${ink.rule}`,
                  }}
                />
                <span className="text-center font-mono text-[10px] uppercase leading-tight tracking-[0.08em] text-[var(--color-ink-soft)]">
                  {bn ? pat.labelBn : pat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* typeface */}
      <div>
        <p className={label}>{t("c.3.font")}</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t("c.3.font")}>
          {g.fonts.map((id: CardFontId) => {
            const f = CARD_FONTS[id];
            const active = id === style.font;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ ...style, font: id })}
                className={`${chip(active)} flex w-[96px] flex-col items-center gap-1 px-2 py-2`}
              >
                <span
                  aria-hidden="true"
                  className="text-[var(--color-ink)]"
                  style={{
                    fontFamily: cssFamily(f),
                    fontStyle: f.quote.style,
                    fontWeight: f.quote.weight,
                    fontSize: 24 * f.scale,
                    lineHeight: 1.1,
                  }}
                >
                  Aa
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-ink-soft)]">
                  {bn ? f.labelBn : f.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
