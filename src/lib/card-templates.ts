/**
 * Immutable identifiers for the card editions. A template changes the
 * composition and ownership mark, never the words, the ink palette is
 * chosen separately, and every edition is free.
 *
 * Absence of `ct` in a stored or URL payload means the line predates
 * editions: its identity and serialization must never gain a default.
 * Renderers may present it with the house edition, but nothing may write
 * that choice back into the payload, or old links would change identity.
 */

export const CARD_TEMPLATES = ["bookplate-v1", "poster-v1", "ticket-v1"] as const;

export type CardTemplateId = (typeof CARD_TEMPLATES)[number];

/** The edition shown for payloads that predate `ct`. Display-only. */
export const DEFAULT_CARD_TEMPLATE: CardTemplateId = "bookplate-v1";

export function isCardTemplateId(value: unknown): value is CardTemplateId {
  return typeof value === "string" && (CARD_TEMPLATES as readonly string[]).includes(value);
}
