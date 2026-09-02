"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BIBLE_BOOKS, BOOK_SECTIONS } from "@/lib/bible-books";
import {
  formatUSD,
  MIN_CONTRIBUTION_CENTS,
  requiredToTakeFirstCents,
} from "@/lib/money";
import { track } from "@/lib/analytics";
import { reference, type LeaderboardRow, type VerseDTO } from "@/types/db";

const TOPIC_CHIPS = ["Anxiety", "Love", "Forgiveness", "Hope", "Strength", "Faith", "Peace", "Grief"];

type Props = { topVerse: LeaderboardRow | null };

export function HeroBidBox({ topVerse }: Props) {
  const router = useRouter();
  const topTotalCents = topVerse?.total_contributed_cents ?? 0;
  const minDollars = Math.ceil(MIN_CONTRIBUTION_CENTS / 100);
  const defaultDollars = Math.max(minDollars, 5);
  const [amountDollars, setAmountDollars] = useState(defaultDollars);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [bookSlug, setBookSlug] = useState("");
  const [chapters, setChapters] = useState<number[]>([]);
  const [chapter, setChapter] = useState<number | "">("");
  const [verses, setVerses] = useState<number[]>([]);
  const [verse, setVerse] = useState<number | "">("");
  const [picked, setPicked] = useState<VerseDTO | null>(null);
  const [pickLoading, setPickLoading] = useState(false);

  function step(delta: number) {
    setAmountDollars((d) => Math.max(minDollars, d + delta));
  }

  async function handleBookChange(newBook: string) {
    setBookSlug(newBook);
    setChapter("");
    setVerses([]);
    setVerse("");
    setPicked(null);
    setChapters([]);

    if (!newBook) return;
    const res = await fetch(`/api/verse-options?book=${newBook}`);
    const data = await res.json();
    setChapters(data.chapters ?? []);
  }

  async function handleChapterChange(newChapter: number | "") {
    setChapter(newChapter);
    setVerse("");
    setPicked(null);
    setVerses([]);

    if (!bookSlug || newChapter === "") return;
    const res = await fetch(`/api/verse-options?book=${bookSlug}&chapter=${newChapter}`);
    const data = await res.json();
    setVerses(data.verses ?? []);
  }

  async function handleVerseChange(newVerse: number | "") {
    setVerse(newVerse);
    setPicked(null);

    if (!bookSlug || chapter === "" || newVerse === "") return;
    setPickLoading(true);
    try {
      const res = await fetch(`/api/verse?book=${bookSlug}&chapter=${chapter}&verse=${newVerse}`);
      const dto = res.ok ? await res.json() : null;
      setPicked(dto);
      if (dto) {
        track("verse_selected", { book_slug: bookSlug, chapter, verse: newVerse });
        setAmountDollars(defaultDollars);
      }
    } finally {
      setPickLoading(false);
    }
  }

  function boostPicked() {
    if (!picked) return;
    router.push(`/checkout/${picked.bookSlug}-${picked.chapter}-${picked.verse}?amount=${amountDollars}`);
  }

  function makeFirstPicked() {
    if (!picked) return;
    router.push(
      `/checkout/${picked.bookSlug}-${picked.chapter}-${picked.verse}?amount=${takeFirstDollars}`
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    track("verse_search", { search_query: q });
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const takeFirstDollars = picked
    ? Math.max(
        minDollars,
        Math.round(requiredToTakeFirstCents(topTotalCents, picked.totalContributedCents) / 100)
      )
    : minDollars;
  const pickedIsFirst = picked?.rank === 1;

  return (
    <div className="text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-6xl">
        {topVerse ? (
          <>
            {reference(topVerse)} holds #1 at{" "}
            <span className="text-amber-600">{formatUSD(topVerse.total_contributed_cents)}</span>
            {topVerse.interpretation_count > 0 && (
              <>
                {" "}
                and {topVerse.interpretation_count.toLocaleString()}{" "}
                {topVerse.interpretation_count === 1 ? "interpretation" : "interpretations"}
              </>
            )}
          </>
        ) : (
          "No verse holds #1 yet"
        )}
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-slate-500">
        New spots start at {formatUSD(MIN_CONTRIBUTION_CENTS)}. Any amount puts this verse on
        the board — the more contributed, the higher it ranks.
      </p>

      <div className="mx-auto mt-8 max-w-2xl">
        <p className="mb-2 text-sm font-medium text-slate-500">Pick a verse</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={bookSlug}
            onChange={(e) => handleBookChange(e.target.value)}
            aria-label="Book"
            className="rounded-full border border-slate-300 px-4 py-3 text-sm text-slate-600 shadow-sm focus:border-indigo-500"
          >
            <option value="">Book</option>
            {BIBLE_BOOKS.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={chapter}
            onChange={(e) => handleChapterChange(e.target.value ? Number(e.target.value) : "")}
            disabled={!bookSlug}
            aria-label="Chapter"
            className="rounded-full border border-slate-300 px-4 py-3 text-sm text-slate-600 shadow-sm focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">Chapter</option>
            {chapters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={verse}
            onChange={(e) => handleVerseChange(e.target.value ? Number(e.target.value) : "")}
            disabled={chapter === ""}
            aria-label="Verse"
            className="rounded-full border border-slate-300 px-4 py-3 text-sm text-slate-600 shadow-sm focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">Verse</option>
            {verses.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {pickLoading && <p className="mt-4 text-sm text-slate-400">Loading verse…</p>}

        {picked && !pickLoading && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-left">
            <p className="text-lg font-bold text-slate-900">{picked.reference}</p>
            <p className="mt-1 text-sm text-slate-700">{picked.text}</p>
            <p className="mt-2 text-xs text-slate-500">
              {picked.rank ? `Currently #${picked.rank}` : "Currently unranked"} ·{" "}
              {formatUSD(picked.totalContributedCents)} contributed
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-1 py-1">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Decrease amount"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 transition hover:bg-amber-200"
                >
                  −
                </button>
                <span className="flex min-w-[4.5rem] items-center justify-center text-sm font-semibold text-amber-700">
                  <span aria-hidden>$</span>
                  <input
                    type="number"
                    min={minDollars}
                    step={1}
                    value={amountDollars}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setAmountDollars(Number.isFinite(n) ? Math.max(minDollars, n) : minDollars);
                    }}
                    aria-label="Amount to boost"
                    className="w-12 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </span>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Increase amount"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 transition hover:bg-amber-200"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={boostPicked}
                className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                <span aria-hidden>⚡</span> Boost Verse
              </button>
              <button
                type="button"
                onClick={makeFirstPicked}
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                {pickedIsFirst ? `Extend Lead ${formatUSD(takeFirstDollars * 100)}` : `Make #1 for ${formatUSD(takeFirstDollars * 100)}`}
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="Search a topic — e.g. anxiety, fear, perseverance"
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
          {loading ? (
            "…"
          ) : (
            <>
              <span aria-hidden>⚡</span> Boost Verse
            </>
          )}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {TOPIC_CHIPS.map((topic) => (
          <Link
            key={topic}
            href={`/search?q=${encodeURIComponent(topic.toLowerCase())}`}
            onClick={() => track("verse_search", { search_query: topic.toLowerCase() })}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600"
          >
            {topic}
          </Link>
        ))}
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Already ranked? Pick the verse above to add more support.
      </p>
    </div>
  );
}
