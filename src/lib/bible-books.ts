// Canonical 66-book Protestant Bible ordering, matching the WEB numbering
// used by the import pipeline (see scripts/import-bible.ts). This list is
// static reference data — the source of truth for verse *text* is always
// the `verses` table.

export type BibleBook = {
  number: number;
  name: string;
  slug: string;
  testament: "OT" | "NT";
  chapters: number;
};

export const BIBLE_BOOKS: BibleBook[] = [
  { number: 1, name: "Genesis", slug: "genesis", testament: "OT", chapters: 50 },
  { number: 2, name: "Exodus", slug: "exodus", testament: "OT", chapters: 40 },
  { number: 3, name: "Leviticus", slug: "leviticus", testament: "OT", chapters: 27 },
  { number: 4, name: "Numbers", slug: "numbers", testament: "OT", chapters: 36 },
  { number: 5, name: "Deuteronomy", slug: "deuteronomy", testament: "OT", chapters: 34 },
  { number: 6, name: "Joshua", slug: "joshua", testament: "OT", chapters: 24 },
  { number: 7, name: "Judges", slug: "judges", testament: "OT", chapters: 21 },
  { number: 8, name: "Ruth", slug: "ruth", testament: "OT", chapters: 4 },
  { number: 9, name: "1 Samuel", slug: "1-samuel", testament: "OT", chapters: 31 },
  { number: 10, name: "2 Samuel", slug: "2-samuel", testament: "OT", chapters: 24 },
  { number: 11, name: "1 Kings", slug: "1-kings", testament: "OT", chapters: 22 },
  { number: 12, name: "2 Kings", slug: "2-kings", testament: "OT", chapters: 25 },
  { number: 13, name: "1 Chronicles", slug: "1-chronicles", testament: "OT", chapters: 29 },
  { number: 14, name: "2 Chronicles", slug: "2-chronicles", testament: "OT", chapters: 36 },
  { number: 15, name: "Ezra", slug: "ezra", testament: "OT", chapters: 10 },
  { number: 16, name: "Nehemiah", slug: "nehemiah", testament: "OT", chapters: 13 },
  { number: 17, name: "Esther", slug: "esther", testament: "OT", chapters: 10 },
  { number: 18, name: "Job", slug: "job", testament: "OT", chapters: 42 },
  { number: 19, name: "Psalms", slug: "psalms", testament: "OT", chapters: 150 },
  { number: 20, name: "Proverbs", slug: "proverbs", testament: "OT", chapters: 31 },
  { number: 21, name: "Ecclesiastes", slug: "ecclesiastes", testament: "OT", chapters: 12 },
  { number: 22, name: "Song of Solomon", slug: "song-of-solomon", testament: "OT", chapters: 8 },
  { number: 23, name: "Isaiah", slug: "isaiah", testament: "OT", chapters: 66 },
  { number: 24, name: "Jeremiah", slug: "jeremiah", testament: "OT", chapters: 52 },
  { number: 25, name: "Lamentations", slug: "lamentations", testament: "OT", chapters: 5 },
  { number: 26, name: "Ezekiel", slug: "ezekiel", testament: "OT", chapters: 48 },
  { number: 27, name: "Daniel", slug: "daniel", testament: "OT", chapters: 12 },
  { number: 28, name: "Hosea", slug: "hosea", testament: "OT", chapters: 14 },
  { number: 29, name: "Joel", slug: "joel", testament: "OT", chapters: 3 },
  { number: 30, name: "Amos", slug: "amos", testament: "OT", chapters: 9 },
  { number: 31, name: "Obadiah", slug: "obadiah", testament: "OT", chapters: 1 },
  { number: 32, name: "Jonah", slug: "jonah", testament: "OT", chapters: 4 },
  { number: 33, name: "Micah", slug: "micah", testament: "OT", chapters: 7 },
  { number: 34, name: "Nahum", slug: "nahum", testament: "OT", chapters: 3 },
  { number: 35, name: "Habakkuk", slug: "habakkuk", testament: "OT", chapters: 3 },
  { number: 36, name: "Zephaniah", slug: "zephaniah", testament: "OT", chapters: 3 },
  { number: 37, name: "Haggai", slug: "haggai", testament: "OT", chapters: 2 },
  { number: 38, name: "Zechariah", slug: "zechariah", testament: "OT", chapters: 14 },
  { number: 39, name: "Malachi", slug: "malachi", testament: "OT", chapters: 4 },
  { number: 40, name: "Matthew", slug: "matthew", testament: "NT", chapters: 28 },
  { number: 41, name: "Mark", slug: "mark", testament: "NT", chapters: 16 },
  { number: 42, name: "Luke", slug: "luke", testament: "NT", chapters: 24 },
  { number: 43, name: "John", slug: "john", testament: "NT", chapters: 21 },
  { number: 44, name: "Acts", slug: "acts", testament: "NT", chapters: 28 },
  { number: 45, name: "Romans", slug: "romans", testament: "NT", chapters: 16 },
  { number: 46, name: "1 Corinthians", slug: "1-corinthians", testament: "NT", chapters: 16 },
  { number: 47, name: "2 Corinthians", slug: "2-corinthians", testament: "NT", chapters: 13 },
  { number: 48, name: "Galatians", slug: "galatians", testament: "NT", chapters: 6 },
  { number: 49, name: "Ephesians", slug: "ephesians", testament: "NT", chapters: 6 },
  { number: 50, name: "Philippians", slug: "philippians", testament: "NT", chapters: 4 },
  { number: 51, name: "Colossians", slug: "colossians", testament: "NT", chapters: 4 },
  { number: 52, name: "1 Thessalonians", slug: "1-thessalonians", testament: "NT", chapters: 5 },
  { number: 53, name: "2 Thessalonians", slug: "2-thessalonians", testament: "NT", chapters: 3 },
  { number: 54, name: "1 Timothy", slug: "1-timothy", testament: "NT", chapters: 6 },
  { number: 55, name: "2 Timothy", slug: "2-timothy", testament: "NT", chapters: 4 },
  { number: 56, name: "Titus", slug: "titus", testament: "NT", chapters: 3 },
  { number: 57, name: "Philemon", slug: "philemon", testament: "NT", chapters: 1 },
  { number: 58, name: "Hebrews", slug: "hebrews", testament: "NT", chapters: 13 },
  { number: 59, name: "James", slug: "james", testament: "NT", chapters: 5 },
  { number: 60, name: "1 Peter", slug: "1-peter", testament: "NT", chapters: 5 },
  { number: 61, name: "2 Peter", slug: "2-peter", testament: "NT", chapters: 3 },
  { number: 62, name: "1 John", slug: "1-john", testament: "NT", chapters: 5 },
  { number: 63, name: "2 John", slug: "2-john", testament: "NT", chapters: 1 },
  { number: 64, name: "3 John", slug: "3-john", testament: "NT", chapters: 1 },
  { number: 65, name: "Jude", slug: "jude", testament: "NT", chapters: 1 },
  { number: 66, name: "Revelation", slug: "revelation", testament: "NT", chapters: 22 },
];

