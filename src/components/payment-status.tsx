"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatUSD } from "@/lib/money";
import { BoostShareCard } from "@/components/boost-share-card";

type Contribution = {
  amount_cents: number;
  rank_before: number | null;
  rank_after: number | null;
  verse: {
    id: string;
    book_name: string;
    chapter_number: number;
    verse_number: number;
    book_slug: string;
    total_contributed_cents: number;
  };
};

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 8;

export function PaymentStatus({ sessionId }: { sessionId: string }) {
  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (contribution || attempts >= MAX_ATTEMPTS) return;

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/contributions/by-session?session_id=${sessionId}`);
      const data = await res.json();
      if (data.contribution) {
        setContribution(data.contribution);
      } else {
        setAttempts((a) => a + 1);
      }
    }, attempts === 0 ? 0 : POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [attempts, contribution, sessionId]);

  if (!contribution) {
    const timedOut = attempts >= MAX_ATTEMPTS;
    return (
      <div className="rounded-2xl border border-slate-200 p-6 text-center">
        <p className="font-semibold text-slate-900">
          Your payment was received. We&apos;re confirming your contribution.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {timedOut
            ? "This is taking longer than usual — check the verse page in a moment."
            : "This usually takes just a few seconds."}
        </p>
      </div>
    );
  }

  const ref = `${contribution.verse.book_name} ${contribution.verse.chapter_number}:${contribution.verse.verse_number}`;
  const href = `/verse/${contribution.verse.book_slug}/${contribution.verse.chapter_number}/${contribution.verse.verse_number}`;
  const moved =
    contribution.rank_before != null &&
    contribution.rank_after != null &&
    contribution.rank_before !== contribution.rank_after;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
        Boost complete
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900">You boosted {ref}</p>
      <p className="mt-2 text-slate-600">
        {formatUSD(contribution.amount_cents)} contributed · New total{" "}
        {formatUSD(contribution.verse.total_contributed_cents)}
      </p>
      {moved && (
        <p className="mt-1 text-sm text-slate-500">
          {ref} moved from #{contribution.rank_before} → #{contribution.rank_after}
        </p>
      )}
      <p className="mt-1 text-sm text-slate-500">
        You can now{" "}
        <Link href={`${href}#interpretations`} className="font-medium text-indigo-600 hover:text-indigo-700">
          share your interpretation
        </Link>{" "}
        of {ref}.
      </p>

      <BoostShareCard
        verseId={contribution.verse.id}
        amountCents={contribution.amount_cents}
        versePath={href}
        shareText={`I just boosted ${ref} on BibleRank!`}
        reference={ref}
      />

      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/leaderboard"
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          View Leaderboard
        </Link>
        <Link
          href={href}
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600"
        >
          View Verse Page
        </Link>
      </div>
    </div>
  );
}
