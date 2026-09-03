"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

type Props = {
  verseId: string;
  unlocked: boolean;
  onDraftChange?: (body: string, authorName: string) => void;
};

const DRAFT_BODY_MAX = 500;

export function InterpretationForm({ verseId, unlocked, onDraftChange }: Props) {
  const router = useRouter();
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [draftAuthorName, setDraftAuthorName] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interpretations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verseId,
          authorName: authorName.trim() || undefined,
          body: trimmed,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "We couldn't save your interpretation. Please try again.");
        setLoading(false);
        return;
      }
      track("interpretation_submitted", { verse_id: verseId });
      setBody("");
      setAuthorName("");
      router.refresh();
    } catch {
      setError("We couldn't save your interpretation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="mt-4 space-y-2">
        <textarea
          value={draftBody}
          onChange={(e) => {
            const next = e.target.value;
            setDraftBody(next);
            onDraftChange?.(next, draftAuthorName);
          }}
          maxLength={DRAFT_BODY_MAX}
          rows={3}
          placeholder="What does this verse mean to you?"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500"
        />
        <input
          value={draftAuthorName}
          onChange={(e) => {
            const next = e.target.value;
            setDraftAuthorName(next);
            onDraftChange?.(draftBody, next);
          }}
          maxLength={80}
          type="text"
          placeholder="Your name (optional)"
          className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 sm:max-w-xs"
        />
        <p className="text-xs text-slate-500">
          We&apos;ll share this once your contribution below goes through.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="What does this verse mean to you?"
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-indigo-500"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={80}
          type="text"
          placeholder="Your name (optional)"
          className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="shrink-0 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Posting…" : "Share your interpretation"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
