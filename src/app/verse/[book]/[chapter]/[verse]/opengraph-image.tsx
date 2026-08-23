import { ImageResponse } from "next/og";
import { getVerseByReference, getVerseRank } from "@/lib/verses";
import { formatUSD } from "@/lib/money";
import { reference } from "@/types/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ book: string; chapter: string; verse: string }>;
}) {
  const p = await params;
  const chapter = parseInt(p.chapter, 10);
  const verse = parseInt(p.verse, 10);
  const row = await getVerseByReference(p.book, chapter, verse);

  if (!row) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: "#fff" }} />
      ),
      size
    );
  }

  const rank = await getVerseRank(row.id);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #eef2ff 0%, #ffffff 100%)",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 90,
            height: 90,
            borderRadius: 999,
            background: "#4f46e5",
            color: "white",
            fontSize: 36,
            fontWeight: 800,
          }}
        >
          {rank ? `#${rank}` : "—"}
        </div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: "#0f172a", marginTop: 32 }}>
          {reference(row)}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#475569", marginTop: 16, maxWidth: 950 }}>
          {row.verse_text.length > 160 ? row.verse_text.slice(0, 157) + "…" : row.verse_text}
        </div>
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#4f46e5", marginTop: 40 }}>
          {formatUSD(row.total_contributed_cents)} contributed · BibleRank
        </div>
      </div>
    ),
    size
  );
}
