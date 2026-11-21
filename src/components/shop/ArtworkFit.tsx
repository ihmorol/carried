"use client";

import { useEffect, useRef } from "react";

/** Fit the whole intrinsic card into a product's print area without stretching its gaps. */
export function ArtworkFit({ children }: { children: React.ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!frame.current || !content.current) return;
    const fit = () => {
      if (!frame.current || !content.current) return;
      const scale = Math.min(1, frame.current.clientWidth / 300, frame.current.clientHeight / Math.max(1, content.current.offsetHeight));
      content.current.style.setProperty("--artwork-fit", String(scale));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(frame.current);
    observer.observe(content.current);
    fit();
    return () => observer.disconnect();
  }, []);
  return <div ref={frame} className="shop-artwork-fit"><div ref={content} className="shop-artwork-content">{children}</div></div>;
}
