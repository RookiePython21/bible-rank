"use client";

import { useState } from "react";
import Link from "next/link";
import { BIBLE_BOOKS } from "@/lib/bible-books";
import type { VerseDTO } from "@/types/db";
import { formatUSD } from "@/lib/money";

export function VerseSelector() {
  const [bookSlug, setBookSlug] = useState("");
  const [chapters, setChapters] = useState<number[]>([]);
  const [chapter, setChapter] = useState<number | "">("");
  const [verses, setVerses] = useState<number[]>([]);
  const [verse, setVerse] = useState<number | "">("");
  const [confirmed, setConfirmed] = useState<VerseDTO | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleBookChange(newBook: string) {
    setBookSlug(newBook);
    setChapter("");
    setVerses([]);
    setVerse("");
    setConfirmed(null);
    setChapters([]);

    if (!newBook) return;
    const res = await fetch(`/api/verse-options?book=${newBook}`);
    const data = await res.json();
    setChapters(data.chapters ?? []);
  }

  async function handleChapterChange(newChapter: number | "") {
    setChapter(newChapter);
    setVerse("");
    setConfirmed(null);
    setVerses([]);

    if (!bookSlug || newChapter === "") return;
    const res = await fetch(`/api/verse-options?book=${bookSlug}&chapter=${newChapter}`);
    const data = await res.json();
    setVerses(data.verses ?? []);
  }

  async function handleVerseChange(newVerse: number | "") {
    setVerse(newVerse);
    setConfirmed(null);

    if (!bookSlug || chapter === "" || newVerse === "") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/verse?book=${bookSlug}&chapter=${chapter}&verse=${newVerse}`);
      const data = res.ok ? await res.json() : null;
      setConfirmed(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={bookSlug}
          onChange={(e) => handleBookChange(e.target.value)}
          aria-label="Book"
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
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
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
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
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">Verse</option>
          {verses.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="mt-4 text-sm text-slate-400">Loading verse…</p>}

      {confirmed && !loading && (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
          <p className="text-lg font-bold text-slate-900">{confirmed.reference}</p>
          <p className="mt-1 text-sm text-slate-700">{confirmed.text}</p>
          <p className="mt-2 text-xs text-slate-500">
            {confirmed.rank ? `Currently #${confirmed.rank}` : "Currently unranked"} ·{" "}
            {formatUSD(confirmed.totalContributedCents)} contributed
          </p>
          <p className="mt-3 text-sm font-medium text-slate-700">
            Is this the verse you want to rank?
          </p>
          <Link
            href={`/verse/${confirmed.bookSlug}/${confirmed.chapter}/${confirmed.verse}`}
            className="mt-3 inline-block rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Rank This Verse
          </Link>
        </div>
      )}
    </div>
  );
}
