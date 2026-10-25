/**
 * The shelf. A curated list of books people actually carry lines out of.
 * No cover images by design, every book is drawn as a book-cloth spine,
 * so the wall renders instantly and nothing can ever 404.
 */

export type Book = {
  slug: string;
  title: string;
  /** Bangla title, shown alongside the romanized one */
  titleBn?: string;
  author: string;
  authorBn?: string;
  year: number;
  tags: string[];
  spine: SpineColor;
};

/** Book-cloth palette, spines are drawn from these. */
export type SpineColor =
  | "oxblood"
  | "forest"
  | "navy"
  | "mustard"
  | "terracotta"
  | "cream"
  | "slate"
  | "plum"
  | "teal"
  | "rust"
  | "olive"
  | "charcoal"
  | "saffron"
  | "rose"
  | "denim";

export const SPINE_COLORS: Record<SpineColor, { bg: string; text: string; deep: string }> = {
  oxblood:    { bg: "#6e2b25", text: "#f2ecdd", deep: "#571f1a" },
  forest:     { bg: "#2f4a38", text: "#f2ecdd", deep: "#23392b" },
  navy:       { bg: "#24344d", text: "#f2ecdd", deep: "#1a2739" },
  mustard:    { bg: "#c79a3b", text: "#211d17", deep: "#a87e2c" },
  terracotta: { bg: "#b4593b", text: "#f2ecdd", deep: "#96452c" },
  cream:      { bg: "#e7dcc2", text: "#211d17", deep: "#cfc2a4" },
  slate:      { bg: "#55606e", text: "#f2ecdd", deep: "#434d59" },
  plum:       { bg: "#5a3a50", text: "#f2ecdd", deep: "#462c3e" },
  teal:       { bg: "#2e6b66", text: "#f2ecdd", deep: "#235351" },
  rust:       { bg: "#9c4a2f", text: "#f2ecdd", deep: "#7d3a24" },
  olive:      { bg: "#6b6b3a", text: "#f2ecdd", deep: "#54542d" },
  charcoal:   { bg: "#33302c", text: "#f2ecdd", deep: "#262421" },
  saffron:    { bg: "#d1912f", text: "#211d17", deep: "#b37724" },
  rose:       { bg: "#b4838e", text: "#211d17", deep: "#9a6d78" },
  denim:      { bg: "#40597a", text: "#f2ecdd", deep: "#334761" },
};

const B = (
  slug: string,
  title: string,
  author: string,
  year: number,
  tags: string[],
  spine: SpineColor,
): Book => ({ slug, title, author, year, tags, spine });

/** Bangla-shelf entry with native script fields. */
const BB = (
  slug: string,
  title: string,
  titleBn: string,
  author: string,
  authorBn: string,
  year: number,
  tags: string[],
  spine: SpineColor,
): Book => ({ slug, title, titleBn, author, authorBn, year, tags, spine });

