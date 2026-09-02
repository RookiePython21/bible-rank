import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDuelById } from "@/lib/duels";
import { DuelWidget } from "@/components/duel-widget";
import { DuelShareCard } from "@/components/duel-share-card";

export const dynamic = "force-dynamic";

type Params = { duelId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { duelId } = await params;
  const duel = await getDuelById(duelId);
  if (!duel) return { title: "Verse Duel" };

  return {
    title: `${duel.verseA.reference} vs. ${duel.verseB.reference} — Verse Duel`,
    description: "Which speaks to you more, and why?",
  };
}

export default async function DuelArchivePage({ params }: { params: Promise<Params> }) {
  const { duelId } = await params;
  const duel = await getDuelById(duelId);
  if (!duel) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900">
        {duel.status === "resolved" ? "Verse Duel — Result" : "Verse Duel"}
      </h1>
      <p className="mt-2 text-sm text-slate-500">{duel.verseA.reference} vs. {duel.verseB.reference}</p>

      <div className="mt-6">
        <DuelWidget duel={duel} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Share</h2>
        <DuelShareCard duelId={duel.id} variant={duel.status === "resolved" ? "resolved" : "open"} />
      </div>
    </div>
  );
}
