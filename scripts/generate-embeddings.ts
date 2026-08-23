/**
 * Generates embeddings for every verse that doesn't have one yet, and stores
 * them in verses.embedding. Safe to re-run — only verses with a null
 * embedding are processed, so this never regenerates existing embeddings.
 *
 * Usage: npm run generate-embeddings
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

if (!SUPABASE_URL || !SERVICE_KEY || !EMBEDDING_API_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or EMBEDDING_API_KEY in the environment."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const openai = new OpenAI({ apiKey: EMBEDDING_API_KEY });

const BATCH_SIZE = 100;

type VerseToEmbed = {
  id: string;
  book_name: string;
  chapter_number: number;
  verse_number: number;
  verse_text: string;
};

async function fetchBatch(): Promise<VerseToEmbed[]> {
  const { data, error } = await supabase
    .from("verses")
    .select("id, book_name, chapter_number, verse_number, verse_text")
    .is("embedding", null)
    .limit(BATCH_SIZE);

  if (error) throw error;
  return data ?? [];
}

async function embedBatch(verses: VerseToEmbed[]): Promise<number[][]> {
  const inputs = verses.map(
    (v) => `${v.book_name} ${v.chapter_number}:${v.verse_number}. ${v.verse_text}`
  );
  const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: inputs });
  return res.data.map((d) => d.embedding);
}

async function main() {
  let processed = 0;

  while (true) {
    const batch = await fetchBatch();
    if (batch.length === 0) break;

    const embeddings = await embedBatch(batch);

    await Promise.all(
      batch.map((verse, i) =>
        supabase
          .from("verses")
          .update({ embedding: embeddings[i] })
          .eq("id", verse.id)
      )
    );

    processed += batch.length;
    console.log(`Embedded ${processed} verses so far…`);
  }

  console.log(`\nDone. Embedded ${processed} verses.`);

  const { count: remaining } = await supabase
    .from("verses")
    .select("id", { count: "exact", head: true })
    .is("embedding", null);
  console.log(`Verses still missing an embedding: ${remaining}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
