import { NextResponse } from "next/server";
import { incrementVerseClick, logSearchEvent, logAnalyticsEvent } from "@/lib/verses";

// MVP analytics sink — logs events server-side. Replace with a real provider
// (PostHog, Plausible, etc.) when ready; lib/analytics.ts's track() call
// sites don't need to change.
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const { event, properties } = JSON.parse(body);
    console.info("[analytics]", event, properties);
    if (event === "leaderboard_row_click" && properties?.verse_id) {
      await incrementVerseClick(properties.verse_id).catch(() => {});
    }
    if (event === "verse_search" && properties?.search_query) {
      await logSearchEvent(properties.search_query).catch(() => {});
    }
    if (event === "verse_detail_view" && properties?.verse_id) {
      await logAnalyticsEvent("verse_view", properties.verse_id).catch(() => {});
    }
    if (event === "share_clicked" && properties?.verse_id) {
      await logAnalyticsEvent("verse_share", properties.verse_id, { platform: properties.method }).catch(() => {});
    }
  } catch {
    // Never fail the request over malformed analytics payloads.
  }
  return NextResponse.json({ ok: true });
}