export const BOOKS: Book[] = [
  // ── Fiction: the canon everyone quotes ──────────────────────
  B("the-alchemist", "The Alchemist", "Paulo Coelho", 1988, ["fiction", "philosophy"], "mustard"),
  B("the-little-prince", "The Little Prince", "Antoine de Saint-Exupéry", 1943, ["fiction", "children"], "navy"),
  B("1984", "Nineteen Eighty-Four", "George Orwell", 1949, ["fiction", "classic"], "charcoal"),
  B("animal-farm", "Animal Farm", "George Orwell", 1945, ["fiction", "classic"], "rust"),
  B("to-kill-a-mockingbird", "To Kill a Mockingbird", "Harper Lee", 1960, ["fiction", "classic"], "cream"),
  B("the-great-gatsby", "The Great Gatsby", "F. Scott Fitzgerald", 1925, ["fiction", "classic"], "teal"),
  B("the-catcher-in-the-rye", "The Catcher in the Rye", "J. D. Salinger", 1951, ["fiction", "classic"], "oxblood"),
  B("brave-new-world", "Brave New World", "Aldous Huxley", 1932, ["fiction", "classic"], "slate"),
  B("fahrenheit-451", "Fahrenheit 451", "Ray Bradbury", 1953, ["fiction", "classic"], "terracotta"),
  B("lord-of-the-flies", "Lord of the Flies", "William Golding", 1954, ["fiction", "classic"], "olive"),
  B("the-old-man-and-the-sea", "The Old Man and the Sea", "Ernest Hemingway", 1952, ["fiction", "classic"], "forest"),
  B("the-picture-of-dorian-gray", "The Picture of Dorian Gray", "Oscar Wilde", 1890, ["fiction", "classic"], "plum"),
  B("frankenstein", "Frankenstein", "Mary Shelley", 1818, ["fiction", "classic"], "navy"),
  B("dracula", "Dracula", "Bram Stoker", 1897, ["fiction", "classic"], "oxblood"),
  B("pride-and-prejudice", "Pride and Prejudice", "Jane Austen", 1813, ["fiction", "classic"], "cream"),
  B("jane-eyre", "Jane Eyre", "Charlotte Brontë", 1847, ["fiction", "classic"], "slate"),
  B("wuthering-heights", "Wuthering Heights", "Emily Brontë", 1847, ["fiction", "classic"], "charcoal"),
  B("anna-karenina", "Anna Karenina", "Leo Tolstoy", 1878, ["fiction", "classic"], "rust"),
  B("war-and-peace", "War and Peace", "Leo Tolstoy", 1869, ["fiction", "classic"], "olive"),
  B("crime-and-punishment", "Crime and Punishment", "Fyodor Dostoevsky", 1866, ["fiction", "classic"], "oxblood"),
  B("the-brothers-karamazov", "The Brothers Karamazov", "Fyodor Dostoevsky", 1880, ["fiction", "classic"], "charcoal"),
  B("the-stranger", "The Stranger", "Albert Camus", 1942, ["fiction", "philosophy"], "cream"),
  B("the-plague", "The Plague", "Albert Camus", 1947, ["fiction", "philosophy"], "slate"),
  B("one-hundred-years-of-solitude", "One Hundred Years of Solitude", "Gabriel García Márquez", 1967, ["fiction"], "mustard"),
  B("love-in-the-time-of-cholera", "Love in the Time of Cholera", "Gabriel García Márquez", 1985, ["fiction"], "terracotta"),
  B("the-master-and-margarita", "The Master and Margarita", "Mikhail Bulgakov", 1967, ["fiction", "classic"], "plum"),
  B("catch-22", "Catch-22", "Joseph Heller", 1961, ["fiction", "classic"], "teal"),
  B("slaughterhouse-five", "Slaughterhouse-Five", "Kurt Vonnegut", 1969, ["fiction", "classic"], "navy"),
  B("the-bell-jar", "The Bell Jar", "Sylvia Plath", 1963, ["fiction"], "forest"),
  B("the-metamorphosis", "The Metamorphosis", "Franz Kafka", 1915, ["fiction", "classic"], "charcoal"),
  B("siddhartha", "Siddhartha", "Hermann Hesse", 1922, ["fiction", "philosophy"], "mustard"),
  B("of-mice-and-men", "Of Mice and Men", "John Steinbeck", 1937, ["fiction", "classic"], "olive"),
  B("east-of-eden", "East of Eden", "John Steinbeck", 1952, ["fiction", "classic"], "rust"),
  B("the-grapes-of-wrath", "The Grapes of Wrath", "John Steinbeck", 1939, ["fiction", "classic"], "oxblood"),
  B("moby-dick", "Moby-Dick", "Herman Melville", 1851, ["fiction", "classic"], "navy"),
  B("les-miserables", "Les Misérables", "Victor Hugo", 1862, ["fiction", "classic"], "slate"),
  B("the-count-of-monte-cristo", "The Count of Monte Cristo", "Alexandre Dumas", 1844, ["fiction", "classic"], "forest"),
  B("don-quixote", "Don Quixote", "Miguel de Cervantes", 1605, ["fiction", "classic"], "terracotta"),
  B("the-odyssey", "The Odyssey", "Homer", -700, ["classic", "poetry"], "teal"),
  B("the-iliad", "The Iliad", "Homer", -750, ["classic", "poetry"], "oxblood"),

  // ── Modern fiction ──────────────────────────────────────────
  B("the-kite-runner", "The Kite Runner", "Khaled Hosseini", 2003, ["fiction"], "slate"),
  B("a-thousand-splendid-suns", "A Thousand Splendid Suns", "Khaled Hosseini", 2007, ["fiction"], "mustard"),
  B("the-midnight-library", "The Midnight Library", "Matt Haig", 2020, ["fiction"], "navy"),
  B("norwegian-wood", "Norwegian Wood", "Haruki Murakami", 1987, ["fiction"], "forest"),
  B("kafka-on-the-shore", "Kafka on the Shore", "Haruki Murakami", 2002, ["fiction"], "teal"),
  B("the-wind-up-bird-chronicle", "The Wind-Up Bird Chronicle", "Haruki Murakami", 1994, ["fiction"], "plum"),
  B("the-handmaids-tale", "The Handmaid's Tale", "Margaret Atwood", 1985, ["fiction"], "oxblood"),
  B("the-road", "The Road", "Cormac McCarthy", 2006, ["fiction"], "charcoal"),
  B("life-of-pi", "Life of Pi", "Yann Martel", 2001, ["fiction"], "teal"),
  B("the-book-thief", "The Book Thief", "Markus Zusak", 2005, ["fiction"], "mustard"),
  B("never-let-me-go", "Never Let Me Go", "Kazuo Ishiguro", 2005, ["fiction"], "slate"),
  B("the-remains-of-the-day", "The Remains of the Day", "Kazuo Ishiguro", 1989, ["fiction"], "olive"),
  B("the-secret-history", "The Secret History", "Donna Tartt", 1992, ["fiction"], "oxblood"),
  B("the-goldfinch", "The Goldfinch", "Donna Tartt", 2013, ["fiction"], "navy"),
  B("a-little-life", "A Little Life", "Hanya Yanagihara", 2015, ["fiction"], "slate"),
  B("normal-people", "Normal People", "Sally Rooney", 2018, ["fiction"], "cream"),
  B("circe", "Circe", "Madeline Miller", 2018, ["fiction"], "terracotta"),
  B("the-song-of-achilles", "The Song of Achilles", "Madeline Miller", 2011, ["fiction"], "forest"),
  B("pachinko", "Pachinko", "Min Jin Lee", 2017, ["fiction"], "plum"),
  B("homegoing", "Homegoing", "Yaa Gyasi", 2016, ["fiction"], "rust"),
  B("americanah", "Americanah", "Chimamanda Ngozi Adichie", 2013, ["fiction"], "teal"),
  B("half-of-a-yellow-sun", "Half of a Yellow Sun", "Chimamanda Ngozi Adichie", 2006, ["fiction"], "mustard"),
  B("the-god-of-small-things", "The God of Small Things", "Arundhati Roy", 1997, ["fiction"], "forest"),
  B("midnights-children", "Midnight's Children", "Salman Rushdie", 1981, ["fiction"], "olive"),
  B("things-fall-apart", "Things Fall Apart", "Chinua Achebe", 1958, ["fiction", "classic"], "terracotta"),
  B("the-namesake", "The Namesake", "Jhumpa Lahiri", 2003, ["fiction"], "slate"),
  B("white-teeth", "White Teeth", "Zadie Smith", 2000, ["fiction"], "navy"),
  B("the-pillars-of-the-earth", "The Pillars of the Earth", "Ken Follett", 1989, ["fiction"], "charcoal"),
  B("shantaram", "Shantaram", "Gregory David Roberts", 2003, ["fiction"], "rust"),
  B("the-shadow-of-the-wind", "The Shadow of the Wind", "Carlos Ruiz Zafón", 2001, ["fiction"], "oxblood"),
  B("a-man-called-ove", "A Man Called Ove", "Fredrik Backman", 2012, ["fiction"], "mustard"),
  B("eleanor-oliphant", "Eleanor Oliphant Is Completely Fine", "Gail Honeyman", 2017, ["fiction"], "cream"),
  B("the-fault-in-our-stars", "The Fault in Our Stars", "John Green", 2012, ["fiction"], "teal"),
  B("the-perks-of-being-a-wallflower", "The Perks of Being a Wallflower", "Stephen Chbosky", 1999, ["fiction"], "slate"),

  // ── Speculative ─────────────────────────────────────────────
  B("dune", "Dune", "Frank Herbert", 1965, ["scifi"], "terracotta"),
  B("the-hobbit", "The Hobbit", "J. R. R. Tolkien", 1937, ["fantasy"], "forest"),
  B("the-fellowship-of-the-ring", "The Fellowship of the Ring", "J. R. R. Tolkien", 1954, ["fantasy"], "olive"),
  B("a-game-of-thrones", "A Game of Thrones", "George R. R. Martin", 1996, ["fantasy"], "charcoal"),
  B("the-name-of-the-wind", "The Name of the Wind", "Patrick Rothfuss", 2007, ["fantasy"], "navy"),
  B("harry-potter", "Harry Potter and the Philosopher's Stone", "J. K. Rowling", 1997, ["fantasy"], "plum"),
  B("the-hunger-games", "The Hunger Games", "Suzanne Collins", 2008, ["scifi"], "oxblood"),

  // ── Ideas: philosophy, mind, meaning ────────────────────────
  B("meditations", "Meditations", "Marcus Aurelius", 180, ["philosophy"], "charcoal"),
  B("the-myth-of-sisyphus", "The Myth of Sisyphus", "Albert Camus", 1942, ["philosophy"], "slate"),
  B("thus-spoke-zarathustra", "Thus Spoke Zarathustra", "Friedrich Nietzsche", 1883, ["philosophy"], "plum"),
  B("the-prince", "The Prince", "Niccolò Machiavelli", 1532, ["philosophy"], "oxblood"),
  B("the-art-of-war", "The Art of War", "Sun Tzu", -500, ["philosophy"], "forest"),
  B("walden", "Walden", "Henry David Thoreau", 1854, ["philosophy", "nature"], "olive"),
  B("mans-search-for-meaning", "Man's Search for Meaning", "Viktor E. Frankl", 1946, ["psychology", "memoir"], "navy"),
  B("thinking-fast-and-slow", "Thinking, Fast and Slow", "Daniel Kahneman", 2011, ["psychology"], "mustard"),
  B("quiet", "Quiet", "Susan Cain", 2012, ["psychology"], "teal"),
  B("sapiens", "Sapiens", "Yuval Noah Harari", 2011, ["history", "science"], "cream"),
  B("the-diary-of-a-young-girl", "The Diary of a Young Girl", "Anne Frank", 1947, ["memoir"], "slate"),
  B("when-breath-becomes-air", "When Breath Becomes Air", "Paul Kalanithi", 2016, ["memoir"], "forest"),
  B("educated", "Educated", "Tara Westover", 2018, ["memoir"], "terracotta"),
  B("born-a-crime", "Born a Crime", "Trevor Noah", 2016, ["memoir"], "rust"),
  B("tuesdays-with-morrie", "Tuesdays with Morrie", "Mitch Albom", 1997, ["memoir"], "olive"),

  // ── Craft, money, work ──────────────────────────────────────
  B("atomic-habits", "Atomic Habits", "James Clear", 2018, ["self"], "teal"),
  B("deep-work", "Deep Work", "Cal Newport", 2016, ["self", "work"], "navy"),
  B("the-psychology-of-money", "The Psychology of Money", "Morgan Housel", 2020, ["money"], "forest"),
  B("the-subtle-art", "The Subtle Art of Not Giving a F*ck", "Mark Manson", 2016, ["self"], "terracotta"),
  B("the-four-agreements", "The Four Agreements", "Don Miguel Ruiz", 1997, ["self"], "mustard"),
  B("ikigai", "Ikigai", "Héctor García & Francesc Miralles", 2016, ["self"], "cream"),
  B("outliers", "Outliers", "Malcolm Gladwell", 2008, ["psychology", "work"], "slate"),
  B("zero-to-one", "Zero to One", "Peter Thiel", 2014, ["work"], "charcoal"),
  B("the-lean-startup", "The Lean Startup", "Eric Ries", 2011, ["work"], "plum"),

  // ── Poetry & plays ──────────────────────────────────────────
  B("the-prophet", "The Prophet", "Kahlil Gibran", 1923, ["poetry", "philosophy"], "navy"),
  B("milk-and-honey", "milk and honey", "Rupi Kaur", 2014, ["poetry"], "cream"),
  B("hamlet", "Hamlet", "William Shakespeare", 1600, ["play", "classic"], "charcoal"),
  B("romeo-and-juliet", "Romeo and Juliet", "William Shakespeare", 1597, ["play", "classic"], "oxblood"),
  B("macbeth", "Macbeth", "William Shakespeare", 1606, ["play", "classic"], "forest"),

  // ── The Bangla shelf: Bangladesh & Bengali literature ───────
  BB("gitanjali", "Gitanjali", "গীতাঞ্জলি", "Rabindranath Tagore", "রবীন্দ্রনাথ ঠাকুর", 1910, ["bangla", "poetry", "classic"], "saffron"),
  BB("gora", "Gora", "গোরা", "Rabindranath Tagore", "রবীন্দ্রনাথ ঠাকুর", 1910, ["bangla", "classic"], "forest"),
  BB("ghare-baire", "The Home and the World", "ঘরে বাইরে", "Rabindranath Tagore", "রবীন্দ্রনাথ ঠাকুর", 1916, ["bangla", "classic"], "olive"),
  BB("chokher-bali", "Chokher Bali", "চোখের বালি", "Rabindranath Tagore", "রবীন্দ্রনাথ ঠাকুর", 1903, ["bangla", "classic"], "plum"),
  BB("shesher-kobita", "Shesher Kobita", "শেষের কবিতা", "Rabindranath Tagore", "রবীন্দ্রনাথ ঠাকুর", 1929, ["bangla", "classic"], "terracotta"),
  BB("devdas", "Devdas", "দেবদাস", "Sarat Chandra Chattopadhyay", "শরৎচন্দ্র চট্টোপাধ্যায়", 1917, ["bangla", "classic"], "oxblood"),
  BB("parineeta", "Parineeta", "পরিণীতা", "Sarat Chandra Chattopadhyay", "শরৎচন্দ্র চট্টোপাধ্যায়", 1914, ["bangla", "classic"], "rose"),
  BB("srikanta", "Srikanta", "শ্রীকান্ত", "Sarat Chandra Chattopadhyay", "শরৎচন্দ্র চট্টোপাধ্যায়", 1917, ["bangla", "classic"], "teal"),
  BB("anandamath", "Anandamath", "আনন্দমঠ", "Bankim Chandra Chattopadhyay", "বঙ্কিমচন্দ্র চট্টোপাধ্যায়", 1882, ["bangla", "classic"], "mustard"),
  BB("pather-panchali", "Pather Panchali", "পথের পাঁচালী", "Bibhutibhushan Bandyopadhyay", "বিভূতিভূষণ বন্দ্যোপাধ্যায়", 1929, ["bangla", "classic"], "cream"),
  BB("aranyak", "Aranyak", "আরণ্যক", "Bibhutibhushan Bandyopadhyay", "বিভূতিভূষণ বন্দ্যোপাধ্যায়", 1939, ["bangla", "nature"], "forest"),
  BB("chander-pahar", "Chander Pahar", "চাঁদের পাহাড়", "Bibhutibhushan Bandyopadhyay", "বিভূতিভূষণ বন্দ্যোপাধ্যায়", 1937, ["bangla", "adventure"], "navy"),
  BB("padma-nadir-majhi", "Padma Nadir Majhi", "পদ্মা নদীর মাঝি", "Manik Bandopadhyay", "মানিক বন্দ্যোপাধ্যায়", 1936, ["bangla", "classic"], "denim"),
  BB("putul-nacher-itikotha", "Putul Nacher Itikotha", "পুতুলনাচের ইতিকথা", "Manik Bandopadhyay", "মানিক বন্দ্যোপাধ্যায়", 1936, ["bangla", "classic"], "slate"),
  BB("hajabarala", "HaJaBaRaLa", "হযবরল", "Sukumar Ray", "সুকুমার রায়", 1925, ["bangla", "humor"], "mustard"),
  BB("abol-tabol", "Abol Tabol", "আবোল তাবোল", "Sukumar Ray", "সুকুমার রায়", 1923, ["bangla", "poetry"], "teal"),
  BB("sultanas-dream", "Sultana's Dream", "সুলতানার স্বপ্ন", "Begum Rokeya", "বেগম রোকেয়া", 1905, ["bangla", "scifi"], "plum"),
  BB("bidrohi", "Bidrohi (The Rebel)", "বিদ্রোহী", "Kazi Nazrul Islam", "কাজী নজরুল ইসলাম", 1922, ["bangla", "poetry"], "charcoal"),
  BB("nakshi-kanthar-math", "Nakshi Kanthar Math", "নকশী কাঁথার মাঠ", "Jasim Uddin", "জসীম উদ্দীন", 1929, ["bangla", "poetry"], "olive"),
  BB("banalata-sen", "Banalata Sen", "বনলতা সেন", "Jibanananda Das", "জীবনানন্দ দাশ", 1935, ["bangla", "poetry"], "slate"),
  BB("lalsalu", "Lalsalu", "লালসালু", "Syed Waliullah", "সৈয়দ ওয়ালীউল্লাহ", 1948, ["bangla", "classic"], "oxblood"),
  BB("sangshaptak", "Sangshaptak", "সংশপ্তক", "Shahidullah Kaiser", "শহীদুল্লা কায়সার", 1965, ["bangla", "classic"], "rust"),
  BB("shongkhosil-karagar", "Shongkhosil Karagar", "শঙ্খনিল কারাগার", "Zahir Raihan", "জহির রায়হান", 1963, ["bangla", "classic"], "navy"),
  BB("chilekothar-sepai", "Chilekothar Sepai", "চিলেকোঠার সৈকত", "Akhtaruzzaman Elias", "আখতারুজ্জামান ইলিয়াস", 1987, ["bangla", "classic"], "teal"),
  BB("khowabnama", "Khowabnama", "খোয়াবনামা", "Akhtaruzzaman Elias", "আখতারুজ্জামান ইলিয়াস", 1996, ["bangla", "classic"], "forest"),
  BB("agunpakhi", "Agunpakhi", "অগ্নিপুরখী", "Hasan Azizul Haque", "হাসান আজিজুল হক", 2006, ["bangla", "memoir"], "terracotta"),
  BB("himu", "Himu", "হিমু", "Humayun Ahmed", "হুমায়ূন আহমেদ", 1990, ["bangla"], "plum"),
  BB("debi", "Debi", "দেবী", "Humayun Ahmed", "হুমায়ূন আহমেদ", 1987, ["bangla"], "charcoal"),
  BB("maa", "Maa", "মা", "Anisul Hoque", "আনিসুল হক", 2004, ["bangla", "memoir"], "rust"),
  BB("hangor-nodi-grenade", "Hangor Nodi Grenade", "হাঙর নদী গ্রেনেড", "Selina Hossain", "সেলিনা হোসেন", 1976, ["bangla", "classic"], "olive"),
  BB("deshe-bideshe", "Deshe Bideshe", "দেশে বিদেশে", "Syed Mujtaba Ali", "সৈয়দ মুজতবা আলী", 1948, ["bangla", "humor"], "slate"),
  BB("kaler-kalosh", "Kaler Kalosh", "কালের কলস", "Al Mahmud", "আল মাহমুদ", 1973, ["bangla", "poetry"], "terracotta"),
  BB("amar-bondhu-rashed", "Amar Bondhu Rashed", "আমার বন্ধু রাশেদ", "Muhammed Zafar Iqbal", "মুহম্মদ জাফর ইকবাল", 2010, ["bangla"], "denim"),
];

