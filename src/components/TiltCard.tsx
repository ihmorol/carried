"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const TILT_VARS = ["--stage-rx", "--stage-ry", "--stage-s", "--stage-shadow-x", "--stage-shadow-s"] as const;

/**
 * The card stage: a featured card reads as a physical object laid on the
 * desk — a backing stack of raised paper, a contact shadow, a fine-pointer
 * lean that settles back on leave, and a one-time landing when it first
 * enters the viewport. Pure presentation on wrappers, so whatever sits
 * inside (the canonical card) is untouched and the canvas export and OG
 * image stay identical.
 *
 * `flat` drops the 3D entirely (grids, narrow panes): a static contact
 * shadow and a small hover lift. `land` opts into the entrance animation;
 * without IntersectionObserver or with reduced motion the card is simply
 * there — content never waits on animation.
 */
export function TiltCard({
  children,
  className = "",
  max = 6,
  scale = 1.02,
  flat = false,
  land = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** max lean in degrees */
  max?: number;
  scale?: number;
  /** grid mode: no perspective, no tilt — contact shadow and small lift only */
  flat?: boolean;
  /** one-time landing animation when the stage first enters the viewport */
  land?: boolean;
}) {
  const objectRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const enabled = useRef(false);

  useEffect(() => {
    if (flat) return;
    // Very old engines and test environments lack matchMedia; tilt is
    // presentation only, so it simply stays off there.
    if (typeof window.matchMedia !== "function") return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rest = () => {
      const el = objectRef.current;
      if (!el) return;
      cancelAnimationFrame(raf.current);
      el.style.transitionDuration = "";
      for (const name of TILT_VARS) el.style.removeProperty(name);
    };
    const sync = () => {
      enabled.current = fine.matches && !calm.matches;
      if (!enabled.current) rest();
    };
    sync();
    fine.addEventListener("change", sync);
    calm.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      calm.removeEventListener("change", sync);
      enabled.current = false;
      cancelAnimationFrame(raf.current);
    };
  }, [flat]);

  // Landing: the lifted first frame is applied synchronously before paint,
  // and only when JS knows it will animate. The SSR/no-JS default (no
  // data-land attribute) is the landed card at rest.
  useIsomorphicLayoutEffect(() => {
    if (!land || flat) return;
    const el = objectRef.current;
    if (!el) return;
    const calm = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    if (calm?.matches || typeof IntersectionObserver !== "function") {
      el.dataset.land = "done";
      return;
    }
    el.dataset.land = "pending";
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.disconnect();
        // A paused or reduced reading room keeps the card at rest.
        const asleep = el.closest('[data-motion="paused"], [data-motion="reduced"]');
        el.dataset.land = asleep ? "done" : "run";
      }
    }, { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [land, flat]);

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const el = objectRef.current;
      if (flat || !enabled.current || !el || el.closest('[data-motion="paused"], [data-motion="reduced"]')) return;
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.transitionDuration = "120ms";
        el.style.setProperty("--stage-rx", `${(-py * max).toFixed(2)}deg`);
        el.style.setProperty("--stage-ry", `${(px * max).toFixed(2)}deg`);
        el.style.setProperty("--stage-s", scale.toFixed(3));
        el.style.setProperty("--stage-shadow-x", `${(px * 10).toFixed(2)}px`);
        el.style.setProperty("--stage-shadow-s", "1.04");
      });
    },
    [flat, max, scale],
  );

  const onLeave = useCallback(() => {
    const el = objectRef.current;
    if (flat || !el) return;
    cancelAnimationFrame(raf.current);
    el.style.transitionDuration = "550ms";
    for (const name of ["--stage-rx", "--stage-ry", "--stage-shadow-x", "--stage-shadow-s"]) el.style.removeProperty(name);
    el.style.setProperty("--stage-s", "1");
  }, [flat]);

  if (flat) {
    return (
      <div className={`stage stage--flat ${className}`}>
        <div className="stage-card">{children}</div>
      </div>
    );
  }

  return (
    <div className={`stage ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={objectRef} className="stage-object"
        onAnimationEnd={(event) => {
          // Fill-mode "both" would freeze the landing's rest frame on top of
          // the tilt transform, so retire the animation once it settles.
          if (event.animationName === "stage-land") event.currentTarget.dataset.land = "done";
        }}>
        <div className="stage-stack" aria-hidden="true" />
        <div className="stage-shadow" aria-hidden="true" />
        <div className="stage-card">{children}</div>
      </div>
    </div>
  );
}
