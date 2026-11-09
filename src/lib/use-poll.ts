"use client";

import { useEffect, useRef } from "react";

/** An immediate, serial poll. Hidden tabs stop work; cleanup aborts it. */
export function usePoll(
  fn: (signal: AbortSignal) => void | Promise<void>,
  ms: number,
  enabled = true,
): void {
  const latest = useRef(fn);
  useEffect(() => { latest.current = fn; }, [fn]);
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    const schedule = () => { if (!stopped) timer = setTimeout(tick, ms); };
    async function tick() {
      if (stopped || inFlight) return;
      if (document.hidden) { schedule(); return; }
      inFlight = true;
      controller = new AbortController();
      try { await latest.current(controller.signal); }
      catch { /* The caller owns visible errors; never leak a timer rejection. */ }
      finally { inFlight = false; schedule(); }
    }
    function visible() {
      if (document.hidden) controller?.abort();
      else if (!inFlight) { clearTimeout(timer); void tick(); }
    }
    // Defer one microtask so StrictMode's discarded mount does not fetch.
    void Promise.resolve().then(() => { if (!stopped) void tick(); });
    document.addEventListener("visibilitychange", visible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visible);
    };
  }, [fn, ms, enabled]);
}
