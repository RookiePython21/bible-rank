import { unstable_cache } from "next/cache";
import { supabaseServer } from "./supabase/server";
import { supabaseAdmin } from "./supabase/admin";
import { TOPICS } from "./topics";
import type {
  VerseRow,
  LeaderboardRow,
  TodayLeaderboardRow,
  SearchMatchRow,
  ContributionRow,
  SiteStats,
  ImpactStats,
} from "@/types/db";

export async function getLeaderboard(
  limit = 25,
  offset = 0,
  bookSlugs?: string[]
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabaseServer().rpc("get_leaderboard", {
    p_limit: limit,
    p_offset: offset,
    p_book_slugs: bookSlugs ?? null,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderboardRow[];
}

export async function getLeaderboardPage(opts: {
  page: number;
  pageSize?: number;
  bookSlugs?: string[];
}): Promise<{ rows: LeaderboardRow[]; totalCount: number; totalPages: number }> {
  const pageSize = opts.pageSize ?? 50;
  const page = Math.max(1, opts.page);
  const rows = await getLeaderboard(pageSize, (page - 1) * pageSize, opts.bookSlugs);
  const totalCount = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { rows, totalCount, totalPages };
}

export async function getLeaderboardToday(
  limit = 25,
  offset = 0,
  bookSlugs?: string[]
): Promise<TodayLeaderboardRow[]> {
  const { data, error } = await supabaseServer().rpc("get_leaderboard_today", {
    p_limit: limit,
    p_offset: offset,
    p_book_slugs: bookSlugs ?? null,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as TodayLeaderboardRow[];
}

export async function getLeaderboardTodayPage(opts: {
  page: number;
  pageSize?: number;
  bookSlugs?: string[];
}): Promise<{ rows: TodayLeaderboardRow[]; totalCount: number; totalPages: number }> {
  const pageSize = opts.pageSize ?? 50;
  const page = Math.max(1, opts.page);
  const rows = await getLeaderboardToday(pageSize, (page - 1) * pageSize, opts.bookSlugs);
  const totalCount = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { rows, totalCount, totalPages };
}

export async function getLeaderboardByVerseIds(verseIds: string[], limit = 10): Promise<LeaderboardRow[]> {
  if (verseIds.length === 0) return [];
  const { data, error } = await supabaseServer().rpc("get_leaderboard_by_ids", {
    p_verse_ids: verseIds,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderboardRow[];
}

export async function getLeaderboardTodayByVerseIds(
  verseIds: string[],
  limit = 10
): Promise<TodayLeaderboardRow[]> {
  if (verseIds.length === 0) return [];
  const { data, error } = await supabaseServer().rpc("get_leaderboard_today_by_ids", {
    p_verse_ids: verseIds,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as TodayLeaderboardRow[];
}

/**
 * Leaderboard filtered to a curated emotion/topic's verses (see src/lib/topics.ts).
 * Ranks are the verses' true sitewide rank, not a position local to the topic. When
 * none of the topic's verses have been boosted, falls back to the unfiltered top list.
 */
export async function getTopicLeaderboard(
  topicSlug: string,
  opts: { today?: boolean; limit?: number } = {}
): Promise<{
  rows: LeaderboardRow[] | TodayLeaderboardRow[];
  isFallback: boolean;
  topicLabel: string;
} | null> {
  const topic = TOPICS[topicSlug];
  if (!topic) return null;
  const limit = opts.limit ?? 10;

  const found = await Promise.all(topic.refs.map((r) => getVerseByReference(r.bookSlug, r.chapter, r.verse)));
  const verseIds = found.filter((v): v is VerseRow => v !== null).map((v) => v.id);

  const rows = opts.today
    ? await getLeaderboardTodayByVerseIds(verseIds, limit)
    : await getLeaderboardByVerseIds(verseIds, limit);

  if (rows.length > 0) {
    return { rows, isFallback: false, topicLabel: topic.label };
  }

  const fallbackRows = opts.today ? await getLeaderboardToday(limit) : await getLeaderboard(limit);
  return { rows: fallbackRows, isFallback: true, topicLabel: topic.label };
}

export async function getSiteStats(): Promise<SiteStats> {
  const { data, error } = await supabaseServer().rpc("get_site_stats");
  if (error) throw new Error(error.message);
  const row = (data ?? [])[0] as
    | { total_visitors: number; launched_at: string; total_revenue_cents: number; highest_bid_cents: number }
    | undefined;
  return {
    totalVisitors: row?.total_visitors ?? 0,
    launchedAt: row?.launched_at ?? new Date().toISOString(),
    totalRevenueCents: row?.total_revenue_cents ?? 0,
    highestBidCents: row?.highest_bid_cents ?? 0,
  };
}

export const getImpactStats = unstable_cache(
  async (): Promise<ImpactStats> => {
    const { data, error } = await supabaseServer().rpc("get_impact_stats");
    if (error) throw new Error(error.message);
    const row = (data ?? [])[0] as
      | {
          verse_views: number;
          bible_searches: number;
          verses_supported: number;
          verses_shared: number;
          leaderboard_contributions_cents: number;
        }
      | undefined;
    return {
      verseViews: row?.verse_views ?? 0,
      bibleSearches: row?.bible_searches ?? 0,
      versesSupported: row?.verses_supported ?? 0,
      versesShared: row?.verses_shared ?? 0,
      leaderboardContributionsCents: row?.leaderboard_contributions_cents ?? 0,
    };
  },
  ["impact-stats"],
  { revalidate: 180 }
);

export async function logAnalyticsEvent(
  eventType: "verse_view" | "verse_share",
  verseId?: string,
  metadata?: Record<string, unknown>
) {
  // Analytics only — never blocks the request if it fails.
  try {
    await supabaseAdmin()
      .from("analytics_events")
      .insert({ event_type: eventType, verse_id: verseId ?? null, metadata: metadata ?? null });
  } catch {
    // no-op
  }
}

export async function incrementVisitorCount(): Promise<number> {
  const { data, error } = await supabaseAdmin().rpc("increment_visitor_count");
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

export async function incrementVerseClick(verseId: string): Promise<number> {
  const { data, error } = await supabaseAdmin().rpc("increment_verse_click", {
    p_verse_id: verseId,
  });
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

export async function getTopVerse(): Promise<LeaderboardRow | null> {
  const rows = await getLeaderboard(1, 0);
  return rows[0] ?? null;
}

export async function getTopTotalCents(): Promise<number> {
  const { data, error } = await supabaseServer().rpc("get_top_total");
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}

export async function getVerseRank(verseId: string): Promise<number | null> {
  const { data, error } = await supabaseServer().rpc("get_verse_rank", {
    p_verse_id: verseId,
  });
  if (error) throw new Error(error.message);
  return (data as number | null) ?? null;
}

export async function getVerseByReference(
  bookSlug: string,
  chapter: number,
  verse: number
): Promise<VerseRow | null> {
  const { data, error } = await supabaseServer()
    .from("verses")
    .select("*")
    .eq("book_slug", bookSlug)
    .eq("chapter_number", chapter)
    .eq("verse_number", verse)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as VerseRow) ?? null;
}

export async function getVerseById(verseId: string): Promise<VerseRow | null> {
  const { data, error } = await supabaseServer()
    .from("verses")
    .select("*")
    .eq("id", verseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as VerseRow) ?? null;
}

/** Distinct chapter numbers that exist for a book — powers the chapter selector. */
export async function getChaptersForBook(bookSlug: string): Promise<number[]> {
  const { data, error } = await supabaseServer()
    .from("verses")
    .select("chapter_number")
    .eq("book_slug", bookSlug)
    .order("chapter_number", { ascending: true });
  if (error) throw new Error(error.message);
  return Array.from(new Set((data ?? []).map((r) => r.chapter_number as number)));
}

/** Distinct verse numbers that exist for a book+chapter — powers the verse selector. */
export async function getVersesForChapter(bookSlug: string, chapter: number): Promise<number[]> {
  const { data, error } = await supabaseServer()
    .from("verses")
    .select("verse_number")
    .eq("book_slug", bookSlug)
    .eq("chapter_number", chapter)
    .order("verse_number", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.verse_number as number);
}

export async function getRecentContributions(limit = 10): Promise<
  (ContributionRow & { verse: VerseRow | null })[]
> {
  const { data, error } = await supabaseServer()
    .from("contributions")
    .select("*, verse:verses(*)")
    .eq("status", "completed")
    .eq("hidden_from_activity", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as (ContributionRow & { verse: VerseRow | null })[];
}

export async function getRecentContributionsForVerse(
  verseId: string,
  limit = 5
): Promise<ContributionRow[]> {
  const { data, error } = await supabaseServer()
    .from("contributions")
    .select("*")
    .eq("verse_id", verseId)
    .eq("status", "completed")
    .eq("hidden_from_activity", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ContributionRow[];
}

export async function semanticSearch(
  embedding: number[],
  matchCount = 5,
  similarityThreshold = 0.3
): Promise<SearchMatchRow[]> {
  const { data, error } = await supabaseServer().rpc("match_verses", {
    query_embedding: embedding,
    match_count: matchCount,
    similarity_threshold: similarityThreshold,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as SearchMatchRow[];
}

export async function logSearchEvent(query: string, selectedVerseId?: string) {
  // Analytics only — never blocks the request if it fails.
  // Uses the admin client because search_events has no public insert policy.
  try {
    await supabaseAdmin()
      .from("search_events")
      .insert({ query, selected_verse_id: selectedVerseId ?? null });
  } catch {
    // no-op
  }
}
