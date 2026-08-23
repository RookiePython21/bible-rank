"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

export function VerseViewTracker({ verseId }: { verseId: string }) {
  useEffect(() => {
    try {
      const key = `br_viewed_${verseId}`;
      const last = sessionStorage.getItem(key);
      if (last && Date.now() - Number(last) < DEDUPE_WINDOW_MS) return;
      sessionStorage.setItem(key, String(Date.now()));
      track("verse_detail_view", { verse_id: verseId });
    } catch {
      // Tracking must never break the page.
    }
  }, [verseId]);

  return null;
}
