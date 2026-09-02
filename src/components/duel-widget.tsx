"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { formatUSD } from "@/lib/money";
import { track } from "@/lib/analytics";
import type { DuelDTO } from "@/types/db";

const QUICK_AMOUNTS = [1, 5, 10, 25];

function useCountdown(windowEnd: string) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function update() {
      const ms = new Date(windowEnd).getTime() - Date.now();
      if (ms <= 0) {
        setLabel("Closing…");
        return;
      }
      const days = Math.floor(ms / (24 * 60 * 60 * 1000));
      const hours = Math.floor((ms / (60 * 60 * 1000)) % 24);
      const minutes = Math.floor((ms / (60 * 1000)) % 60);
      if (days > 0) setLabel(`${days}d ${hours}h left`);
      else if (hours > 0) setLabel(`${hours}h ${minutes}m left`);
      else setLabel(`${minutes}m left`);
    }
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [windowEnd]);

  return label;
}

function useDuelTallies(duelId: string, initial: { a: number; b: number }, initialBackers: { a: number; b: number }) {
  const [totals, setTotals] = useState(initial);
  const [backers, setBackers] = useState(initialBackers);
  const mounted = useRef(true);

  async function refresh() {
    try {
      const res = await fetch(`/api/duels/${duelId}/tallies`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted.current) return;
      setTotals({ a: data.sideATotalCents ?? 0, b: data.sideBTotalCents ?? 0 });
      setBackers({ a: data.sideABackerCount ?? 0, b: data.sideBBackerCount ?? 0 });
    } catch {
      // Polling fallback must never break the page.
    }
  }

  useEffect(() => {
    mounted.current = true;

    let channel: RealtimeChannel | undefined;
    try {
      const client = supabaseBrowser();
      channel = client
        .channel(`duel-backings:${duelId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "duel_backings", filter: `duel_id=eq.${duelId}` },
          () => refresh()
        )
        .subscribe();
    } catch {
      // Realtime is a progressive enhancement — polling below keeps totals correct.
    }

    const pollId = setInterval(refresh, 8000);

    return () => {
      mounted.current = false;
      channel?.unsubscribe();
      clearInterval(pollId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duelId]);

  return { totals, backers };
}

export function DuelWidget({ duel }: { duel: DuelDTO }) {
  const countdown = useCountdown(duel.windowEnd);
  const { totals, backers } = useDuelTallies(duel.id, duel.totalsBySide, duel.backerCountsBySide);

  const [side, setSide] = useState<"a" | "b" | null>(null);
  const [amount, setAmount] = useState<number | "">(5);
  const [customValue, setCustomValue] = useState("");
  const [whyNote, setWhyNote] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grandTotal = totals.a + totals.b;
  const pctA = grandTotal > 0 ? Math.round((totals.a / grandTotal) * 100) : 50;
  const pctB = 100 - pctA;
  const resolved = duel.status === "resolved";

  async function startCheckout() {
    if (!side) {
      setError("Choose which verse speaks to you more.");
      return;
    }
    const dollars = Number(amount);
    if (!Number.isInteger(dollars) || dollars < 1) {
      setError("Enter a whole-dollar amount of at least $1.");
      return;
    }
    setError(null);
    setLoading(true);
    track("contribution_started", { duel_id: duel.id, side, amount: dollars });
    try {
      const res = await fetch("/api/duels/back-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duelId: duel.id,
          side,
          amountDollars: dollars,
          whyNote: whyNote.trim() || undefined,
          authorName: authorName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "We couldn't start checkout. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("We couldn't start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">
          {resolved ? "This week's Verse Duel" : "Which speaks to you more this week?"}
        </p>
        {!resolved && <p className="text-xs font-medium text-amber-700">{countdown}</p>}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <VerseSide
          label="A"
          reference={duel.verseA.reference}
          text={duel.verseA.text}
          totalCents={totals.a}
          backerCount={backers.a}
          percent={pctA}
          selected={side === "a"}
          resolved={resolved}
          resonated={duel.resolvedSide === "a"}
          onSelect={() => setSide("a")}
        />
        <VerseSide
          label="B"
          reference={duel.verseB.reference}
          text={duel.verseB.text}
          totalCents={totals.b}
          backerCount={backers.b}
          percent={pctB}
          selected={side === "b"}
          resolved={resolved}
          resonated={duel.resolvedSide === "b"}
          onSelect={() => setSide("b")}
        />
      </div>

      {resolved ? (
        <p className="mt-4 text-sm text-slate-600">
          {duel.resolvedSide === null
            ? "Both verses spoke to people equally this round."
            : `${duel.resolvedSide === "a" ? duel.verseA.reference : duel.verseB.reference} spoke to more people this week.`}
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setAmount(v);
                  setCustomValue("");
                }}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  amount === v
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 text-slate-700 hover:border-indigo-400"
                }`}
              >
                ${v}
              </button>
            ))}
            <div className="flex items-center rounded-lg border border-slate-300 px-2">
              <span className="text-slate-400">$</span>
              <input
                type="number"
                min={1}
                step={1}
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  const n = parseInt(e.target.value, 10);
                  setAmount(Number.isFinite(n) ? n : "");
                }}
                placeholder="custom"
                className="w-16 px-1 py-1.5 text-sm outline-none"
              />
            </div>
          </div>

          <input
            value={whyNote}
            onChange={(e) => setWhyNote(e.target.value)}
            maxLength={280}
            type="text"
            placeholder="Why this speaks to me (optional)"
            className="mt-3 w-full rounded-full border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500"
          />
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={80}
            type="text"
            placeholder="Your name (optional)"
            className="mt-2 w-full rounded-full border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 sm:max-w-xs"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            disabled={loading || !side || amount === "" || amount < 1}
            onClick={startCheckout}
            className="mt-4 w-full rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Starting checkout…" : side ? `Back Verse ${side.toUpperCase()}` : "Choose a verse to back"}
          </button>
        </>
      )}
    </div>
  );
}

function VerseSide({
  label,
  reference,
  text,
  totalCents,
  backerCount,
  percent,
  selected,
  resolved,
  resonated,
  onSelect,
}: {
  label: string;
  reference: string;
  text: string;
  totalCents: number;
  backerCount: number;
  percent: number;
  selected: boolean;
  resolved: boolean;
  resonated: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={resolved}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-indigo-600 bg-indigo-50"
          : resolved && resonated
            ? "border-amber-400 bg-amber-50"
            : "border-slate-200 hover:border-indigo-300"
      } ${resolved ? "cursor-default" : "cursor-pointer"}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Verse {label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{reference}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{text}</p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {formatUSD(totalCents)} · {backerCount} {backerCount === 1 ? "person has" : "people have"} found this more
        resonant so far
      </p>
    </button>
  );
}
