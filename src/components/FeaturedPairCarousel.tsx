"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { originalName, SPINE_COLORS } from "@/lib/books";
import { numFor } from "@/lib/i18n";
import { isBengali } from "@/lib/line";
import type { FeaturedPair } from "@/lib/featured-pair";
import { FrontCover } from "./FrontCover";
import { LineCard } from "./LineCard";
import { RoomMotionControl, useRoomMotion } from "./ReadingRoom";
import { TiltCard } from "./TiltCard";
import { useLocale } from "./LocaleProvider";

const LineDrawer = dynamic(() => import("./LineDrawer"));
const ROTATION_MS = 9000;

/** One keyed slide carries the book, line and every destination together. */
export function FeaturedPairCarousel({ pairs }: { pairs: FeaturedPair[] }) {
  const { t, locale } = useLocale();
  const { paused, reduced, pause } = useRoomMotion();
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const [inView, setInView] = useState(true);
  const [openedPair, setOpenedPair] = useState<FeaturedPair | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const root = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement>(null);
  const pair = pairs[active % Math.max(1, pairs.length)];

  useEffect(() => {
    let mounted = true;
    const sync = () => setVisible(!document.hidden);
    void Promise.resolve().then(() => { if (mounted) sync(); });
    document.addEventListener("visibilitychange", sync);
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, { threshold: 0.2 }) : null;
    if (root.current) observer?.observe(root.current);
    return () => { mounted = false; document.removeEventListener("visibilitychange", sync); observer?.disconnect(); };
  }, []);

  const rotating = pairs.length > 1 && !paused && !reduced && !hovered && !drawerOpen && visible && inView;
  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => {
      setManual(false);
      setDirection(1);
      setActive((value) => (value + 1) % pairs.length);
    }, ROTATION_MS);
    return () => clearTimeout(timer);
  }, [active, pairs.length, rotating]);

  if (!pair) return null;
  const title = originalName(pair.book);
  const cloth = SPINE_COLORS[pair.book.spine];
  const position = `${numFor(active + 1, locale)} / ${numFor(pairs.length, locale)}`;

  function move(step: number) {
    pause();
    setManual(true);
    setDirection(step);
    setActive((value) => (value + step + pairs.length) % pairs.length);
  }

  function inspect(event: React.MouseEvent<HTMLAnchorElement>, selected: FeaturedPair) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    returnFocus.current = event.currentTarget;
    pause();
    setOpenedPair(selected);
    setDrawerOpen(true);
  }

  return (
    <section ref={root} className="featured-carousel" aria-roledescription="carousel" aria-label={t("hero.carousel")}
      data-rotating={rotating} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (!(event.target as HTMLElement).closest(".room-motion-toggle")) pause();
      }}>
      <div className="featured-heading">
        <h1>{t("home.welcome")}</h1>
        <div className="featured-navigation">
          <RoomMotionControl />
          <span className="featured-position" aria-live={manual ? "polite" : "off"}>{position}</span>
          <button type="button" onClick={() => move(-1)} disabled={pairs.length < 2} aria-label={t("hero.previous")}><ArrowLeft size={21} aria-hidden="true" /></button>
          <button type="button" onClick={() => move(1)} disabled={pairs.length < 2} aria-label={t("hero.next")}><ArrowRight size={21} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="featured-stage" style={{ "--feature-cloth": cloth.bg, "--feature-deep": cloth.deep } as CSSProperties}>
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div key={pair.line.id} className="featured-pair" role="group" aria-roledescription="slide"
            aria-label={`${position}: ${title}`} custom={direction}
            initial={{ opacity: reduced ? 1 : 0, transform: reduced ? "none" : `translateX(${direction * 24}px)` }}
            animate={{ opacity: 1, transform: "translateX(0px)" }}
            exit={{ opacity: 0, transform: reduced ? "none" : `translateX(${direction * -16}px)` }}
            transition={{ duration: reduced ? 0.1 : 0.32, ease: [0.16, 1, 0.3, 1] }}>
            <div className="featured-volume-column">
              <div className="featured-volume-mat">
                <span className="featured-volume-ground" aria-hidden="true" />
                <Link href={`/l/${pair.line.id}`} className="featured-volume-trigger" onClick={(event) => inspect(event, pair)} aria-label={t("hero.inspectBook", { title })}>
                  <span className="featured-volume-object">
                    <span className="featured-volume-back" aria-hidden="true" />
                    <span className="featured-volume-pages" aria-hidden="true" />
                    <span className="featured-volume-spine" aria-hidden="true"><span>{title}</span></span>
                    <FrontCover slug={pair.book.slug} title={title} author={pair.book.authorBn ?? pair.book.author} spine={pair.book.spine} src={pair.cover} featured />
                  </span>
                </Link>
              </div>
              <div className="featured-book-caption">
                <div>
                  <h2 lang={isBengali(title) ? "bn" : "en"}>{title}</h2>
                  <p>{pair.book.authorBn ?? pair.book.author}<span> · {numFor(pair.book.year, locale)}</span></p>
                </div>
                <Link href={`/b/${pair.book.slug}`} className="featured-book-open" aria-label={t("home.openBook")}><ArrowUpRight size={23} aria-hidden="true" /></Link>
              </div>
            </div>
            <div className="featured-line-column">
              <Link href={`/l/${pair.line.id}`} className="featured-line-trigger" onClick={(event) => inspect(event, pair)} aria-label={t("hero.inspectLine", { name: pair.line.n })}>
                <div className="featured-line-mat">
                  <div className="featured-line-artwork">
                    <TiltCard land>
                      <LineCard payload={pair.line} id={pair.line.id} book={pair.book} actions={false} />
                    </TiltCard>
                  </div>
                  <div className="featured-mobile-quote">
                    <blockquote lang={isBengali(pair.line.q) ? "bn" : "en"}>{pair.line.q}</blockquote>
                    <p>{pair.line.n}<ArrowUpRight size={18} aria-hidden="true" /></p>
                  </div>
                </div>
              </Link>
              <div className="featured-line-actions">
                <p>{t("home.featured")}</p>
                <Link href={`/b/${pair.book.slug}#write`} className="ui-button">{t("nav.write")}<ArrowRight size={18} aria-hidden="true" /></Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="featured-picker" aria-label={t("hero.chooseBook")}>
        {pairs.map((item, index) => (
          <button key={item.line.id} type="button" aria-pressed={active === index} onClick={() => { pause(); setManual(true); setDirection(index > active ? 1 : -1); setActive(index); }}>
            <span className="featured-picker-binding" style={{ backgroundColor: SPINE_COLORS[item.book.spine].bg }} aria-hidden="true" />
            <span>{originalName(item.book)}</span>
          </button>
        ))}
      </div>
      {openedPair && <LineDrawer pair={openedPair} open={drawerOpen} onOpenChange={setDrawerOpen} returnFocus={returnFocus} />}
    </section>
  );
}