export const BOOK_BY_SLUG = new Map(BIBLE_BOOKS.map((b) => [b.slug, b]));
export const BOOK_BY_NUMBER = new Map(BIBLE_BOOKS.map((b) => [b.number, b]));

// Short uppercase codes used to build canonical_key values, e.g. "JOHN.3.16".
// Not a formal standard — just needs to be short, stable, and unique.
const ABBR_BY_SLUG: Record<string, string> = {
  genesis: "GEN", exodus: "EXO", leviticus: "LEV", numbers: "NUM", deuteronomy: "DEU",
  joshua: "JOS", judges: "JDG", ruth: "RUT", "1-samuel": "1SA", "2-samuel": "2SA",
  "1-kings": "1KI", "2-kings": "2KI", "1-chronicles": "1CH", "2-chronicles": "2CH",
  ezra: "EZR", nehemiah: "NEH", esther: "EST", job: "JOB", psalms: "PSA",
  proverbs: "PRO", ecclesiastes: "ECC", "song-of-solomon": "SNG", isaiah: "ISA",
  jeremiah: "JER", lamentations: "LAM", ezekiel: "EZK", daniel: "DAN", hosea: "HOS",
  joel: "JOL", amos: "AMO", obadiah: "OBA", jonah: "JON", micah: "MIC", nahum: "NAM",
  habakkuk: "HAB", zephaniah: "ZEP", haggai: "HAG", zechariah: "ZEC", malachi: "MAL",
  matthew: "MAT", mark: "MRK", luke: "LUK", john: "JOHN", acts: "ACT", romans: "ROM",
  "1-corinthians": "1CO", "2-corinthians": "2CO", galatians: "GAL", ephesians: "EPH",
  philippians: "PHP", colossians: "COL", "1-thessalonians": "1TH", "2-thessalonians": "2TH",
  "1-timothy": "1TI", "2-timothy": "2TI", titus: "TIT", philemon: "PHM", hebrews: "HEB",
  james: "JAS", "1-peter": "1PE", "2-peter": "2PE", "1-john": "1JN", "2-john": "2JN",
  "3-john": "3JN", jude: "JUD", revelation: "REV",
};

