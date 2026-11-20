import { LineCard } from "@/components/LineCard";
import { encodePayload, type LinePayload } from "@/lib/line";
import type { CardTemplateId } from "@/lib/card-templates";
import type { EditionId, EditionProps } from "./types";

const TEMPLATES: Record<EditionId, CardTemplateId> = {
  bookplate: "bookplate-v1",
  poster: "poster-v1",
  ticket: "ticket-v1",
};

/** Preview the actual renderer; no separate typography or geometry can drift. */
export function EditionCard({ edition, content, ink, className, stampKey }: EditionProps) {
  const payload: LinePayload = {
    v: 1,
    b: "preview-book",
    bt: content.book,
    ba: content.author,
    by: content.year ?? (content.language === "bn" ? 1929 : 1943),
    q: content.quote,
    n: content.name,
    d: content.isoDate ?? "2026-11-09",
    s: ink,
    ct: TEMPLATES[edition],
  };
  return (
    <div className={className} data-edition={edition} data-ink={ink} lang={content.language}>
      <LineCard key={stampKey ?? 0} payload={payload} id={encodePayload(payload)} actions={false} animateStamp={Boolean(stampKey)} />
    </div>
  );
}
