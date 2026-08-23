import { ImageResponse } from "next/og";
import { z } from "zod";
import { getVerseById, getVerseRank } from "@/lib/verses";
import { formatUSD } from "@/lib/money";
import { reference } from "@/types/db";

export const size = { width: 1080, height: 1080 };
export const contentType = "image/png";

const querySchema = z.object({
  verseId: z.string().uuid(),
  amount: z.coerce.number().int().nonnegative().optional(),
});

function verseFontSize(text: string): number {
  if (text.length <= 80) return 64;
  if (text.length <= 140) return 52;
  if (text.length <= 200) return 44;
  return 36;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    verseId: searchParams.get("verseId"),
    amount: searchParams.get("amount") ?? undefined,
  });

  if (!parsed.success) {
    return new Response("Invalid parameters.", { status: 400 });
  }

  const verse = await getVerseById(parsed.data.verseId);
  if (!verse) {
    return new Response("Verse not found.", { status: 404 });
  }

  const rank = await getVerseRank(verse.id);
  const ref = reference(verse);
  const verseText = truncate(verse.verse_text, 220);
  const fontSize = verseFontSize(verseText);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at 20% 15%, #6366f1 0%, #312e81 45%, #1e1b4b 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          padding: "88px 80px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -220,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(250,204,21,0.35) 0%, rgba(250,204,21,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -260,
            left: -180,
            width: 640,
            height: 640,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(99,102,241,0.45) 0%, rgba(99,102,241,0) 70%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 999,
              padding: "12px 22px",
              color: "#fde68a",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            JUST BOOSTED
          </div>
          {rank && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 108,
                height: 108,
                borderRadius: 9999,
                background: "#facc15",
                color: "#1e1b4b",
                fontSize: 40,
                fontWeight: 800,
              }}
            >
              #{rank}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 140,
            color: "rgba(255,255,255,0.25)",
            lineHeight: 0.4,
            marginTop: 44,
          }}
        >
          &quot;
        </div>

        <div
          style={{
            display: "flex",
            fontSize,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.25,
            marginTop: 8,
          }}
        >
          {verseText}
        </div>

        <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: "#fde68a", marginTop: 36 }}>
          {ref}
        </div>

        <div style={{ display: "flex", flexGrow: 1 }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "#facc15",
                color: "#1e1b4b",
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              BR
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 14 }}>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#ffffff" }}>
                BibleRank
              </div>
              <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.7)" }}>
                bible-rank.com
              </div>
            </div>
          </div>
          {parsed.data.amount != null && (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 700,
                color: "#ffffff",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 999,
                padding: "14px 26px",
              }}
            >
              +{formatUSD(parsed.data.amount)} contributed
            </div>
          )}
        </div>
      </div>
    ),
    size
  );
}
