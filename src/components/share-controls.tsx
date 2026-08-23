"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

export function ShareControls({ url, text, verseId }: { url: string; text: string; verseId: string }) {
  const [copied, setCopied] = useState(false);

  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  async function copyLink() {
    track("share_clicked", { method: "copy_link", url, verse_id: verseId });
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently ignore, link is still visible via share buttons.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copyLink}
        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600"
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("share_clicked", { method: "x", url, verse_id: verseId })}
        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600"
      >
        Share on X
      </a>
      <a
        href={fbHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("share_clicked", { method: "facebook", url, verse_id: verseId })}
        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600"
      >
        Share on Facebook
      </a>
    </div>
  );
}
