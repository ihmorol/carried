"use client";

import { useState } from "react";
import { BookSpine } from "./BookSpine";
import type { Book } from "@/lib/books";

/** Changing either book or URL starts a fresh attempt, including past URLs. */
export function BookCover({ src, book }: { src: string; book: Book }) {
  return <CoverAttempt key={`${book.slug}:${src}`} src={src} book={book} />;
}
function CoverAttempt({ src, book }: { src: string; book: Book }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="spine-hover" style={{ transform: "rotate(-1.5deg)" }}><BookSpine book={book} height={300} /></div>;
  return <div style={{ transform: "rotate(-1.5deg)" }}>
    {/* eslint-disable-next-line @next/next/no-img-element -- free archive scan, sized naturally */}
    <img src={src} alt={`Cover of ${book.title}`} width={230} loading="lazy" onError={() => setFailed(true)}
      className="max-w-full rounded-[3px] shadow-[0_1px_2px_rgba(28,22,12,0.3),0_18px_38px_rgba(28,22,12,0.25)]" />
  </div>;
}
