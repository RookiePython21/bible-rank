import { getImpactStats } from "@/lib/verses";
import { formatUSD } from "@/lib/money";
import { formatCompactCount } from "@/lib/format";

export async function ImpactSection() {
  const stats = await getImpactStats();

  const primaryStats = [
    { label: "Verses Viewed", value: formatCompactCount(stats.verseViews) },
    { label: "Bible Searches", value: formatCompactCount(stats.bibleSearches) },
    { label: "Verses Supported", value: formatCompactCount(stats.versesSupported) },
    { label: "Verses Shared", value: formatCompactCount(stats.versesShared) },
  ];

  return (
    <section className="mt-16 border-t border-slate-200 pt-12">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-wide text-indigo-600 uppercase">BibleRank Impact</p>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Helping more people discover Scripture.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
          BibleRank makes exploring Scripture interactive, searchable, competitive, and
          shareable. Every search, view, ranking, and share puts another Bible verse in
          front of someone.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {primaryStats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {stats.leaderboardContributionsCents > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 p-6 text-center sm:mx-auto sm:max-w-xs">
          <p className="text-2xl font-extrabold text-amber-600 sm:text-3xl">
            {formatUSD(stats.leaderboardContributionsCents)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Leaderboard Contributions</p>
        </div>
      )}

      <div className="mx-auto mt-10 max-w-xl text-center">
        <p className="text-sm font-medium text-slate-900">This is only the beginning.</p>
        <p className="mt-1 text-sm text-slate-500">
          As BibleRank grows, we hope its impact can extend beyond the leaderboard and into
          communities around the world.
        </p>
      </div>
    </section>
  );
}
