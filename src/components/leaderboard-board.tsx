import { LeaderboardRow } from "@/components/leaderboard-row";
import { LatestActivityInline } from "@/components/latest-activity-inline";
import { SectionDivider } from "@/components/section-divider";
import { CategoryPills } from "@/components/category-pills";
import { Pagination } from "@/components/pagination";

export type NormalizedLeaderboardRow = {
  id: string;
  rank: number;
  bookSlug: string;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
  totalCents: number;
  clickCount: number;
  lastContributionAt: string;
  claimPriceCents: number;
  sectionLabel?: string;
  sectionIcon?: string;
};

type Props = {
  title: string;
  rows: NormalizedLeaderboardRow[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  category?: string;
  pageParam?: string;
  categoryParam?: string;
  preserveParams?: Record<string, string>;
  emptyMessage: string;
};

export function LeaderboardBoard({
  title,
  rows,
  totalCount,
  totalPages,
  page,
  pageSize,
  category,
  pageParam = "page",
  categoryParam = "category",
  preserveParams,
  emptyMessage,
}: Props) {
  const top3 = page === 1 ? rows.slice(0, 3) : [];
  const rest = page === 1 ? rows.slice(3) : rows;

  return (
    <section>
      <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>

      <div className="mt-4">
        <CategoryPills active={category} categoryParam={categoryParam} preserveParams={preserveParams} />
      </div>

      <div className="mt-6">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            {emptyMessage}
          </p>
        ) : (
          <>
            {top3.map((row) => (
              <LeaderboardRow
                key={row.id}
                rank={row.rank}
                verseId={row.id}
                bookSlug={row.bookSlug}
                chapter={row.chapter}
                verse={row.verse}
                reference={row.reference}
                text={row.text}
                totalCents={row.totalCents}
                clickCount={row.clickCount}
                lastContributionAt={row.lastContributionAt}
                claimPriceCents={row.claimPriceCents}
                sectionLabel={row.sectionLabel}
                sectionIcon={row.sectionIcon}
                variant="top3"
              />
            ))}

            {top3.length > 0 && <LatestActivityInline limit={5} />}

            {rest.map((row) => {
              const showDivider = row.rank > 10 && (row.rank - 1) % 10 === 0;
              return (
                <div key={row.id}>
                  {showDivider && <SectionDivider label={`TOP ${row.rank - 1}`} />}
                  <LeaderboardRow
                    rank={row.rank}
                    verseId={row.id}
                    bookSlug={row.bookSlug}
                    chapter={row.chapter}
                    verse={row.verse}
                    reference={row.reference}
                    text={row.text}
                    totalCents={row.totalCents}
                    clickCount={row.clickCount}
                    lastContributionAt={row.lastContributionAt}
                    claimPriceCents={row.claimPriceCents}
                    sectionLabel={row.sectionLabel}
                    sectionIcon={row.sectionIcon}
                    variant="standard"
                  />
                </div>
              );
            })}
          </>
        )}
      </div>

      {totalCount > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          category={category}
          categoryParam={categoryParam}
          pageParam={pageParam}
          preserveParams={preserveParams}
        />
      )}
    </section>
  );
}
