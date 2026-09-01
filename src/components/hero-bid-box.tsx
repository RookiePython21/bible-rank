"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BIBLE_BOOKS, BOOK_SECTIONS } from "@/lib/bible-books";
import { formatUSD, MIN_CONTRIBUTION_CENTS, TAKE_FIRST_MARGIN_CENTS } from "@/lib/money";
import { track } from "@/lib/analytics";
import type { VerseDTO } from "@/types/db";

const TOPIC_CHIPS = ["Anxiety", "Love", "Forgiveness", "Hope", "Strength", "Faith", "Peace", "Grief"];

type Props = { topTotalCents: number };

export function HeroBidBox({ topTotalCents }: Props) {
  const router = useRouter();
  const minDollars = Math.ceil(MIN_CONTRIBUTION_CENTS / 100);
  const [amountDollars, setAmountDollars] = useState(
    Math.max(minDollars, Math.round((topTotalCents + TAKE_FIRST_MARGIN_CENTS) / 100))
  );
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
      if (dto) track("verse_selected", { book_slug: bookSlug, chapter, verse: newVerse });
    } finally {
      setPickLoading(false);
    }
  }

  function boostPicked() {
    if (!picked) return;
    router.push(`/checkout/${picked.bookSlug}-${picked.chapter}-${picked.verse}?amount=${amountDollars}`);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    track("verse_search", { search_query: q });
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
            <button
              type="button"
              onClick={boostPicked}
              className="mt-3 rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
            >
              <span aria-hidden>⚡</span> Boost Verse
            </button>
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
