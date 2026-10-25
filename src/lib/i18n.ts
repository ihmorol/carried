/**
 * The two voices of Carried, English and Bangla.
 * Region decides the default (middleware sets a cookie from
 * Accept-Language / Vercel geo), the reader can switch any time.
 */

export type Locale = "en" | "bn";

type Dict = Record<string, string>;

const EN: Dict = {
  // brand
  "brand.tagline": "the line a book left in you",

  // header
  "nav.shelf": "The shelf",
  "nav.myLines": "My lines",
  "nav.write": "Write your line",

  // footer
  "footer.tag": "every book leaves a line in you. pass yours on.",
  "footer.pick": "Pick a book",
  "footer.mine": "My lines",
  "footer.source": "Source",

  // hero
  "hero.kicker": "Every book leaves a line in you",
  "hero.h1a": "What did your favorite book leave in ",
  "hero.h1b": "you",
  "hero.h1c": "?",
  "hero.sub": "Write one sentence. Your name goes in the print. You get a card worth sharing, and there's no account anywhere.",
  "hero.searchLabel": "Type a book you love",
  "hero.searchPlaceholder": "Type a book you love…",
  "hero.searchCta": "Find my line",
  "hero.noIdea": "No idea?",
  "hero.surprise": "Surprise me",
  "hero.surpriseNote": ", one click, a random shelf.",
  "hero.stat.books": "books",
  "hero.stat.lines": "lines in the margins",
  "hero.stat.next": "yours is next",
  "hero.today": "Today's front page, carried by {n}",
  "hero.loop": "What would your line say? →",

  // feeds
  "feed.fresh": "Fresh from the margins",
  "feed.live": "live, just carried",
  "feed.margins": "From the margins",
  "feed.sorted": "sorted by underlines",
  "feed.liveShort": "live",
  "feed.offline": "offline shelf",
  "feed.count": "{n} {lines} · {sort} · {state}",
  "feed.line": "line",
  "feed.lines": "lines",
  "feed.empty.title": "No lines yet.",
  "feed.empty.sub": "This one's margins are still clean. Yours could be the first sentence ever filed here.",

  // ink band
  "band.title": "Three steps. No accounts.",
  "band.1.t": "Pick a book",
  "band.1.d": "Classics, modern favorites, poetry, ideas. If a book is missing, shelve it yourself.",
  "band.2.t": "Write the one line",
  "band.2.d": "The sentence you'd underline, in your own words. Short is fine. So is all two hundred characters.",
  "band.3.t": "Stamp it, pass it on",
  "band.3.d": "Your name goes in the print. Save the card, share the link. New lines show up here live.",
  "band.note": "Your line joins the public margin under your name. That's the whole idea.",

  // shelf
  "shelf.title": "The shelf",
  "shelf.sub": "Find your book, or add the one that's missing. Then write the line only you would write.",
  "shelf.est": "Est. by readers",
  "shelf.searchLabel": "Search the shelf",
  "shelf.placeholder": "Search a title, an author, a feeling…",
  "shelf.add": "+ Add a book",
  "shelf.close": "Close",
  "shelf.missing": "Missing from the shelf? Put it there.",
  "shelf.fTitle": "Title",
  "shelf.fAuthor": "Author",
  "shelf.fYear": "Year",
  "shelf.shelve": "Shelve it",
  "shelf.shelving": "Shelving…",
  "shelf.count.one": "{n} book",
  "shelf.count.many": "{n} books",
  "shelf.for": " for “{q}”",
  "shelf.offline": " · live shelf offline",
  "shelf.empty.title": "Not on this shelf yet.",
  "shelf.empty.cta": "Add “{q}” yourself",

  // tags
  "tag.all": "all",
  "tag.fiction": "fiction",
  "tag.classic": "classic",
  "tag.philosophy": "philosophy",
  "tag.psychology": "psychology",
  "tag.poetry": "poetry",
  "tag.fantasy": "fantasy",
  "tag.scifi": "scifi",
  "tag.memoir": "memoir",
  "tag.self": "self",
  "tag.money": "money",
  "tag.play": "play",
  "tag.bangla": "bangla",
  "tag.adventure": "adventure",
  "tag.nature": "nature",
  "tag.humor": "humor",
  "tag.children": "children",
  "tag.history": "history",
  "tag.science": "science",
  "tag.work": "work",
  "tag.reader-added": "by readers",

  // book page
  "book.intro": "Skip the plot, everyone can find that. Readers keep the residue here: the sentence that survived after the cover closed.",
  "book.cta": "Write your line",
  "book.find": "Find the book",
  "book.ol": "read or borrow free",
  "book.ia": "free copies & audio",
  "book.shop": "buy, supports indies",
  "book.wc": "find it near you",
  "book.writeQ": "What did {title} leave in you?",
  "book.writeSub": "One sentence. Forget the review voice. Write the line you'd underline and whisper to a friend on the train.",

  // composer
  "c.1": "01. The line it left in you",
  "c.1.ph": "The sentence you'd underline, in your own hand…",
  "c.2": "02. Sign it",
  "c.2.ph": "The name as it should appear in print",
  "c.2.note": "No account. Your name is remembered on this device only.",
  "c.3": "03. Choose the ink",
  "ink.paper": "Paper",
  "ink.midnight": "Midnight",
  "ink.moss": "Moss",
  "c.submit": "Stamp it & pass it on",
  "c.stamping": "Stamping…",
  "c.note": "No account, ever. Your line joins the public margin under your name.",
  "c.proof": "Live proof",
  "err.line": "Write the line first.",
  "err.name": "Sign your name, that's the whole point.",
  "err.length": "Lines carry at most 220 characters.",
  "err.nameLength": "Names are at most 24 characters.",
  "err.generic": "Something smudged. Try again.",

  // card page
  "card.kicker": "This line is yours now",
  "card.travel": "The card travels with your name in the print. Whoever it reaches is one book further along.",
  "card.loop.h": "What did {title} leave in you?",
  "card.loop.sub": "{n} carried one line out. There's at least one more in there with your name on it.",
  "card.loop.cta": "Write your line",
  "card.more": "More lines carried out of {title}",

  // share
  "share.save": "Save the card",
  "share.saving": "Printing…",
  "share.copy": "Copy link",
  "share.copied": "Copied ✓",
  "share.share": "Share…",
  "share.x": "Post on X",
  "share.wa": "WhatsApp",

  // votes
  "vote.underline": "Underline",
  "vote.underlined": "Underlined",
  "vote.none": "not yet underlined",
  "vote.once": "underlined once",
  "vote.many": "underlined ×{n}",

  // not found
  "nf.kicker": "404, not in the ledger",
  "nf.title": "This page was never carried out.",
  "nf.sub": "The line you're after may have been mistyped, or it was never written. There are more on the shelf.",
  "nf.cta": "Back to the shelf",
};

