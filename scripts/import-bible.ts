/**
 * Imports the full World English Bible (WEB) text into the `verses` table.
 *
 * Source: bolls.life's public WEB API (https://bolls.life/get-text/WEB/{book}/{chapter}/),
 * a free, no-auth-required bulk source for the WEB translation. Run this once
 * after migrations are applied, and re-run any time to safely re-sync text
 * (upserts on book_number+chapter_number+verse_number).
 *
 * Usage: npm run import-bible
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { BIBLE_BOOKS, canonicalKey } from "../src/lib/bible-books";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

type BollsVerse = { pk: number; verse: number; text: string };

const BOLLS_BASE = "https://bolls.life/get-text/WEB";

function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchChapter(bookId: number, chapter: number, attempt = 1): Promise<BollsVerse[]> {
  const url = `${BOLLS_BASE}/${bookId}/${chapter}/`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as BollsVerse[];
  } catch (err) {
    if (attempt >= 3) throw err;
    await sleep(500 * attempt);
    return fetchChapter(bookId, chapter, attempt + 1);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  let totalInserted = 0;

  for (const book of BIBLE_BOOKS) {
    console.log(`Importing ${book.name} (${book.chapters} chapters)…`);

    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      const verses = await fetchChapter(book.number, chapter);

      if (verses.length === 0) {
        console.warn(`  ! ${book.name} ${chapter}: no verses returned, skipping`);
        continue;
      }

      const rows = verses.map((v) => ({
        canonical_key: canonicalKey(book.slug, chapter, v.verse),
        book_name: book.name,
        book_slug: book.slug,
        book_number: book.number,
        chapter_number: chapter,
        verse_number: v.verse,
        verse_text: stripMarkup(v.text),
        translation: "WEB",
      }));

      const { error } = await supabase
        .from("verses")
        .upsert(rows, { onConflict: "book_number,chapter_number,verse_number" });

      if (error) {
        console.error(`  ! Failed to insert ${book.name} ${chapter}:`, error.message);
        process.exitCode = 1;
        continue;
      }

      totalInserted += rows.length;
      // Be polite to the free public API.
      await sleep(60);
    }
  }

  console.log(`\nDone. Upserted ${totalInserted} verses.`);
  await verify();
}

async function verify() {
  const { count: total } = await supabase.from("verses").select("id", { count: "exact", head: true });
  const { count: nullText } = await supabase
    .from("verses")
    .select("id", { count: "exact", head: true })
    .is("verse_text", null);
  const { data: bookNumbers } = await supabase.from("verses").select("book_number");
  const distinctBooks = new Set((bookNumbers ?? []).map((r) => r.book_number)).size;

  console.log("\n--- Verification ---");
  console.log(`Total verses:     ${total}`);
  console.log(`Distinct books:   ${distinctBooks} / 66`);
  console.log(`Null verse_text:  ${nullText}`);

  if (total !== 31102) {
    console.warn(
      `Note: expected ~31,102 verses for the WEB Protestant canon; got ${total}. ` +
        `Some chapters may have failed — re-run this script (it's idempotent) to retry.`
    );
  }
  if (distinctBooks !== 66) {
    console.warn(`Expected 66 books, found ${distinctBooks}.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
