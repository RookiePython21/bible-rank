import "server-only";
import { supabaseAdmin } from "./supabase/admin";

/**
 * Resolves any duel whose window has closed, opening the next one.
 * Called by the cron route (GET/POST /api/cron/resolve) and directly by the
 * /admin "Resolve now" server action, which is already gated behind /admin's
 * HTTP Basic Auth and so doesn't need to round-trip through CRON_SECRET.
 */
export async function resolveDueDuels(): Promise<{ duelId: string; resolvedSide: string | null }[]> {
  const admin = supabaseAdmin();

  const { data: dueDuels, error } = await admin
    .from("duels")
    .select("id")
    .eq("status", "open")
    .lte("window_end", new Date().toISOString());

  if (error) throw new Error(error.message);

  const results: { duelId: string; resolvedSide: string | null }[] = [];

  for (const row of dueDuels ?? []) {
    const { data, error: resolveError } = await admin.rpc("resolve_duel", { p_duel_id: row.id });
    if (resolveError) {
      console.error("resolveDueDuels: failed to resolve duel", row.id, resolveError);
      continue;
    }
    const resolved = (data ?? [])[0] as { duel_id: string; resolved_side: string | null } | undefined;
    if (resolved) {
      results.push({ duelId: resolved.duel_id, resolvedSide: resolved.resolved_side });
    }
  }

  // If nothing was due but somehow no duel is currently open (e.g. first
  // deploy before the seed migration ran), open one so the feature always
  // has content.
  if (results.length === 0) {
    const { data: openDuel } = await admin.from("duels").select("id").eq("status", "open").maybeSingle();
    if (!openDuel) {
      await admin.rpc("create_next_duel");
    }
  }

  return results;
}
