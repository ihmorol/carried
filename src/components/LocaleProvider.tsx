"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LOCALE_COOKIE, translate, type Locale } from "@/lib/i18n";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleCtx = createContext<Ctx | null>(null);

/** Device-local preference, then browser language/timezone. No locale cookies. */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      let legacy: string | undefined;
      try {
        legacy = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${LOCALE_COOKIE}=`))?.slice(LOCALE_COOKIE.length + 1);
      } catch { /* Cookie access may also be blocked. */ }
      let stored: string | null = null;
      try { stored = window.localStorage.getItem(LOCALE_COOKIE); } catch { /* Session language still works. */ }
      const saved = stored === "bn" || stored === "en" ? stored : legacy;
      let next: Locale = "en";
      if (saved === "bn" || saved === "en") next = saved;
      else if ((navigator.languages ?? [navigator.language]).some((language) => /^bn(?:-|$)/i.test(language))) next = "bn";
      else {
        try { if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Dhaka") next = "bn"; } catch { /* English default. */ }
      }
      if (legacy !== undefined) {
        try {
          if (!stored && (legacy === "en" || legacy === "bn")) window.localStorage.setItem(LOCALE_COOKIE, legacy);
        } catch { /* Session only. */ }
        // Only expire our known previous cookie, never touch other cookies.
        try { document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0; samesite=lax`; } catch { /* Blocked. */ }
      }
      setLocaleState(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.classList.toggle("locale-bn", locale === "bn");
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(LOCALE_COOKIE, l);
    } catch {
      /* private mode, session-only locale */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): Ctx {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
