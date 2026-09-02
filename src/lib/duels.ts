import { supabaseServer } from "./supabase/server";
import type { DuelDTO } from "@/types/db";

type DuelQueryRow = {
  id: string;
  window_start: string;
  window_end: string;
  status: "open" | "resolved";
  resolved_side: "a" | "b" | null;
  verse_a_id: string;
  verse_a_canonical_key: string;
  verse_a_book_name: string;
  verse_a_book_slug: string;
  verse_a_chapter_number: number;
  verse_a_verse_number: number;
  verse_a_text: string;
  verse_b_id: string;
  verse_b_canonical_key: string;
  verse_b_book_name: string;
  verse_b_book_slug: string;
  verse_b_chapter_number: number;
  verse_b_verse_number: number;
  verse_b_text: string;
  side_a_total_cents: number;
  side_b_total_cents: number;
  side_a_backer_count: number;
  side_b_backer_count: number;
};

function mapDuelRow(row: DuelQueryRow): DuelDTO {
  return {
    id: row.id,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    status: row.status,
    resolvedSide: row.resolved_side,
    verseA: {
      id: row.verse_a_id,
      canonicalKey: row.verse_a_canonical_key,
      reference: `${row.verse_a_book_name} ${row.verse_a_chapter_number}:${row.verse_a_verse_number}`,
      bookSlug: row.verse_a_book_slug,
      chapter: row.verse_a_chapter_number,
      verse: row.verse_a_verse_number,
      text: row.verse_a_text,
    },
    verseB: {
      id: row.verse_b_id,
      canonicalKey: row.verse_b_canonical_key,
      reference: `${row.verse_b_book_name} ${row.verse_b_chapter_number}:${row.verse_b_verse_number}`,
      bookSlug: row.verse_b_book_slug,
      chapter: row.verse_b_chapter_number,
      verse: row.verse_b_verse_number,
      text: row.verse_b_text,
    },
    totalsBySide: { a: row.side_a_total_cents, b: row.side_b_total_cents },
    backerCountsBySide: { a: row.side_a_backer_count, b: row.side_b_backer_count },
  };
}

export async function getCurrentDuel(): Promise<DuelDTO | null> {
  const { data, error } = await supabaseServer().rpc("get_current_duel");
  if (error) throw new Error(error.message);
  const row = (data ?? [])[0] as DuelQueryRow | undefined;
  return row ? mapDuelRow(row) : null;
}

export async function getDuelById(duelId: string): Promise<DuelDTO | null> {
  const { data, error } = await supabaseServer().rpc("get_duel_by_id", { p_duel_id: duelId });
  if (error) throw new Error(error.message);
  const row = (data ?? [])[0] as DuelQueryRow | undefined;
  return row ? mapDuelRow(row) : null;
}

export async function getDuelTallies(duelId: string): Promise<{
  sideATotalCents: number;
  sideBTotalCents: number;
  sideABackerCount: number;
  sideBBackerCount: number;
}> {
  const { data, error } = await supabaseServer().rpc("get_duel_tallies", { p_duel_id: duelId });
  if (error) throw new Error(error.message);
  const row = (data ?? [])[0] as
    | {
        side_a_total_cents: number;
        side_b_total_cents: number;
        side_a_backer_count: number;
        side_b_backer_count: number;
      }
    | undefined;
  return {
    sideATotalCents: row?.side_a_total_cents ?? 0,
    sideBTotalCents: row?.side_b_total_cents ?? 0,
    sideABackerCount: row?.side_a_backer_count ?? 0,
    sideBBackerCount: row?.side_b_backer_count ?? 0,
  };
}
