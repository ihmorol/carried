"use client";

import { useEffect, useRef } from "react";
import { LineCard } from "./LineCard";
import type { LinePayload } from "@/lib/line";

/**
 * The hero pile: today's card floats above two filed-away ones, all in
 * one perspective. The mouse drifts the pile by depth with a little
 * inertia; on touch devices and reduced-motion it rests as a still
 * pile. Presentation only, the card inside is the same artifact the
 * canvas export and OG image render.
 */
export function HeroStage({
  payload,
  id,
}: {
  payload: LinePayload;
  id: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    let running = false;

    const tick = () => {
      cx += (tx - cx) * 0.075;
      cy += (ty - cy) * 0.075;
      el.style.setProperty("--mx", cx.toFixed(4));
      el.style.setProperty("--my", cy.toFixed(4));
      if (Math.abs(tx - cx) < 0.001 && Math.abs(ty - cy) < 0.001) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    // The loop sleeps once the pile settles and wakes on the next move,
    // so an idle page costs no frames.
    const wake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      wake();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      wake();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    wake();
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="hero-stage">
      <div className="hero-ghost hero-ghost-a" aria-hidden="true" />
      <div className="hero-ghost hero-ghost-b" aria-hidden="true" />
      <div className="hero-front">
        <LineCard payload={payload} id={id} size="lg" animateStamp />
      </div>
      <div className="hero-marks" aria-hidden="true" />
    </div>
  );
}
