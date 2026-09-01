import { NextResponse } from "next/server";
import { z } from "zod";
import { createInterpretation } from "@/lib/interpretations";
import { getVerseById } from "@/lib/verses";
import { isRateLimited, clientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  verseId: z.string().uuid(),
  authorName: z.string().trim().max(80).optional(),
  body: z.string().trim().min(1).max(2000),
});

function stripControlChars(value: string): string {
  return Array.from(value)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code > 0x1f && code !== 0x7f;
    })
    .join("");
}

export async function POST(req: Request) {
  if (isRateLimited(`interpretations:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A verse and a short interpretation are required." },
      { status: 400 }
    );
  }

  const verse = await getVerseById(parsed.data.verseId);
  if (!verse) {
    return NextResponse.json({ error: "Verse not found." }, { status: 404 });
  }

  const body = stripControlChars(parsed.data.body);
  const authorName = parsed.data.authorName
    ? stripControlChars(parsed.data.authorName) || undefined
    : undefined;

  try {
    const interpretation = await createInterpretation({
      verseId: parsed.data.verseId,
      authorName,
      body,
    });
    return NextResponse.json(interpretation);
  } catch (err) {
    console.error("interpretation submit error", err);
    return NextResponse.json(
      { error: "We couldn't save your interpretation. Please try again." },
      { status: 500 }
    );
  }
}
