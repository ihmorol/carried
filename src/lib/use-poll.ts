"use client";

import { useEffect, useRef } from "react";

/**
 * Poll on an interval while the tab is visible, the simple, sturdy way
 * to make feeds feel live without websockets.
 */
export function usePoll(fn: () => void, ms: number, enabled = true): void {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    const tick = () => {
      if (!stopped && typeof document !== "undefined" && !document.hidden) ref.current();
    };
    const id = setInterval(tick, ms);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [ms, enabled]);
}
