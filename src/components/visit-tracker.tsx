"use client";

import { useEffect } from "react";

const STORAGE_KEY = "br_visited";

export function VisitTracker() {
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      localStorage.setItem(STORAGE_KEY, "1");
      fetch("/api/visit", { method: "POST", keepalive: true });
    } catch {
      // Visitor counting must never break the page.
    }
  }, []);

  return null;
}
