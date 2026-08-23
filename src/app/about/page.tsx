import type { Metadata } from "next";
import { getSiteStats } from "@/lib/verses";
import { formatUSD } from "@/lib/money";
import { hoursSince } from "@/lib/time";

export const metadata: Metadata = {
  title: "About",
  description: "About BibleRank, the internet's Bible leaderboard.",
};

export default async function AboutPage() {
  const stats = await getSiteStats();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">About BibleRank</h1>

      <div className="mt-6 grid grid-cols-3 gap-4 rounded-2xl border border-slate-200 p-6 text-center">
        <div>
          <p className="text-2xl font-extrabold text-slate-900">{stats.totalVisitors.toLocaleString()}</p>
          <p className="text-xs text-slate-500">visitors</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-slate-900">{formatUSD(stats.totalRevenueCents)}</p>
          <p className="text-xs text-slate-500">revenue</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-slate-900">{formatUSD(stats.highestBidCents)}</p>
          <p className="text-xs text-slate-500">highest single contribution</p>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        {hoursSince(stats.launchedAt)} hours since launch
      </p>

      <div className="mt-6 space-y-4 text-slate-600">
        <p>
          BibleRank is a public leaderboard where people financially support real, canonical
          Bible verses and compete to put their favorite verse on top.
        </p>
        <p>
          Every verse on BibleRank comes from the World English Bible (WEB), a public-domain
          translation. Users can search for verses and rank verses — they can never create or
          edit verse text.
        </p>
        <p>
          Rank is determined only by money contributed. There are no likes, votes, or editorial
          rankings. The leaderboard reflects user financial support only, and does not imply
          theological authority, doctrinal correctness, church endorsement, or divine importance.
        </p>
        <p>
          The core question BibleRank asks is simple:{" "}
          <span className="font-medium text-slate-900">
            what is the internet&apos;s favorite Bible verse?
          </span>
        </p>
      </div>
    </div>
  );
}
