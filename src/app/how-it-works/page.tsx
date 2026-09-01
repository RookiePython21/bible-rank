import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How BibleRank's public Bible verse leaderboard works.",
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">How It Works</h1>

      <ol className="mt-8 space-y-6">
        <li>
          <p className="font-semibold text-slate-900">1. Find a real Bible verse</p>
          <p className="mt-1 text-slate-600">
            Search by phrase, topic, or partial memory — or choose an exact Book, Chapter, and
            Verse. BibleRank only ever shows canonical verses from the World English Bible (WEB).
            You can never create or edit verse text.
          </p>
        </li>
        <li>
          <p className="font-semibold text-slate-900">2. Contribute to it</p>
          <p className="mt-1 text-slate-600">
            Every verse has a single public total. Contribute any whole-dollar amount ($1
            minimum) to increase it. Payment is handled securely by Stripe. Contributing to a
            verse also unlocks sharing your own interpretation of it.
          </p>
        </li>
        <li>
          <p className="font-semibold text-slate-900">3. Watch it move up the leaderboard</p>
          <p className="mt-1 text-slate-600">
            Rank is determined only by total contributions — no likes, votes, or editorial
            weighting. Totals update the moment Stripe confirms your payment.
          </p>
        </li>
      </ol>

      <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <p>
          Contributions increase the public leaderboard total for the selected Bible verse.
          Payments do not purchase ownership of a verse or Scripture text. Rankings are
          determined solely by completed contributions and do not imply theological authority,
          doctrinal correctness, or that higher-ranked verses are objectively more important
          Scripture.
        </p>
      </div>

      <Link
        href="/search"
        className="mt-8 inline-block rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Find a Verse
      </Link>
    </div>
  );
}
