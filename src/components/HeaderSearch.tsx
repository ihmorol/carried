"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useLocale } from "./LocaleProvider";

/** The header and catalog share their URL state; replaceState alone does not
 * notify another mounted search control, so both listen to the same event. */
export function HeaderSearch({ catalog }: { catalog: boolean }) {
  const { t } = useLocale();
  const router = useRouter();
  const id = useId();
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const restore = () => setQuery(catalog ? new URL(window.location.href).searchParams.get("q") ?? "" : "");
    void Promise.resolve().then(() => { if (mounted) restore(); });
    window.addEventListener("popstate", restore);
    window.addEventListener("carried:search", restore);
    return () => {
      mounted = false;
      window.removeEventListener("popstate", restore);
      window.removeEventListener("carried:search", restore);
    };
  }, [catalog]);

  function change(value: string) {
    setQuery(value);
    if (!catalog) return;
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("q", value); else url.searchParams.delete("q");
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event("carried:search"));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!catalog) {
      router.push(`/books${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}#shelf`);
      return;
    }
    const shelf = document.getElementById("shelf");
    shelf?.scrollIntoView({ block: "start", behavior: "instant" });
    shelf?.focus({ preventScroll: true });
  }

  return (
    <form className="header-search" role="search" onSubmit={submit}>
      <label htmlFor={id} className="sr-only">{t("shelf.searchLabel")}</label>
      <input id={id} type="search" value={query} onChange={(event) => change(event.target.value)}
        placeholder={t("header.searchPlaceholder")} autoComplete="off" />
      <button type="submit" aria-label={t("header.searchSubmit")}>
        <MagnifyingGlass size={21} weight="regular" aria-hidden="true" />
      </button>
    </form>
  );
}