const BN: Dict = {
  "brand.tagline": "বই তোমাকে যে লাইনটা দিয়ে গেছে",

  "nav.shelf": "শেলফ",
  "nav.myLines": "আমার লাইন",
  "nav.write": "তোমার লাইন লেখো",

  "footer.tag": "প্রতিটি বই তোমাকে একটা লাইন দিয়ে যায়। তোমারটাও পাঠিয়ে দাও।",
  "footer.pick": "বই খোঁজো",
  "footer.mine": "আমার লাইন",
  "footer.source": "সোর্স",

  "hero.kicker": "প্রতিটি বই তোমাকে একটা লাইন দিয়ে যায়",
  "hero.h1a": "তোমার প্রিয় বই রেখে গেছে ",
  "hero.h1b": "কোন লাইন",
  "hero.h1c": "?",
  "hero.sub": "একটা বাক্য লেখো। ছাপায় তোমার নাম যাবে। পাওয়ার জন্য পাবে শেয়ার করার মতো একটা কার্ড, আর কোথাও কোনো অ্যাকাউন্ট লাগবে না।",
  "hero.searchLabel": "তোমার প্রিয় একটা বই লেখো",
  "hero.searchPlaceholder": "তোমার প্রিয় একটা বই লেখো…",
  "hero.searchCta": "লাইনটা খুঁজি",
  "hero.noIdea": "ভাবতে পারছ না?",
  "hero.surprise": "এলোমেলো একটা নাও",
  "hero.surpriseNote": ", এক ক্লিকে, র‍্যান্ডম একটা শেলফ।",
  "hero.stat.books": "বই",
  "hero.stat.lines": "লাইন মার্জিনে",
  "hero.stat.next": "পরেরটা তোমার",
  "hero.today": "আজকের প্রথম পাতা, লিখেছে {n}",
  "hero.loop": "তোমার লাইনটা কী হত? →",

  "feed.fresh": "মার্জিন থেকে টাটকা",
  "feed.live": "লাইভ, সদ্য লেখা",
  "feed.margins": "মার্জিন থেকে",
  "feed.sorted": "আন্ডারলাইন অনুযায়ী সাজানো",
  "feed.liveShort": "লাইভ",
  "feed.offline": "অফলাইন শেলফ",
  "feed.count": "{n} {lines} · {sort} · {state}",
  "feed.line": "লাইন",
  "feed.lines": "লাইন",
  "feed.empty.title": "এখনো কোনো লাইন নেই।",
  "feed.empty.sub": "বইটার মার্জিন এখনো পরিষ্কার। এখানে প্রথম বাক্যটা তোমারই হতে পারে।",

  "band.title": "তিন ধাপ। কোনো অ্যাকাউন্ট নেই।",
  "band.1.t": "বই বেছে নাও",
  "band.1.d": "ক্লাসিক, আধুনিক প্রিয়, কবিতা, দর্শন। বইটা শেলফে না থাকলে নিজেই তুলে দাও।",
  "band.2.t": "এক লাইন লেখো",
  "band.2.d": "যে বাক্যটা তুমি আন্ডারলাইন করতে, নিজের ভাষায়। ছোটটাও চলবে, দুইশো অক্ষরেরটাও।",
  "band.3.t": "সিল মারো, পাঠিয়ে দাও",
  "band.3.d": "ছাপায় তোমার নাম যাবে। কার্ড সেভ করো, লিংক শেয়ার করো। নতুন লাইন এখানে লাইভ আসে।",
  "band.note": "তোমার লাইন পাবলিক মার্জিনে যোগ হয় তোমার নামে। এটাই পুরো ব্যাপার।",

  "shelf.title": "শেলফ",
  "shelf.sub": "তোমার বই খোঁজো, না থাকলে যোগ করো। তারপর লেখো শুধু সেই লাইন, যেটা শুধু তুমিই লিখতে পারো।",
  "shelf.est": "পাঠকদের দিয়ে গড়া",
  "shelf.searchLabel": "শেলফে খোঁজো",
  "shelf.placeholder": "বইয়ের নাম, লেখক, বা অনুভূতি লেখো…",
  "shelf.add": "+ বই যোগ করো",
  "shelf.close": "বন্ধ",
  "shelf.missing": "শেলফে নেই? তুলে দাও।",
  "shelf.fTitle": "বইয়ের নাম",
  "shelf.fAuthor": "লেখক",
  "shelf.fYear": "সাল",
  "shelf.shelve": "শেলফে তুলো",
  "shelf.shelving": "তুলছি…",
  "shelf.count.one": "{n} বই",
  "shelf.count.many": "{n} বই",
  "shelf.for": ", “{q}”",
  "shelf.offline": " · লাইভ শেলফ অফলাইন",
  "shelf.empty.title": "শেলফে নেই এখনো।",
  "shelf.empty.cta": "“{q}” নিজেই যোগ করো",

  "tag.all": "সব",
  "tag.fiction": "ফিকশন",
  "tag.classic": "ক্লাসিক",
  "tag.philosophy": "দর্শন",
  "tag.psychology": "সাইকোলজি",
  "tag.poetry": "কবিতা",
  "tag.fantasy": "ফ্যান্টাসি",
  "tag.scifi": "সাই-ফাই",
  "tag.memoir": "স্মৃতিকথা",
  "tag.self": "সেল্ফ",
  "tag.money": "অর্থ",
  "tag.play": "নাটক",
  "tag.bangla": "বাংলা",
  "tag.adventure": "অ্যাডভেঞ্চার",
  "tag.nature": "প্রকৃতি",
  "tag.humor": "রসিকতা",
  "tag.children": "শিশু",
  "tag.history": "ইতিহাস",
  "tag.science": "বিজ্ঞান",
  "tag.work": "কাজ",
  "tag.reader-added": "পাঠকদের",

  "book.intro": "কাহিনি বাদ দাও, সেটা সবাই পাবে। পাঠকরা এখানে রাখে অবশিষ্ট অনুভূতিটা: খোলস বন্ধ হওয়ার পরেও যে বাক্য টিকে থাকে।",
  "book.cta": "তোমার লাইন লেখো",
  "book.find": "বইটা খোঁজো",
  "book.ol": "বিনামূল্যে পড়া বা ধার",
  "book.ia": "ফ্রি কপি ও অডিও",
  "book.shop": "কিনুন, স্বাধীন দোকান বাঁচে",
  "book.wc": "কাছে খুঁজে দেখো",
  "book.writeQ": "{title} তোমাকে কী দিয়ে গেছে?",
  "book.writeSub": "একটা বাক্য। রিভিউয়ের ভাষা বাদ দাও। লেখো সেই লাইন, যেটা আন্ডারলাইন করে ট্রেনে বন্ধুকে ফিসফিস করে বলতে চাও।",

  "c.1": "০$১. বইটা তোমাকে যে লাইন দিয়ে গেছে",
  "c.1.ph": "যে বাক্যটা তুমি আন্ডারলাইন করতে, নিজের হাতে…",
  "c.2": "০$১. নাম লেখো",
  "c.2.ph": "ছাপায় যে নামটা দেখতে চাও",
  "c.2.note": "কোনো অ্যাকাউন্ট নেই। নামটা শুধু এই ডিভাইসে মনে রাখা হয়।",
  "c.3": "০$১. কালি বাছো",
  "ink.paper": "পেপার",
  "ink.midnight": "মধ্যরাত",
  "ink.moss": "মস",
  "c.submit": "সিল মারো ও পাঠিয়ে দাও",
  "c.stamping": "ছাপাচ্ছি…",
  "c.note": "কখনো অ্যাকাউন্ট নেই। তোমার লাইন পাবলিক মার্জিনে যোগ হয় তোমার নামে।",
  "c.proof": "সরাসরি নমুনা",
  "err.line": "আগে লাইনটা লেখো।",
  "err.name": "নাম লেখো, এটাই তো মূল কথা।",
  "err.length": "লাইনে সর্বোচ্চ ২২০ অক্ষর।",
  "err.nameLength": "নামে সর্বোচ্চ ২৪ অক্ষর।",
  "err.generic": "কিছু একটা ঝাপসা হয়েছে। আবার চেষ্টা করো।",

  "card.kicker": "এই লাইনটা এখন তোমার",
  "card.travel": "কার্ডটা ছাপায় তোমার নাম নিয়ে চলে। যে-ই পাবে, সে একটা বই এগিয়ে থাকবে।",
  "card.loop.h": "{title} তোমাকে কী দিয়ে গেছে?",
  "card.loop.sub": "{n} একটা লাইন নিয়ে গেছে। ভেতরে আরও অন্তত একটা আছে, তোমার নামে।",
  "card.loop.cta": "তোমার লাইন লেখো",
  "card.more": "{title} থেকে আরও লাইন",

  "share.save": "কার্ড সেভ করো",
  "share.saving": "ছাপছি…",
  "share.copy": "লিংক কপি",
  "share.copied": "কপি হয়েছে ✓",
  "share.share": "শেয়ার…",
  "share.x": "X-এ পোস্ট",
  "share.wa": "হোয়াটসঅ্যাপ",

  "vote.underline": "আন্ডারলাইন",
  "vote.underlined": "আন্ডারলাইন ✓",
  "vote.none": "এখনো আন্ডারলাইন নেই",
  "vote.once": "একবার আন্ডারলাইন",
  "vote.many": "আন্ডারলাইন ×{n}",

  "nf.kicker": "৪০৪, খাতায় নেই",
  "nf.title": "এই পাতাটা কোনোদিন বাইরে আসেনি।",
  "nf.sub": "লাইনটা ভুল টাইপ হয়েছে, নয়তো কোনোদিন লেখাই হয়নি। শেলফে আরও আছে।",
  "nf.cta": "শেলফে ফিরে যাও",
};

const DICTS: Record<Locale, Dict> = { en: EN, bn: BN };

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  let s = DICTS[locale]?.[key] ?? EN[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

/** Bangla numerals for bn locale, counts feel native. */
export function numFor(n: number, locale: Locale): string {
  const s = String(n);
  if (locale !== "bn") return s;
  return s.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
}

export const LOCALE_COOKIE = "carried-locale";
