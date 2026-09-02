export type VerseRow = {
  id: string;
  canonical_key: string;
  book_name: string;
  book_slug: string;
  book_number: number;
  chapter_number: number;
  verse_number: number;
  verse_text: string;
  translation: string;
  total_contributed_cents: number;
  rank_tiebreak_at: string;
  created_at: string;
};

export type LeaderboardRow = {
  rank: number;
  id: string;
  canonical_key: string;
  book_name: string;
  book_slug: string;
  chapter_number: number;
  verse_number: number;
  verse_text: string;
  total_contributed_cents: number;
  click_count: number;
  interpretation_count: number;
  last_contribution_at: string;
  total_count: number;
};

export type TodayLeaderboardRow = {
  rank: number;
  id: string;
  canonical_key: string;
  book_name: string;
  book_slug: string;
  chapter_number: number;
  verse_number: number;
  verse_text: string;
  today_total_cents: number;
  total_contributed_cents: number;
  click_count: number;
  interpretation_count: number;
  last_contribution_at: string;
  total_count: number;
};

export type SearchMatchRow = {
  id: string;
  canonical_key: string;
  book_name: string;
  book_slug: string;
  chapter_number: number;
  verse_number: number;
  verse_text: string;
  total_contributed_cents: number;
  similarity: number;
};

export type ContributionRow = {
  id: string;
  verse_id: string;
  amount_cents: number;
  currency: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_event_id: string | null;
  status: "completed" | "refunded";
  rank_before: number | null;
  rank_after: number | null;
  hidden_from_activity: boolean;
  created_at: string;
};

export type InterpretationRow = {
  id: string;
  verse_id: string;
  author_name: string | null;
  body: string;
  hidden: boolean;
  created_at: string;
};

export type DuelRow = {
  id: string;
  verse_a_id: string;
  verse_b_id: string;
  window_start: string;
  window_end: string;
  status: "open" | "resolved";
  resolved_side: "a" | "b" | null;
  created_at: string;
};

export type DuelBackingRow = {
  id: string;
  duel_id: string;
  side: "a" | "b";
  amount_cents: number;
  why_note: string | null;
  author_name: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_event_id: string | null;
  status: "pending" | "completed" | "refunded";
  hidden: boolean;
  created_at: string;
};

export type DuelVerseDTO = {
  id: string;
  canonicalKey: string;
  reference: string;
  bookSlug: string;
  chapter: number;
  verse: number;
  text: string;
};

export type DuelDTO = {
  id: string;
  windowStart: string;
  windowEnd: string;
  status: "open" | "resolved";
  resolvedSide: "a" | "b" | null;
  verseA: DuelVerseDTO;
  verseB: DuelVerseDTO;
  totalsBySide: { a: number; b: number };
  backerCountsBySide: { a: number; b: number };
};

export type SiteStats = {
  totalVisitors: number;
  launchedAt: string;
  totalRevenueCents: number;
  highestBidCents: number;
};

export type ImpactStats = {
  verseViews: number;
  bibleSearches: number;
  versesSupported: number;
  versesShared: number;
  leaderboardContributionsCents: number;
};

export type VerseDTO = {
  id: string;
  canonicalKey: string;
  reference: string;
  bookSlug: string;
  chapter: number;
  verse: number;
  text: string;
  rank: number | null;
  totalContributedCents: number;
};

export function reference(row: { book_name: string; chapter_number: number; verse_number: number }): string {
  return `${row.book_name} ${row.chapter_number}:${row.verse_number}`;
}

export function toVerseDTO(row: VerseRow, rank: number | null): VerseDTO {
  return {
    id: row.id,
    canonicalKey: row.canonical_key,
    reference: reference(row),
    bookSlug: row.book_slug,
    chapter: row.chapter_number,
    verse: row.verse_number,
    text: row.verse_text,
    rank,
    totalContributedCents: row.total_contributed_cents,
  };
}
