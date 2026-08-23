// Shareable, human-readable identifier used in /checkout/[verse] URLs, e.g.
// "john-3-16" or "1-corinthians-13-4". Never trusted as-is for money amounts —
// callers must still resolve it against the canonical `verses` table.

export function toVerseSlug(bookSlug: string, chapter: number, verse: number): string {
  return `${bookSlug}-${chapter}-${verse}`;
}

export function parseVerseSlug(
  slug: string
): { bookSlug: string; chapter: number; verse: number } | null {
  const parts = slug.split("-");
  if (parts.length < 3) return null;

  const verse = parseInt(parts[parts.length - 1], 10);
  const chapter = parseInt(parts[parts.length - 2], 10);
  const bookSlug = parts.slice(0, parts.length - 2).join("-");

  if (!bookSlug || !Number.isFinite(chapter) || !Number.isFinite(verse)) return null;
  return { bookSlug, chapter, verse };
}
