"use client";

import { useLocale } from "./LocaleProvider";

/** A translated text leaf — usable inside server components. */
export function T({ k, v }: { k: string; v?: Record<string, string | number> }) {
  const { t } = useLocale();
  return <>{t(k, v)}</>;
}

/** The বাংলা / EN switch, in the ledger's own voice. */
export function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div
      className="flex overflow-hidden rounded-full border border-[var(--color-rule)]"
      role="group"
      aria-label="Language / ভাষা"
    >
      {(["en", "bn"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
            locale === l
              ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
              : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          }`}
        >
          {l === "en" ? "EN" : "বাংলা"}
        </button>
      ))}
    </div>
  );
}
