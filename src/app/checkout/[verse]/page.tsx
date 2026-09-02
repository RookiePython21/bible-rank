import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseVerseSlug } from "@/lib/verse-slug";
import { getVerseByReference, getVerseRank, getTopTotalCents } from "@/lib/verses";
import { hasUnlockedInterpretation } from "@/lib/interpretation-unlock";
import { formatUSD, requiredToTakeFirstCents, centsToDollars } from "@/lib/money";
import { ContributeWidget } from "@/components/contribute-widget";
import { InterpretationForm } from "@/components/interpretation-form";
import { reference } from "@/types/db";

export const metadata: Metadata = {
  title: "Support a Verse",
};

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ verse: string }>;
  searchParams: Promise<{ amount?: string }>;
}) {
  const { verse: verseSlugParam } = await params;
  const { amount: amountParam } = await searchParams;
  const parsed = parseVerseSlug(verseSlugParam);
  if (!parsed) notFound();

  const initialAmountDollars = (() => {
    const n = parseInt(amountParam ?? "", 10);
    return Number.isFinite(n) && n >= 1 ? n : undefined;
  })();

  const row = await getVerseByReference(parsed.bookSlug, parsed.chapter, parsed.verse);
  if (!row) notFound();

  const [rank, topTotalCents, unlocked] = await Promise.all([
    getVerseRank(row.id),
    getTopTotalCents(),
    hasUnlockedInterpretation(row.id),
  ]);

  const ref = reference(row);
  const isFirst = rank === 1;
  const takeFirstCents = requiredToTakeFirstCents(topTotalCents, row.total_contributed_cents);

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">Support {ref}</h1>
      <p className="mt-2 text-slate-600">&ldquo;{row.verse_text}&rdquo;</p>

      <div className="mt-6 space-y-1 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
        <div className="flex justify-between">
          <span>Current rank</span>
          <span className="font-medium text-slate-900">{rank ? `#${rank}` : "Unranked"}</span>
        </div>
        <div className="flex justify-between">
          <span>Current total</span>
          <span className="font-medium text-slate-900">{formatUSD(row.total_contributed_cents)}</span>
        </div>
        {!isFirst && (
          <div className="flex justify-between">
            <span>To take #1</span>
            <span className="font-medium text-amber-700">{formatUSD(takeFirstCents)}</span>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-900">
          What do you want to share with others about this post?
        </h2>
        <InterpretationForm verseId={row.id} unlocked={unlocked} />
      </div>

      <div id="contribute" className="mt-6">
        <ContributeWidget
          verseId={row.id}
          currentTotalCents={row.total_contributed_cents}
          takeFirstDollars={Math.round(centsToDollars(takeFirstCents))}
          isCurrentlyFirst={isFirst}
          initialAmountDollars={initialAmountDollars}
        />
      </div>
    </div>
  );
}