export function bookAbbreviation(slug: string): string {
  return ABBR_BY_SLUG[slug] ?? slug.toUpperCase();
}

export function canonicalKey(bookSlug: string, chapter: number, verse: number): string {
  return `${bookAbbreviation(bookSlug)}.${chapter}.${verse}`;
}

export function slugify(bookName: string): string {
  return bookName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Canonical book groupings — the leaderboard's category filter pills.
// ---------------------------------------------------------------------------
export type BookSection = {
  slug: string;
  label: string;
  icon: string;
  bookSlugs: string[];
};

export const BOOK_SECTIONS: BookSection[] = [
  {
    slug: "pentateuch",
    label: "Pentateuch",
    icon: "📜",
    bookSlugs: ["genesis", "exodus", "leviticus", "numbers", "deuteronomy"],
  },
  {
    slug: "history",
    label: "History",
    icon: "🏛️",
    bookSlugs: [
      "joshua", "judges", "ruth", "1-samuel", "2-samuel", "1-kings", "2-kings",
      "1-chronicles", "2-chronicles", "ezra", "nehemiah", "esther",
    ],
  },
  {
    slug: "wisdom",
    label: "Wisdom",
    icon: "🕊️",
    bookSlugs: ["job", "psalms", "proverbs", "ecclesiastes", "song-of-solomon"],
  },
  {
    slug: "major-prophets",
    label: "Major Prophets",
    icon: "🔥",
    bookSlugs: ["isaiah", "jeremiah", "lamentations", "ezekiel", "daniel"],
  },
  {
    slug: "minor-prophets",
    label: "Minor Prophets",
    icon: "📯",
    bookSlugs: [
      "hosea", "joel", "amos", "obadiah", "jonah", "micah", "nahum",
      "habakkuk", "zephaniah", "haggai", "zechariah", "malachi",
    ],
  },
  {
    slug: "gospels",
    label: "Gospels",
    icon: "✝️",
    bookSlugs: ["matthew", "mark", "luke", "john"],
  },
  {
    slug: "acts",
    label: "Acts",
    icon: "🔥",
    bookSlugs: ["acts"],
  },
  {
    slug: "epistles",
    label: "Epistles",
    icon: "✉️",
    bookSlugs: [
      "romans", "1-corinthians", "2-corinthians", "galatians", "ephesians",
      "philippians", "colossians", "1-thessalonians", "2-thessalonians",
      "1-timothy", "2-timothy", "titus", "philemon", "hebrews", "james",
      "1-peter", "2-peter", "1-john", "2-john", "3-john", "jude",
    ],
  },
  {
    slug: "revelation",
    label: "Revelation",
    icon: "👁️",
    bookSlugs: ["revelation"],
  },
];

export const SECTION_BY_BOOK_SLUG = new Map(
  BOOK_SECTIONS.flatMap((section) => section.bookSlugs.map((slug) => [slug, section]))
);

export const SECTION_BY_SLUG = new Map(BOOK_SECTIONS.map((s) => [s.slug, s]));

/** Book slugs belonging to a section, or null when the section is unknown/unset ("All"). */
export function bookSlugsForSection(sectionSlug: string | null | undefined): string[] | null {
  if (!sectionSlug) return null;
  return SECTION_BY_SLUG.get(sectionSlug)?.bookSlugs ?? null;
}
