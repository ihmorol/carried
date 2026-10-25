"use client";

import Link from "next/link";
import { useLocale } from "./LocaleProvider";
import { LocaleToggle } from "./T";
import { SITE_NAME } from "@/lib/site";

export function Header() {
  const { t } = useLocale();
  return (
    <header
      className="border-b"
      style={{ borderColor: "var(--color-rule)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-baseline gap-2.5" aria-label={`${SITE_NAME} home`}>
          <span
            className="inline-block h-2.5 w-2.5 rounded-[2px]"
            style={{ backgroundColor: "var(--color-stamp)" }}
            aria-hidden="true"
          />
          <span
            className="font-serif text-xl font-semibold tracking-[0.14em]"
          >
            {SITE_NAME.toUpperCase()}
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-soft)] lg:inline">
            {t("brand.tagline")}
          </span>
        </Link>
        <nav className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.14em]">
          <Link href="/#shelf" className="link-ledger hidden text-[var(--color-ink)] sm:inline">
            {t("nav.shelf")}
          </Link>
          <Link href="/shelf" className="link-ledger text-[var(--color-ink)]">
            {t("nav.myLines")}
          </Link>
          <Link
            href="/#shelf"
            className="btn-press hidden rounded-[3px] bg-[var(--color-ink)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-paper)] hover:opacity-85 md:inline-block"
          >
            {t("nav.write")}
          </Link>
          <LocaleToggle />
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  const { t } = useLocale();
  return (
    <footer
      className="mt-24 border-t"
      style={{ borderColor: "var(--color-rule)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-ink-soft)] sm:flex-row sm:items-center sm:justify-between">
        <p>{t("footer.tag")}</p>
        <p className="flex gap-5">
          <Link href="/#shelf" className="link-ledger">
            {t("footer.pick")}
          </Link>
          <Link href="/shelf" className="link-ledger">
            {t("footer.mine")}
          </Link>
          <a
            href="https://github.com/ihmorol/carried"
            className="link-ledger"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("footer.source")}
          </a>
        </p>
      </div>
    </footer>
  );
}
