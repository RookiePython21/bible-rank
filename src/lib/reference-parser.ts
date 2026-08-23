import { BIBLE_BOOKS, BOOK_BY_SLUG, type BibleBook } from "./bible-books";

// Maps a normalized (lowercase, no punctuation) book name or common
// abbreviation to its canonical slug. Extend as needed — this only affects
// *discovery* (parsing what a user typed); it can never create a verse.
const ALIASES: Record<string, string> = {};

function addAlias(alias: string, slug: string) {
  ALIASES[alias.toLowerCase().replace(/[.]/g, "").trim()] = slug;
}

for (const book of BIBLE_BOOKS) {
  addAlias(book.name, book.slug);
  addAlias(book.slug.replace(/-/g, " "), book.slug);
}

const EXTRA_ALIASES: [string, string][] = [
  ["gen", "genesis"], ["ge", "genesis"], ["gn", "genesis"],
  ["exo", "exodus"], ["ex", "exodus"],
  ["lev", "leviticus"], ["lv", "leviticus"],
  ["num", "numbers"], ["nm", "numbers"], ["nu", "numbers"],
  ["deut", "deuteronomy"], ["dt", "deuteronomy"],
  ["josh", "joshua"], ["jos", "joshua"],
  ["judg", "judges"], ["jdg", "judges"],
  ["ru", "ruth"],
  ["1 sam", "1-samuel"], ["1sam", "1-samuel"], ["1 sm", "1-samuel"], ["i samuel", "1-samuel"],
  ["2 sam", "2-samuel"], ["2sam", "2-samuel"], ["2 sm", "2-samuel"], ["ii samuel", "2-samuel"],
  ["1 kgs", "1-kings"], ["1kgs", "1-kings"], ["i kings", "1-kings"],
  ["2 kgs", "2-kings"], ["2kgs", "2-kings"], ["ii kings", "2-kings"],
  ["1 chron", "1-chronicles"], ["1chr", "1-chronicles"], ["i chronicles", "1-chronicles"],
  ["2 chron", "2-chronicles"], ["2chr", "2-chronicles"], ["ii chronicles", "2-chronicles"],
  ["ezr", "ezra"],
  ["neh", "nehemiah"],
  ["est", "esther"], ["esth", "esther"],
  ["jb", "job"],
  ["ps", "psalms"], ["psa", "psalms"], ["psalm", "psalms"], ["pslm", "psalms"],
  ["prov", "proverbs"], ["pr", "proverbs"], ["prv", "proverbs"],
  ["eccl", "ecclesiastes"], ["eccles", "ecclesiastes"], ["qoheleth", "ecclesiastes"],
  ["song", "song-of-solomon"], ["song of songs", "song-of-solomon"], ["sos", "song-of-solomon"], ["canticles", "song-of-solomon"],
  ["isa", "isaiah"], ["is", "isaiah"],
  ["jer", "jeremiah"], ["je", "jeremiah"],
  ["lam", "lamentations"],
  ["ezek", "ezekiel"], ["eze", "ezekiel"],
  ["dan", "daniel"], ["dn", "daniel"],
  ["hos", "hosea"],
  ["jl", "joel"],
  ["am", "amos"],
  ["obad", "obadiah"], ["ob", "obadiah"],
  ["jon", "jonah"],
  ["mic", "micah"],
  ["nah", "nahum"],
  ["hab", "habakkuk"],
  ["zeph", "zephaniah"], ["zep", "zephaniah"],
  ["hag", "haggai"],
  ["zech", "zechariah"], ["zec", "zechariah"],
  ["mal", "malachi"],
  ["matt", "matthew"], ["mt", "matthew"],
  ["mk", "mark"], ["mrk", "mark"],
  ["lk", "luke"], ["luk", "luke"],
  ["jn", "john"], ["jhn", "john"], ["jo", "john"],
  ["ac", "acts"],
  ["rom", "romans"], ["ro", "romans"],
  ["1 cor", "1-corinthians"], ["1cor", "1-corinthians"], ["i corinthians", "1-corinthians"],
  ["2 cor", "2-corinthians"], ["2cor", "2-corinthians"], ["ii corinthians", "2-corinthians"],
  ["gal", "galatians"],
  ["eph", "ephesians"],
  ["phil", "philippians"], ["php", "philippians"], ["pp", "philippians"],
  ["col", "colossians"],
  ["1 thess", "1-thessalonians"], ["1thess", "1-thessalonians"], ["i thessalonians", "1-thessalonians"],
  ["2 thess", "2-thessalonians"], ["2thess", "2-thessalonians"], ["ii thessalonians", "2-thessalonians"],
  ["1 tim", "1-timothy"], ["1tim", "1-timothy"], ["i timothy", "1-timothy"],
  ["2 tim", "2-timothy"], ["2tim", "2-timothy"], ["ii timothy", "2-timothy"],
  ["tit", "titus"],
  ["philem", "philemon"], ["phm", "philemon"],
  ["heb", "hebrews"],
  ["jas", "james"], ["jm", "james"],
  ["1 pet", "1-peter"], ["1pet", "1-peter"], ["i peter", "1-peter"],
  ["2 pet", "2-peter"], ["2pet", "2-peter"], ["ii peter", "2-peter"],
  ["1 jn", "1-john"], ["1jn", "1-john"], ["i john", "1-john"],
  ["2 jn", "2-john"], ["2jn", "2-john"], ["ii john", "2-john"],
  ["3 jn", "3-john"], ["3jn", "3-john"], ["iii john", "3-john"],
  ["jud", "jude"],
  ["rev", "revelation"], ["revelations", "revelation"], ["re", "revelation"],
];

for (const [alias, slug] of EXTRA_ALIASES) addAlias(alias, slug);

export type ParsedReference = {
  book: BibleBook;
  chapter: number;
  verse: number;
};

/**
 * Parses free text like "John 3:16", "1 Corinthians 13:4", "Psalm 23:4"
 * into a book/chapter/verse triple. Returns null if the text doesn't look
 * like a reference at all (callers should fall back to semantic search).
 * Does NOT verify the chapter/verse exists — callers must look that up
 * against the canonical `verses` table.
 */
export function parseReference(input: string): ParsedReference | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^((?:[1-3]\s?)?[a-zA-Z .]+?)\s+(\d{1,3})\s*[:.]\s*(\d{1,3})$/);
  if (!match) return null;

  const [, rawBook, rawChapter, rawVerse] = match;
  const normalized = rawBook.toLowerCase().replace(/[.]/g, "").replace(/\s+/g, " ").trim();

  const slug = ALIASES[normalized];
  if (!slug) return null;

  const book = BOOK_BY_SLUG.get(slug);
  if (!book) return null;

  const chapter = parseInt(rawChapter, 10);
  const verse = parseInt(rawVerse, 10);
  if (!Number.isFinite(chapter) || !Number.isFinite(verse) || chapter < 1 || verse < 1) {
    return null;
  }

  return { book, chapter, verse };
}
