import "server-only";
import { parseReference } from "./reference-parser";
import { getVerseByReference, getVerseRank, semanticSearch } from "./verses";
import { embedText } from "./embeddings";
import { toVerseDTO, type VerseDTO } from "@/types/db";

export type SearchOutcome =
  | { mode: "exact"; results: VerseDTO[] }
  | { mode: "invalid_reference"; results: [] }
  | { mode: "semantic"; results: VerseDTO[] }
  | { mode: "no_confidence"; results: [] };

const SIMILARITY_THRESHOLD = 0.3;

export async function performSearch(rawQuery: string): Promise<SearchOutcome> {
  const query = rawQuery.trim();

  const parsed = parseReference(query);
  if (parsed) {
    const row = await getVerseByReference(parsed.book.slug, parsed.chapter, parsed.verse);
    if (!row) {
      return { mode: "invalid_reference", results: [] };
    }
    const rank = await getVerseRank(row.id);
    return { mode: "exact", results: [toVerseDTO(row, rank)] };
  }

  const embedding = await embedText(query);
  const matches = await semanticSearch(embedding, 5, SIMILARITY_THRESHOLD);

  if (matches.length === 0) {
    return { mode: "no_confidence", results: [] };
  }

  const results: VerseDTO[] = matches.map((m) => ({
    id: m.id,
    canonicalKey: m.canonical_key,
    reference: `${m.book_name} ${m.chapter_number}:${m.verse_number}`,
    bookSlug: m.book_slug,
    chapter: m.chapter_number,
    verse: m.verse_number,
    text: m.verse_text,
    rank: m.total_contributed_cents > 0 ? null : null, // resolved below
    totalContributedCents: m.total_contributed_cents,
  }));

  // Resolve real ranks for verses that have funding; unfunded stay "Unranked".
  await Promise.all(
    results.map(async (r, i) => {
      if (matches[i].total_contributed_cents > 0) {
        results[i] = { ...r, rank: await getVerseRank(r.id) };
      }
    })
  );

  return { mode: "semantic", results };
}
