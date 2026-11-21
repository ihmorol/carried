"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react";
import { useLocale } from "./LocaleProvider";

const MotionContext = createContext({ paused: false, reduced: true, toggle: () => {}, pause: () => {} });

export const useRoomMotion = () => useContext(MotionContext);

/** Only the presentation moves. Content is visible before hydration, and each
 * scene sleeps outside the viewport or while the tab is hidden. */
export function ReadingRoom({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let mounted = true;
    const preference = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    const syncPreference = () => setReduced(preference?.matches ?? true);
    void Promise.resolve().then(() => { if (mounted) syncPreference(); });
    preference?.addEventListener("change", syncPreference);

    const syncVisibility = () => { root.dataset.pageVisible = String(!document.hidden); };
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    const scenes = root.querySelectorAll<HTMLElement>("[data-room-scene]");
    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries) => {
          for (const entry of entries) {
            (entry.target as HTMLElement).dataset.inView = String(entry.isIntersecting);
          }
        }, { threshold: 0.05 }) : null;
    scenes.forEach((scene) => {
      if (observer) observer.observe(scene);
      else scene.dataset.inView = "true";
    });

    return () => {
      mounted = false;
      preference?.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
      observer?.disconnect();
    };
  }, []);

  return (
    <MotionContext.Provider value={{ paused, reduced, toggle: () => setPaused((value) => !value), pause: () => setPaused(true) }}>
      <main ref={ref} id="main-content" className="reading-workspace" tabIndex={-1}
        data-motion={reduced ? "reduced" : paused ? "paused" : "running"}>
        {children}
      </main>
    </MotionContext.Provider>
  );
}

export function RoomMotionControl() {
  const { t } = useLocale();
  const { paused, reduced, toggle } = useContext(MotionContext);
  const label = t(reduced ? "motion.reduced" : paused ? "motion.resume" : "motion.pause");
  return (
    <button type="button" className="room-motion-toggle" onClick={toggle}
      disabled={reduced} aria-label={label} title={label} aria-controls="main-content"
      aria-pressed={!paused && !reduced}>
      {paused || reduced ? <Play size={18} weight="regular" aria-hidden="true" /> : <Pause size={18} weight="regular" aria-hidden="true" />}
    </button>
  );
}
