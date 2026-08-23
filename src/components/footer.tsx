import Link from "next/link";
import { getSiteStats } from "@/lib/verses";
import { formatUSD } from "@/lib/money";
import { hoursSince } from "@/lib/time";

export async function Footer() {
  const stats = await getSiteStats();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">
              Bible<span className="text-indigo-600">Rank</span>
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              The internet&apos;s Bible leaderboard. Rankings are determined solely by
              completed contributions.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
            <Link href="/about" className="hover:text-slate-900">About</Link>
            <Link href="/how-it-works" className="hover:text-slate-900">How It Works</Link>
            <Link href="/categories" className="hover:text-slate-900">Categories</Link>
            <Link href="/rules" className="hover:text-slate-900">Rules</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
          </div>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          This simple side project made {formatUSD(stats.totalRevenueCents)} since its launch{" "}
          {hoursSince(stats.launchedAt)} hours ago. Built by the BibleRank team ·{" "}
          <Link href="/rules" className="font-medium text-indigo-600 hover:text-indigo-700">
            Rules
          </Link>{" "}
          ·{" "}
          <Link href="/about" className="font-medium text-indigo-600 hover:text-indigo-700">
            Live stats
          </Link>
        </p>

        <p className="mt-4 text-xs text-slate-400">
          Scripture text displayed using the World English Bible (WEB), a public domain
          translation. Contributions increase the public leaderboard total for the selected
          Bible verse and do not purchase ownership of a verse or Scripture text.
        </p>
      </div>
    </footer>
  );
}
