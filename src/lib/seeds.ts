import { encodeLine, type LinePayload } from "./line";

/**
 * Editorial seed lines — original reader takeaways written in-house
 * (they are reactions to books, not excerpts from them). Fixed dates
 * keep every encoded id stable across builds.
 */
type Seed = { b: string; q: string; n: string; s: LinePayload["s"]; d: string };

const SEEDS: Seed[] = [
  { b: "the-alchemist", q: "The treasure was never behind the dunes. It was in the boy who kept walking.", n: "Amara", s: "paper", d: "2026-01-12" },
  { b: "the-little-prince", q: "Nothing became mine until I gave it hours. That's all a rose ever asks.", n: "Noor", s: "midnight", d: "2026-01-19" },
  { b: "1984", q: "Whoever owns the past owns the calm. I check my sources before I check my temper.", n: "Dev", s: "midnight", d: "2026-01-22" },
  { b: "mans-search-for-meaning", q: "Meaning isn't found once and kept. It's remade every ordinary morning.", n: "Elena", s: "paper", d: "2026-02-02" },
  { b: "atomic-habits", q: "I stopped asking who I wanted to be. I started asking what that person would do before breakfast.", n: "Priya", s: "moss", d: "2026-02-08" },
  { b: "meditations", q: "Nothing outside my choosing could ever be my doing. So I choose, and I let the rest be weather.", n: "Tomas", s: "paper", d: "2026-02-14" },
  { b: "the-stranger", q: "Society punishes not the deed but the failure to perform feeling. I stopped performing.", n: "Jonas", s: "midnight", d: "2026-02-20" },
  { b: "the-great-gatsby", q: "Gatsby trusted the green light. I stopped waiting at the dock for tomorrow to bring the boat in.", n: "Sara", s: "paper", d: "2026-03-01" },
  { b: "crime-and-punishment", q: "Guilt is a debt with compound interest. Confession is the only currency that clears it.", n: "Marta", s: "paper", d: "2026-03-09" },
  { b: "siddhartha", q: "The river taught what the teacher couldn't: everything arrives twice, and once as water.", n: "Ilan", s: "moss", d: "2026-03-15" },
  { b: "the-midnight-library", q: "Regret is a door that only opens inward. I stopped knocking.", n: "Tess", s: "midnight", d: "2026-03-21" },
  { b: "norwegian-wood", q: "Death isn't the opposite of life — it's the part of it we refuse to remember. So I remember out loud.", n: "Yuki", s: "paper", d: "2026-03-28" },
  { b: "the-kite-runner", q: "There is a way to be good again. It usually starts with the call you keep not making.", n: "Ravi", s: "paper", d: "2026-04-04" },
  { b: "pride-and-prejudice", q: "First impressions are just pride wearing prejudice's coat.", n: "Bea", s: "moss", d: "2026-04-11" },
  { b: "to-kill-a-mockingbird", q: "Climbing into someone else's skin is the hardest hike there is. Worth it, every time.", n: "Jean", s: "paper", d: "2026-04-18" },
  { b: "the-handmaids-tale", q: "Don't let them teach you the size they need you to be.", n: "Lena", s: "midnight", d: "2026-04-25" },
  { b: "the-road", q: "Carrying the fire is just deciding, daily, not to become the dark.", n: "Owen", s: "midnight", d: "2026-05-02" },
  { b: "sapiens", q: "Fictions built the world — money, nations, rights. I choose my fictions on purpose now.", n: "Ada", s: "paper", d: "2026-05-09" },
  { b: "thinking-fast-and-slow", q: "My confident self is mostly a narrator inventing reasons. I ask for the data before the story.", n: "Karim", s: "paper", d: "2026-05-16" },
  { b: "the-psychology-of-money", q: "Wealth is what you don't see: the trips not taken, the upgrade declined, the calm compounding.", n: "Hana", s: "moss", d: "2026-05-23" },
  { b: "frankenstein", q: "The creature wasn't born monstrous. It was neglected into monstrosity. I answer my messages.", n: "Ivan", s: "midnight", d: "2026-05-30" },
  { b: "the-prophet", q: "Your work is where your love goes to become visible. Or where it goes to hide.", n: "Nadia", s: "paper", d: "2026-06-06" },
  { b: "dune", q: "I let the fear pass through me. What stayed was the person who could.", n: "Josh", s: "moss", d: "2026-06-13" },
  { b: "one-hundred-years-of-solitude", q: "Solitude isn't the absence of people. It's the presence of everything unsaid.", n: "Camila", s: "paper", d: "2026-06-20" },
  { b: "the-master-and-margarita", q: "Manuscripts don't burn. Neither do the people who keep writing them.", n: "Dmitri", s: "midnight", d: "2026-06-27" },
  { b: "quiet", q: "Introversion isn't a flaw to fix. It's a depth to visit, and I live there.", n: "Rosa", s: "paper", d: "2026-07-04" },
  { b: "when-breath-becomes-air", q: "You don't get to finish the book. You get to finish sentences. Make them good.", n: "Maya", s: "paper", d: "2026-07-11" },
  { b: "hamlet", q: "To be or not to be was never the question. It was to act while unsure.", n: "Rahim", s: "midnight", d: "2026-07-18" },
];

export type SeedLine = LinePayload & { id: string };

export const SEED_LINES: SeedLine[] = SEEDS.map((s) => {
  const { id, payload } = encodeLine({ bookSlug: s.b, text: s.q, name: s.n, ink: s.s, date: s.d });
  return { ...payload, id };
});

export function seedLinesFor(slug: string): SeedLine[] {
  return SEED_LINES.filter((l) => l.b === slug);
}

/** A stable sample for the home marquee — newest five books get the rest. */
export function marqueeLines(): SeedLine[] {
  const byBook = new Map<string, SeedLine>();
  for (const l of SEED_LINES) if (!byBook.has(l.b)) byBook.set(l.b, l);
  return [...byBook.values()];
}
