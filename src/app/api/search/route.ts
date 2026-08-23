import { NextResponse } from "next/server";
import { z } from "zod";
import { performSearch } from "@/lib/search";
import { logSearchEvent } from "@/lib/verses";
import { isRateLimited, clientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  query: z.string().trim().min(1).max(200),
});

export async function POST(req: Request) {
  if (isRateLimited(`search:${clientIp(req)}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Too many searches. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "A search query is required." }, { status: 400 });
  }

  // Strip control characters; length is already capped by the schema.
  const query = Array.from(parsed.data.query)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code > 0x1f && code !== 0x7f;
    })
    .join("");

  try {
    const outcome = await performSearch(query);
    void logSearchEvent(query);
    return NextResponse.json(outcome);
  } catch (err) {
    console.error("search error", err);
    return NextResponse.json(
      { error: "We couldn't confidently match that search. Try another phrase or select the verse directly." },
      { status: 500 }
    );
  }
}
