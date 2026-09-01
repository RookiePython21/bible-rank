// Minimal analytics abstraction. Fires a best-effort beacon to /api/analytics,
// which currently just logs server-side. Swap the route handler for a real
// provider (PostHog, Plausible, etc.) later without touching call sites.

export type AnalyticsEvent =
  | "homepage_view"
  | "leaderboard_view"
  | "verse_search"
  | "verse_selected"
  | "verse_detail_view"
  | "contribution_started"
  | "stripe_checkout_created"
  | "contribution_completed"
  | "share_clicked"
  | "leaderboard_row_click"
  | "interpretation_submitted";

export function track(event: AnalyticsEvent, properties: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ event, properties, timestamp: Date.now() });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", payload);
    } else {
      fetch("/api/analytics", { method: "POST", body: payload, keepalive: true });
    }
  } catch {
    // Analytics must never break the product experience.
  }
}
