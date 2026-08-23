import type { Metadata } from "next";
import { formatUSD, MIN_CONTRIBUTION_CENTS, TAKE_FIRST_MARGIN_CENTS, CLAIM_OTHER_RANK_MARGIN_CENTS } from "@/lib/money";

export const metadata: Metadata = {
  title: "Rules",
  description: "How ranking works on BibleRank.",
};

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Rules</h1>
      <p className="mt-4 text-slate-600">
        BibleRank is a public leaderboard. Rank is the contribution — nothing else. There are
        no likes, votes, or editorial rankings.
      </p>

      <h2 className="mt-8 text-lg font-bold text-slate-900">How ranking works</h2>
      <ul className="mt-3 space-y-3 text-slate-600">
        <li>
          Contributions are whole US dollars, {formatUSD(MIN_CONTRIBUTION_CENTS)} minimum,
          $1 at a time.
        </li>
        <li>
          Taking #1 costs at least {formatUSD(TAKE_FIRST_MARGIN_CENTS)} more than the current
          top total. Contributing less still moves the verse up the board to whatever rank
          that amount can take.
        </li>
        <li>
          Claiming any other visible rank costs at least {formatUSD(CLAIM_OTHER_RANK_MARGIN_CENTS)}{" "}
          more than that rank&apos;s current total.
        </li>
        <li>Equal totals stay in the order they were reached — the earlier contribution keeps the higher rank.</li>
      </ul>

      <h2 className="mt-8 text-lg font-bold text-slate-900">What you can rank</h2>
      <ul className="mt-3 space-y-3 text-slate-600">
        <li>Any real, canonical Bible verse from the World English Bible (WEB) translation.</li>
        <li>Verse text can never be created, edited, or removed by users.</li>
      </ul>

      <h2 className="mt-8 text-lg font-bold text-slate-900">After you pay</h2>
      <ul className="mt-3 space-y-3 text-slate-600">
        <li>Your contribution is public and immediately reflected on the leaderboard.</li>
        <li>A completed payment is what claims the rank.</li>
      </ul>
    </div>
  );
}
