import { supabaseServer } from "./supabase/server";
import { supabaseAdmin } from "./supabase/admin";
import type { InterpretationRow } from "@/types/db";

export async function getInterpretationsForVerse(
  verseId: string,
  limit = 20
): Promise<InterpretationRow[]> {
  const { data, error } = await supabaseServer()
    .from("interpretations")
    .select("*")
    .eq("verse_id", verseId)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as InterpretationRow[];
}

export async function createInterpretation(input: {
  verseId: string;
  authorName?: string | null;
  body: string;
}): Promise<InterpretationRow> {
  const { data, error } = await supabaseAdmin()
    .from("interpretations")
    .insert({
      verse_id: input.verseId,
      author_name: input.authorName ?? null,
      body: input.body,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as InterpretationRow;
}