export const BOOKS_BY_SLUG: ReadonlyMap<string, Book> = new Map(
  BOOKS.map((b) => [b.slug, b]),
);

export function getBook(slug: string): Book | undefined {
  return BOOKS_BY_SLUG.get(slug);
}

export function bookTagline(b: Book): string {
  return `${b.author}, ${b.year < 0 ? `${Math.abs(b.year)} BC` : b.year}`;
}

/** The name a book is actually known by, Bangla books keep their Bangla title everywhere. */
export function originalName(b: Book): string {
  return b.titleBn ?? b.title;
}

/** Strip diacritics + lowercase so "Brontë" matches "bronte". */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Client-side instant search over title, original title, author and tags. */
export function searchBooks(query: string, limit = 40): Book[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const scored: Array<{ b: Book; s: number }> = [];
  for (const b of BOOKS) {
    const t = normalize(b.title);
    const tb = normalize(b.titleBn ?? "");
    const a = normalize(b.author);
    let s = 0;
    if (t.startsWith(q) || (tb && tb.startsWith(q))) s = 3;
    else if (t.includes(q) || (tb && tb.includes(q))) s = 2;
    else if (a.startsWith(q)) s = 2;
    else if (a.includes(q)) s = 1.5;
    else if (b.tags.some((tag) => tag.startsWith(q) || normalize(tag).includes(q))) s = 1;
    else if (q.length > 2 && (t.includes(q) || a.includes(q))) s = 0.5;
    if (s > 0) scored.push({ b, s });
  }
  scored.sort((x, y) => y.s - x.s || x.b.title.localeCompare(y.b.title));
  return scored.slice(0, limit).map((x) => x.b);
}

export function booksByTag(tag: string): Book[] {
  return BOOKS.filter((b) => b.tags.includes(tag));
}

/** Deterministic spine height so the shelf looks hand-stacked, not machine-uniform. */
export function spineHeight(b: Book, min = 176, max = 236): number {
  let h = 0;
  for (let i = 0; i < b.slug.length; i++) h = (h * 31 + b.slug.charCodeAt(i)) >>> 0;
  return min + (h % (max - min + 1));
}
