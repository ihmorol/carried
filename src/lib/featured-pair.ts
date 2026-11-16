import type { Book } from "./books";
import type { SeedLine } from "./seeds";

/** A pair is a single identity so the cover, line and destination cannot drift. */
export type FeaturedPair = {
  book: Book;
  line: SeedLine;
  cover?: string;
};
