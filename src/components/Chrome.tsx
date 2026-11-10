"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, Books, BookmarkSimple, House, List, Quotes, Tote, X } from "@phosphor-icons/react";
import { useLocale } from "./LocaleProvider";
import { SITE_NAME } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  return <Navigation key={pathname} pathname={pathname} />;
}

function Navigation({ pathname }: { pathname: string }) {
  const { t, locale, setLocale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileToggle = useRef<HTMLButtonElement>(null);
  const mobileNavigation = useRef<HTMLDivElement>(null);
  const mobileLinks = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    mobileLinks.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMobileOpen(false);
      mobileToggle.current?.focus();
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !mobileNavigation.current?.contains(event.target)) {
        setMobileOpen(false);
        mobileToggle.current?.focus();
      }
    };
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", outside);
    };
  }, [mobileOpen]);

  // Every rail button is a real page: the home workspace keeps its section
  // anchors (#shelf, #reader-lines) for jump links and legacy URLs.
  const links = [
    { href: "/", label: t("nav.home"), icon: House, active: pathname === "/" },
    { href: "/books", label: t("nav.shelf"), icon: Books, active: pathname === "/books" || pathname.startsWith("/b/") },
    { href: "/lines", label: t("nav.lines"), icon: Quotes, active: pathname === "/lines" || pathname.startsWith("/l/") },
    { href: "/shelf", label: t("nav.myLines"), icon: BookmarkSimple, active: pathname === "/shelf" },
    { href: "/shop", label: t("nav.shop"), icon: Tote, active: pathname.startsWith("/shop") },
  ];

  function closeMobileMenu() {
    if (mobileOpen) {
      setMobileOpen(false);
      mobileToggle.current?.focus();
    }
  }

  return (
    <>
      <a className="skip-link" href="#main-content">{t("nav.skip")}</a>
      <aside className="navigation-rail" data-expanded={expanded}>
        <Link href="/" className="rail-brand" aria-label={`${SITE_NAME} · ${t("nav.home")}`} title={SITE_NAME} onNavigate={closeMobileMenu}>
          <span className="rail-icon"><BookOpen size={26} weight="regular" aria-hidden="true" /></span>
          <span className="rail-label">{SITE_NAME}</span>
        </Link>
        <nav id="desktop-navigation" className="rail-links" aria-label={t("nav.main")}>
          {links.map(({ href, label, icon: Icon, active }) => (
            <Link key={href} href={href} className={`rail-link${active ? " is-active" : ""}`}
              aria-label={label} aria-current={active ? "page" : undefined}
              onNavigate={closeMobileMenu} title={expanded ? undefined : label}>
              <span className="rail-icon"><Icon size={23} weight="regular" aria-hidden="true" /></span>
              <span className="rail-label">{label}</span>
            </Link>
          ))}
        </nav>
        <button type="button" className="rail-toggle" aria-expanded={expanded} aria-controls="desktop-navigation"
          aria-label={t(expanded ? "nav.collapse" : "nav.expand")} title={t(expanded ? "nav.collapse" : "nav.expand")}
          onClick={() => setExpanded((value) => !value)}>
          <span className="rail-icon"><List size={23} weight="regular" aria-hidden="true" /></span>
          <span className="rail-label">{t("nav.menu")}</span>
        </button>
      </aside>
      <header className={`site-header${pathname === "/" ? " site-header--workspace" : ""}`}>
        <div className="header-inner">
          <div className="header-branding">
            <Link href="/" className="header-wordmark" aria-label={`${SITE_NAME} · ${t("nav.home")}`} onNavigate={closeMobileMenu}>{SITE_NAME}</Link>
            <span className="header-room">{t("shell.name")}</span>
          </div>
          <div className="header-actions">
            <span className="header-free">{t("shell.free")}</span>
            <div className="header-language" role="group" aria-label="Language / ভাষা">
              {(["en", "bn"] as const).map((language) => (
                <button key={language} type="button" lang={language} aria-pressed={locale === language} onClick={() => setLocale(language)}>
                  {language === "en" ? "EN" : "বাংলা"}
                </button>
              ))}
            </div>
            <div className="mobile-navigation" ref={mobileNavigation} onBlur={(event) => {
              if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setMobileOpen(false);
            }}>
              <button ref={mobileToggle} type="button" className="mobile-menu-toggle" aria-expanded={mobileOpen}
                aria-controls="mobile-navigation" aria-label={t(mobileOpen ? "nav.closeMenu" : "nav.openMenu")}
                onClick={() => setMobileOpen((value) => !value)}>
                {mobileOpen ? <X size={23} weight="regular" aria-hidden="true" /> : <List size={23} weight="regular" aria-hidden="true" />}
              </button>
              <nav ref={mobileLinks} id="mobile-navigation" hidden={!mobileOpen} aria-label={t("nav.main")}>
                {links.map(({ href, label, icon: Icon, active }) => (
                  <Link key={href} href={href} aria-current={active ? "page" : undefined}
                    onNavigate={closeMobileMenu}>
                    <span className="rail-icon"><Icon size={22} weight="regular" aria-hidden="true" /></span>{label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  const { t } = useLocale();
  const pathname = usePathname();
  return (
    <footer className={`site-footer${pathname === "/" ? " site-footer--workspace" : ""}`}>
      <div className="footer-inner">
        <p className="footer-signature">{SITE_NAME}<span>{t("brand.tagline")}</span></p>
        <nav aria-label="Footer">
          <Link href="/books">{t("footer.pick")}</Link>
          <Link href="/shelf">{t("footer.mine")}</Link>
          <Link href="/lines">{t("nav.lines")}</Link>
          <Link href="/shop">{t("nav.shop")}</Link>
          <a href="https://github.com/ihmorol/carried" target="_blank" rel="noopener noreferrer">{t("footer.source")}<ArrowUpRight size={14} weight="regular" aria-hidden="true" /></a>
        </nav>
      </div>
    </footer>
  );
}
