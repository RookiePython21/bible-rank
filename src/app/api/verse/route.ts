import { NextResponse } from "next/server";
import { getVerseByReference, getVerseRank } from "@/lib/verses";
import { toVerseDTO } from "@/types/db";
import { slugify } from "@/lib/bible-books";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const book = searchParams.get("book");
  const chapter = parseInt(searchParams.get("chapter") || "", 10);
  const verse = parseInt(searchParams.get("verse") || "", 10);

  if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) {
    return NextResponse.json({ error: "book, chapter, and verse are required." }, { status: 400 });
  }

  const row = await getVerseByReference(slugify(book), chapter, verse);
  if (!row) {
    return NextResponse.json({ error: "We couldn't find that Bible reference." }, { status: 404 });
  }

  const rank = await getVerseRank(row.id);
  return NextResponse.json(toVerseDTO(row, rank));
}
