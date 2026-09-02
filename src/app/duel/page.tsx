import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentDuel } from "@/lib/duels";
import { DuelWidget } from "@/components/duel-widget";
import { DuelShareCard } from "@/components/duel-share-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "This Week's Verse Duel",
  description: "Two verses, one week — which speaks to you more, and why?",
};

export default async function DuelPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string; session_id?: string }>;
}) {
  const { canceled, session_id } = await searchParams;
  const duel = await getCurrentDuel();

  if (!duel) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Verse Duel</h1>
        <p className="mt-3 text-sm text-slate-500">
          A new duel opens every week. Check back soon, or{" "}
          <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-700">
            see the leaderboard
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Verse Duel</h1>
      <p className="mt-2 text-sm text-slate-500">
        Every week, two verses go head-to-head. Back whichever one speaks to you more — and tell us why.
      </p>

      {canceled && (
        <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Payment was canceled. No backing was added.
        </p>
      )}
      {session_id && (
        <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          Thanks — your backing is on its way. Totals below update within a few seconds.
        </p>
      )}

      <div className="mt-6">
        <DuelWidget duel={duel} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Share this duel</h2>
        <DuelShareCard duelId={duel.id} variant={duel.status === "resolved" ? "resolved" : "open"} />
      </div>
    </div>
  );
}
