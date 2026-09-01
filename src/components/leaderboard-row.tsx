"use client";

import Link from "next/link";
import { formatUSD } from "@/lib/money";
import { formatRelativeTime } from "@/lib/time";
import { track } from "@/lib/analytics";

type Props = {
  rank: number;
  verseId: string;
  bookSlug: string;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
  totalCents: number;
  clickCount: number;
  interpretationCount: number;
  lastContributionAt: string;
  claimPriceCents: number;
  sectionLabel?: string;
  sectionIcon?: string;
  variant: "top3" | "standard";
};

export function LeaderboardRow({
  rank,
  verseId,
  bookSlug,
  chapter,
  verse,
  reference,
  text,
  totalCents,
  clickCount,
  interpretationCount,
  lastContributionAt,
  claimPriceCents,
  sectionLabel,
  sectionIcon,
  variant,
}: Props) {
  const href = `/verse/${bookSlug}/${chapter}/${verse}`;
  const claimHref = `/checkout/${bookSlug}-${chapter}-${verse}?amount=${Math.round(claimPriceCents / 100)}`;

  function handleRowClick() {
    track("leaderboard_row_click", { verse_id: verseId });
  }

  const meta = (
    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-400">
      <span>{formatRelativeTime(lastContributionAt)}</span>
      {sectionLabel && (
        <>
          <span aria-hidden>·</span>
          <span>
            {sectionIcon} {sectionLabel}
          </span>
        </>
      )}
      <span aria-hidden>·</span>
      <span>
        {clickCount.toLocaleString()} {clickCount === 1 ? "click" : "clicks"}
      </span>
      {interpretationCount > 0 && (
        <>
          <span aria-hidden>·</span>
          <span>
            {interpretationCount.toLocaleString()}{" "}
            {interpretationCount === 1 ? "interpretation" : "interpretations"}
          </span>
        </>
      )}
    </p>
  );

  if (variant === "top3") {
    return (
      <div className="group relative mb-3 rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-4 sm:p-5">
        <Link
          href={href}
          onClick={handleRowClick}
          className="absolute inset-0 z-10 rounded-2xl"
          aria-label={reference}
        />

        <Link
          href={claimHref}
          className="pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-md transition group-hover:pointer-events-auto group-hover:opacity-100"
        >
          claim this rank for {formatUSD(claimPriceCents)}
        </Link>

        <div className="relative z-0 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-extrabold text-white sm:h-14 sm:w-14 sm:text-base">
            #{rank}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-slate-900 sm:text-lg">{reference}</p>
            <p className="truncate text-sm text-slate-600 sm:text-base">{text}</p>
            {meta}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-lg font-extrabold text-amber-700 sm:text-2xl">{formatUSD(totalCents)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative border-b border-slate-100 py-4 last:border-0">
      <Link href={href} onClick={handleRowClick} className="absolute inset-0 z-10" aria-label={reference} />

      <Link
        href={claimHref}
        className="pointer-events-none absolute -top-3 left-16 z-20 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-md transition group-hover:pointer-events-auto group-hover:opacity-100"
      >
        claim this rank for {formatUSD(claimPriceCents)}
      </Link>

      <div className="relative z-0 flex items-center gap-4">
        <div className="w-12 shrink-0 text-center text-xl font-extrabold text-slate-300 sm:w-16 sm:text-2xl">
          {rank}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-slate-900 group-hover:text-indigo-600 sm:text-lg">
            {reference}
          </p>
          <p className="truncate text-sm text-slate-500">{text}</p>
          {meta}
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-lg font-bold text-slate-900">{formatUSD(totalCents)}</p>
          <p className="text-xs text-slate-400">contributed</p>
        </div>
      </div>
    </div>
  );
}
