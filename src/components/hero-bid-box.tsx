"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BOOK_SECTIONS } from "@/lib/bible-books";
import { parseReference } from "@/lib/reference-parser";
import { formatUSD, MIN_CONTRIBUTION_CENTS, TAKE_FIRST_MARGIN_CENTS } from "@/lib/money";
import { track } from "@/lib/analytics";

type Props = { topTotalCents: number };

export function HeroBidBox({ topTotalCents }: Props) {
  const router = useRouter();
  const minDollars = Math.ceil(MIN_CONTRIBUTION_CENTS / 100);
  const [amountDollars, setAmountDollars] = useState(
    Math.max(minDollars, Math.round((topTotalCents + TAKE_FIRST_MARGIN_CENTS) / 100))
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  function step(delta: number) {
    setAmountDollars((d) => Math.max(minDollars, d + delta));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    track("verse_search", { search_query: q });

    const parsed = parseReference(q);
    if (parsed) {
      try {
        const res = await fetch(
          `/api/verse?book=${encodeURIComponent(parsed.book.slug)}&chapter=${parsed.chapter}&verse=${parsed.verse}`
        );
        if (res.ok) {
          const dto = await res.json();
          router.push(`/checkout/${dto.bookSlug}-${dto.chapter}-${dto.verse}?amount=${amountDollars}`);
          return;
        }
      } catch {
        // Not a resolvable reference — fall through to search.
      }
    }

    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-6xl">
        Claim #1 for{" "}
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Decrease amount"
          className="mx-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 align-middle text-lg font-bold text-amber-700 transition hover:bg-amber-200"
        >
          −
        </button>
        <span className="text-amber-600">{formatUSD(amountDollars * 100)}</span>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Increase amount"
          className="mx-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 align-middle text-lg font-bold text-amber-700 transition hover:bg-amber-200"
        >
          +
        </button>
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-slate-500">
        New spots start at {formatUSD(MIN_CONTRIBUTION_CENTS)}. Paying less than the #1 price
        still puts you on the board at whatever place that bid can take.
      </p>

      <form onSubmit={submit} className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="A Bible verse — e.g. John 3:16"
          className="w-full rounded-full border border-slate-300 px-5 py-3 text-sm shadow-sm focus:border-indigo-500"
        />
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) router.push(`/?category=${e.target.value}`);
          }}
          className="rounded-full border border-slate-300 px-4 py-3 text-sm text-slate-600 shadow-sm focus:border-indigo-500"
        >
          <option value="">Browse a section</option>
          {BOOK_SECTIONS.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.icon} {s.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? "…" : "Outbid"}
        </button>
      </form>

      <p className="mt-3 text-sm text-slate-400">
        Already ranked? Search the same verse and raise your bid.
      </p>
    </div>
  );
}
