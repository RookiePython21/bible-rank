import { NextResponse } from "next/server";
import { getChaptersForBook, getVersesForChapter } from "@/lib/verses";
import { BOOK_BY_SLUG } from "@/lib/bible-books";

// Powers the Book -> Chapter -> Verse selector. Only ever returns numbers
// that exist in the canonical `verses` table, so invalid combinations can
// never be selected.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const book = searchParams.get("book");
  const chapterParam = searchParams.get("chapter");

  if (!book || !BOOK_BY_SLUG.has(book)) {
    return NextResponse.json({ error: "Unknown book." }, { status: 400 });
  }

  if (chapterParam) {
    const chapter = parseInt(chapterParam, 10);
    if (!Number.isFinite(chapter)) {
      return NextResponse.json({ error: "Invalid chapter." }, { status: 400 });
    }
    const verses = await getVersesForChapter(book, chapter);
    return NextResponse.json({ verses });
  }

  const chapters = await getChaptersForBook(book);
  return NextResponse.json({ chapters });
}
