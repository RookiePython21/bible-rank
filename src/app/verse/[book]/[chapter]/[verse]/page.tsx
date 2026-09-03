import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getVerseByReference,
  getVerseRank,
  getTopTotalCents,
  getRecentContributionsForVerse,
} from "@/lib/verses";
import { getInterpretationsForVerse } from "@/lib/interpretations";
import { getCurrentDuel } from "@/lib/duels";
import { formatUSD, requiredToTakeFirstCents, centsToDollars } from "@/lib/money";
import { ContributeWidget } from "@/components/contribute-widget";
import { ShareControls } from "@/components/share-controls";
import { VerseViewTracker } from "@/components/verse-view-tracker";
import { InterpretationsList } from "@/components/interpretations-list";
import { reference } from "@/types/db";

type Params = { book: string; chapter: string; verse: string };

async function loadVerse(params: Params) {
  const chapter = parseInt(params.chapter, 10);
  const verse = parseInt(params.verse, 10);
  if (!Number.isFinite(chapter) || !Number.isFinite(verse)) return null;
  return getVerseByReference(params.book, chapter, verse);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const p = await params;
  const row = await loadVerse(p);
  if (!row) return { title: "Verse Not Found" };

  const ref = reference(row);
  return {
    title: ref,
    description: `See where ${ref} ranks on BibleRank and support it on the public Bible verse leaderboard.`,
    openGraph: {
      title: `${ref} — BibleRank`,
      description: row.verse_text,
    },
  };
}

export default async function VersePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const p = await params;
  const { canceled } = await searchParams;
  const row = await loadVerse(p);
  if (!row) notFound();

  const [rank, topTotalCents, recent, interpretations, duel] = await Promise.all([
    getVerseRank(row.id),
    getTopTotalCents(),
    getRecentContributionsForVerse(row.id, 5),
    getInterpretationsForVerse(row.id, 20),
    getCurrentDuel(),
  ]);

  const isInCurrentDuel = duel && (duel.verseA.id === row.id || duel.verseB.id === row.id);

  const ref = reference(row);
  const isFirst = rank === 1;
  const takeFirstCents = requiredToTakeFirstCents(topTotalCents, row.total_contributed_cents);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bible-rank.com";
  const shareUrl = `${siteUrl}/verse/${row.book_slug}/${row.chapter_number}/${row.verse_number}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <VerseViewTracker verseId={row.id} />
      {canceled && (
        <p className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Payment was canceled. No contribution was added.
        </p>
      )}

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-indigo-600 px-3 py-1 text-sm font-bold text-white">
          {rank ? `#${rank}` : "Unranked"}
        </span>
        {row.total_contributed_cents === 0 && (
          <span className="text-sm text-slate-500">Be the first to put this verse on the board.</span>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">{ref}</h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-700">{row.verse_text}</p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <p className="text-2xl font-bold text-slate-900">
          {formatUSD(row.total_contributed_cents)}
        </p>
        <p className="text-sm text-slate-500">contributed</p>
        {!isFirst && (
          <p className="text-sm font-medium text-amber-700">
            {formatUSD(takeFirstCents)} would currently take #1
          </p>
        )}
      </div>

      {isInCurrentDuel && (
        <div className="mt-8">
          <Link
            href="/duel"
            className={`flex items-center justify-center rounded-full border border-indigo-300 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:border-indigo-400 ${
              duel!.status === "resolved" ? "" : "animate-duel-pulse"
            }`}
          >
            {duel!.status === "resolved" ? "See this week's Duel result" : "Duel in process"}
          </Link>
        </div>
      )}

      <div id="contribute" className="mt-8">
        <ContributeWidget
          verseId={row.id}
          currentTotalCents={row.total_contributed_cents}
          currentRank={rank}
          takeFirstDollars={Math.round(centsToDollars(takeFirstCents))}
          isCurrentlyFirst={isFirst}
        />
      </div>

      {recent.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-slate-900">Recent activity for this verse</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-500">
            {recent.map((c) => (
              <li key={c.id}>
                {formatUSD(c.amount_cents)} contributed
                {c.rank_after ? ` — moved to #${c.rank_after}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <InterpretationsList interpretations={interpretations} />

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Share</h2>
        <ShareControls
          url={shareUrl}
          text={`${ref} is currently ${rank ? `#${rank}` : "unranked"} on BibleRank.`}
          verseId={row.id}
        />
      </div>
    </div>
  );
}
