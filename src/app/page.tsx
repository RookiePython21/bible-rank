import { getLeaderboardPage, getLeaderboardTodayPage, getTopTotalCents } from "@/lib/verses";
import { bookSlugsForSection, SECTION_BY_BOOK_SLUG } from "@/lib/bible-books";
import { claimPriceCents } from "@/lib/money";
import type { LeaderboardRow, TodayLeaderboardRow } from "@/types/db";
import { StatsBar } from "@/components/stats-bar";
import { HeroBidBox } from "@/components/hero-bid-box";
import { LeaderboardBoard, type NormalizedLeaderboardRow } from "@/components/leaderboard-board";
import { ImpactSection } from "@/components/impact-section";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function normalizeAllTime(row: LeaderboardRow): NormalizedLeaderboardRow {
  const section = SECTION_BY_BOOK_SLUG.get(row.book_slug);
  return {
    id: row.id,
    rank: row.rank,
    bookSlug: row.book_slug,
    chapter: row.chapter_number,
    verse: row.verse_number,
    reference: `${row.book_name} ${row.chapter_number}:${row.verse_number}`,
    text: row.verse_text,
    totalCents: row.total_contributed_cents,
    clickCount: row.click_count,
    lastContributionAt: row.last_contribution_at,
    claimPriceCents: claimPriceCents(row),
    sectionLabel: section?.label,
    sectionIcon: section?.icon,
  };
}

function normalizeToday(row: TodayLeaderboardRow): NormalizedLeaderboardRow {
  const section = SECTION_BY_BOOK_SLUG.get(row.book_slug);
  return {
    id: row.id,
    rank: row.rank,
    bookSlug: row.book_slug,
    chapter: row.chapter_number,
    verse: row.verse_number,
    reference: `${row.book_name} ${row.chapter_number}:${row.verse_number}`,
    text: row.verse_text,
    totalCents: row.today_total_cents,
    clickCount: row.click_count,
    lastContributionAt: row.last_contribution_at,
    claimPriceCents: claimPriceCents({ rank: row.rank, total_contributed_cents: row.today_total_cents }),
    sectionLabel: section?.label,
    sectionIcon: section?.icon,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; todayPage?: string; todayCategory?: string }>;
}) {
  const { page: pageParam, category, todayPage: todayPageParam, todayCategory } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const todayPage = Math.max(1, parseInt(todayPageParam ?? "1", 10) || 1);
  const bookSlugs = bookSlugsForSection(category) ?? undefined;
  const todayBookSlugs = bookSlugsForSection(todayCategory) ?? undefined;

  const [allTime, today, topTotalCents] = await Promise.all([
    getLeaderboardPage({ page, pageSize: PAGE_SIZE, bookSlugs }),
    getLeaderboardTodayPage({ page: todayPage, pageSize: PAGE_SIZE, bookSlugs: todayBookSlugs }),
    getTopTotalCents(),
  ]);

  const allTimePreserve: Record<string, string> = {
    ...(todayPage > 1 ? { todayPage: String(todayPage) } : {}),
    ...(todayCategory ? { todayCategory } : {}),
  };
  const todayPreserve: Record<string, string> = {
    ...(page > 1 ? { page: String(page) } : {}),
    ...(category ? { category } : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex justify-center">
          <StatsBar />
        </div>

        <div className="mt-10">
          <HeroBidBox topTotalCents={topTotalCents} />
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <LeaderboardBoard
          title="Top All-Time"
          rows={allTime.rows.map(normalizeAllTime)}
          totalCount={allTime.totalCount}
          totalPages={allTime.totalPages}
          page={page}
          pageSize={PAGE_SIZE}
          category={category}
          preserveParams={allTimePreserve}
          emptyMessage={`No verses have been supported ${
            category ? "in this section " : ""
          }yet. Be the first — search for a verse above.`}
        />

        <LeaderboardBoard
          title="Top Today"
          rows={today.rows.map(normalizeToday)}
          totalCount={today.totalCount}
          totalPages={today.totalPages}
          page={todayPage}
          pageSize={PAGE_SIZE}
          category={todayCategory}
          pageParam="todayPage"
          categoryParam="todayCategory"
          preserveParams={todayPreserve}
          emptyMessage={`No verses have been supported ${
            todayCategory ? "in this section " : ""
          }today yet. Be the first — search for a verse above.`}
        />
      </div>

      <ImpactSection />
    </div>
  );
}
