"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LOCALE_COOKIE, translate, type Locale } from "@/lib/i18n";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleCtx = createContext<Ctx | null>(null);

/**
 * Region-based language: the middleware guesses from geo + Accept-Language
 * and stores a cookie; this provider reads the cookie (falling back to the
 * browser's language), lets the reader switch any time, and marks <html>
 * with the right lang + font class so Bangla typography applies globally.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const cookieMatch = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=(\\w+)`));
      const stored = window.localStorage.getItem(LOCALE_COOKIE);
      const saved = (stored ?? cookieMatch?.[1]) as Locale | undefined;
      let next: Locale = "en";
      if (saved === "bn" || saved === "en") next = saved;
      else if (/^bn\b/i.test(navigator.language)) next = "bn";
      else if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Dhaka") next = "bn";
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
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
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
