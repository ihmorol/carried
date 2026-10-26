"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Pointer-reactive 3D tilt: the object leans toward the cursor and
 * settles back on release. Pure presentation on a wrapper, so whatever
 * sits inside (the canonical card) is untouched and the canvas export
 * and OG image stay identical.
 *
 * Skips touch devices and reduced-motion users entirely.
 */
export function TiltCard({
  children,
  className = "",
  max = 5,
  scale = 1.012,
}: {
  children: React.ReactNode;
  className?: string;
  /** max lean in degrees */
  max?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const enabled = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      enabled.current = fine.matches && !calm.matches;
      if (!enabled.current && ref.current) {
        cancelAnimationFrame(raf.current);
        ref.current.style.transform = "";
      }
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
  }, []);

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current;
      if (!enabled.current || !el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.transitionDuration = "120ms";
        el.style.transform = `perspective(1100px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) scale(${scale})`;
      });
    },
    [max, scale],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.style.transitionDuration = "550ms";
    el.style.transform = "";
  }, []);

  return (
    <div ref={ref} className={`tilt ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </div>
  );
}
