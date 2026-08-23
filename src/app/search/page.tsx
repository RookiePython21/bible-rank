import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { VerseSelector } from "@/components/verse-selector";
import { performSearch } from "@/lib/search";
import { formatUSD } from "@/lib/money";

export const metadata: Metadata = {
  title: "Find a Verse",
  description: "Search the World English Bible by reference, phrase, or idea.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const outcome = query ? await performSearch(query) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Find a Verse</h1>
      <p className="mt-2 text-slate-500">
        Search by reference, phrase, topic, or partial memory of a verse.
      </p>

      <div className="mt-6">
        <SearchBox initialQuery={query} />
      </div>

      {outcome && (
        <div className="mt-8">
          {outcome.mode === "invalid_reference" && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              We couldn&apos;t find that Bible reference. Try a phrase instead, or select the verse
              directly below.
            </p>
          )}

          {outcome.mode === "no_confidence" && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              We couldn&apos;t confidently match that search. Try another phrase or select the verse
              directly below.
            </p>
          )}

          {(outcome.mode === "exact" || outcome.mode === "semantic") && (
            <div>
              <p className="mb-3 text-sm text-slate-500">
                {outcome.mode === "exact" ? "Exact match" : `Results for "${query}"`}
              </p>
              <ul className="space-y-3">
                {outcome.results.map((r) => (
                  <li key={r.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{r.reference}</p>
                        <p className="mt-1 text-sm text-slate-600">{r.text}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {r.rank ? `#${r.rank}` : "Unranked"} · {formatUSD(r.totalContributedCents)}
                        </p>
                      </div>
                      <Link
                        href={`/verse/${r.bookSlug}/${r.chapter}/${r.verse}`}
                        className="shrink-0 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Select
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-12">
        <p className="mb-3 text-sm font-medium text-slate-500">Or choose a verse:</p>
        <VerseSelector />
      </div>
    </div>
  );
}
