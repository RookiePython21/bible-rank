import { ImageResponse } from "next/og";
import { z } from "zod";
import { getDuelById } from "@/lib/duels";
import { formatUSD } from "@/lib/money";

export const size = { width: 1080, height: 1080 };
export const contentType = "image/png";

const querySchema = z.object({
  duelId: z.string().uuid(),
  variant: z.enum(["open", "resolved-a", "resolved-b"]),
});

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

function verseFontSize(text: string): number {
  if (text.length <= 60) return 40;
  if (text.length <= 110) return 32;
  return 26;
}

function VerseCard({
  reference,
  text,
  highlighted,
}: {
  reference: string;
  text: string;
  highlighted?: boolean;
}) {
  const truncated = truncate(text, 180);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 24,
        padding: "28px 32px",
        background: highlighted ? "rgba(250,204,21,0.16)" : "rgba(255,255,255,0.08)",
        border: `1px solid ${highlighted ? "rgba(250,204,21,0.5)" : "rgba(255,255,255,0.2)"}`,
      }}
    >
      <div style={{ display: "flex", fontSize: 26, fontWeight: 800, color: "#fde68a" }}>{reference}</div>
      <div
        style={{
          display: "flex",
          fontSize: verseFontSize(truncated),
          fontWeight: 600,
          color: "#ffffff",
          lineHeight: 1.35,
          marginTop: 10,
        }}
      >
        {truncated}
      </div>
    </div>
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    duelId: searchParams.get("duelId"),
    variant: searchParams.get("variant"),
  });

  if (!parsed.success) {
    return new Response("Invalid parameters.", { status: 400 });
  }

  const duel = await getDuelById(parsed.data.duelId);
  if (!duel) {
    return new Response("Duel not found.", { status: 404 });
  }

  const { variant } = parsed.data;
  const focusSide = variant === "resolved-a" ? "a" : variant === "resolved-b" ? "b" : null;
  const focusVerse = focusSide === "a" ? duel.verseA : focusSide === "b" ? duel.verseB : null;
  const isResonantSide = focusSide !== null && duel.resolvedSide === focusSide;

  let eyebrow = "VERSE DUEL";
  let headline: string;

  if (variant === "open") {
    headline = "Which speaks to you more?";
  } else if (duel.resolvedSide === null) {
    headline = "Both verses spoke to people equally this round.";
  } else if (isResonantSide) {
    headline = `${focusVerse!.reference} spoke to more people this week.`;
  } else {
    eyebrow = "VERSE DUEL — YOUR TURN";
    headline = "Your verse resonated with people too — start it again in this week's new duel.";
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "radial-gradient(circle at 20% 15%, #6366f1 0%, #312e81 45%, #1e1b4b 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          padding: "88px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 999,
            padding: "12px 22px",
            color: "#fde68a",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          {eyebrow}
        </div>

        <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#ffffff", lineHeight: 1.25, marginTop: 36 }}>
          {headline}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 48 }}>
          {variant === "open" ? (
            <>
              <VerseCard reference={duel.verseA.reference} text={duel.verseA.text} />
              <VerseCard reference={duel.verseB.reference} text={duel.verseB.text} />
            </>
          ) : (
            <VerseCard reference={focusVerse!.reference} text={focusVerse!.text} highlighted={isResonantSide} />
          )}
        </div>

        <div style={{ display: "flex", flexGrow: 1 }} />

        {variant !== "open" && (
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "#fde68a",
              marginBottom: 24,
            }}
          >
            {formatUSD(duel.totalsBySide.a)} for {duel.verseA.reference} · {formatUSD(duel.totalsBySide.b)} for{" "}
            {duel.verseB.reference}
          </div>
        )}

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
            <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#ffffff" }}>BibleRank</div>
            <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.7)" }}>bible-rank.com/duel</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
