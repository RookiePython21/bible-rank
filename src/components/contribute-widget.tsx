"use client";

import { useState } from "react";
import { formatUSD } from "@/lib/money";
import { track } from "@/lib/analytics";

const QUICK_AMOUNTS = [1, 5, 10, 25, 50];

type Props = {
  verseId: string;
  currentTotalCents: number;
  takeFirstDollars: number;
  isCurrentlyFirst: boolean;
  initialAmountDollars?: number;
  interpretationBody?: string;
  interpretationAuthorName?: string;
  submitLabel?: string;
};

export function ContributeWidget({
  verseId,
  currentTotalCents,
  takeFirstDollars,
  isCurrentlyFirst,
  initialAmountDollars,
  interpretationBody,
  interpretationAuthorName,
  submitLabel = "Continue to Payment",
}: Props) {
  const [amount, setAmount] = useState<number | "">(initialAmountDollars ?? 10);
  const [customValue, setCustomValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectedCents = currentTotalCents + (typeof amount === "number" ? amount * 100 : 0);

  async function startCheckout(dollars: number) {
    if (!Number.isInteger(dollars) || dollars < 1) {
      setError("Enter a whole-dollar amount of at least $1.");
      return;
    }
    setError(null);
    setLoading(true);
    track("contribution_started", { verse_id: verseId, amount: dollars });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verseId,
          amountDollars: dollars,
          interpretationBody: interpretationBody?.trim() || undefined,
          authorName: interpretationAuthorName?.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "We couldn't start checkout. Please try again.");
        setLoading(false);
        return;
      }
      track("stripe_checkout_created", { verse_id: verseId, amount: dollars });
      window.location.href = data.url;
    } catch {
      setError("We couldn't start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <p className="text-sm font-semibold text-slate-900">Support this verse</p>

      <div className="mt-3 flex flex-wrap gap-2">
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
            +${v}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setAmount(takeFirstDollars);
            setCustomValue("");
          }}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
            amount === takeFirstDollars
              ? "border-amber-500 bg-amber-500 text-white"
              : "border-amber-300 text-amber-700 hover:border-amber-500"
          }`}
        >
          {isCurrentlyFirst ? `Extend Lead ${formatUSD(takeFirstDollars * 100)}` : `Boost to top for ${formatUSD(takeFirstDollars * 100)}`}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-slate-500">or custom amount:</span>
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
            placeholder="25"
            className="w-20 px-1 py-1.5 text-sm outline-none"
          />
        </div>
      </div>

      <div className="mt-4 space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <div className="flex justify-between">
          <span>Current total</span>
          <span>{formatUSD(currentTotalCents)}</span>
        </div>
        <div className="flex justify-between font-semibold text-slate-900">
          <span>Projected total</span>
          <span>{formatUSD(projectedCents)}</span>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={loading || amount === "" || amount < 1}
        onClick={() => startCheckout(Number(amount))}
        className="mt-4 w-full rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Starting checkout…" : submitLabel}
      </button>

      <p className="mt-3 text-center text-xs text-slate-400">
        Rankings are live and may change before payment completes.
      </p>
    </div>
  );
}
