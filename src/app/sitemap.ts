import type { MetadataRoute } from "next";
import { supabaseServer } from "@/lib/supabase/server";

const CHUNK_SIZE = 5000;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bible-rank.com";

export async function generateSitemaps() {
  try {
    const { count, error } = await supabaseServer()
      .from("verses")
      .select("id", { count: "exact", head: true });

    if (error || !count) return [{ id: 0 }];

    const chunks = Math.max(1, Math.ceil(count / CHUNK_SIZE));
    return Array.from({ length: chunks }, (_, id) => ({ id }));
  } catch {
    // Supabase env vars not configured (e.g. local build without secrets).
    return [{ id: 0 }];
  }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  if (id === 0) {
    const staticEntries: MetadataRoute.Sitemap = [
      { url: siteUrl, changeFrequency: "hourly", priority: 1 },
      { url: `${siteUrl}/leaderboard`, changeFrequency: "hourly", priority: 0.9 },
      { url: `${siteUrl}/search`, changeFrequency: "daily", priority: 0.6 },
      { url: `${siteUrl}/how-it-works`, changeFrequency: "monthly", priority: 0.3 },
      { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.3 },
    ];
    const verseEntries = await fetchVerseChunk(id);
    return [...staticEntries, ...verseEntries];
  }

  return fetchVerseChunk(id);
}

async function fetchVerseChunk(id: number): Promise<MetadataRoute.Sitemap> {
  const from = id * CHUNK_SIZE;
  const to = from + CHUNK_SIZE - 1;

  try {
    const { data, error } = await supabaseServer()
      .from("verses")
      .select("book_slug, chapter_number, verse_number")
      .order("book_number", { ascending: true })
      .order("chapter_number", { ascending: true })
      .order("verse_number", { ascending: true })
      .range(from, to);

    if (error || !data) return [];

    return data.map((v) => ({
      url: `${siteUrl}/verse/${v.book_slug}/${v.chapter_number}/${v.verse_number}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch {
    return [];
  }
}
