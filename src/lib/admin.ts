import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import type { ContributionRow, VerseRow } from "@/types/db";

export async function getAdminContributions(
  query?: string,
  limit = 50
): Promise<(ContributionRow & { verse: VerseRow | null })[]> {
  let q = supabaseAdmin()
    .from("contributions")
    .select("*, verse:verses(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (query) {
    q = q.or(
      `stripe_checkout_session_id.eq.${query},stripe_payment_intent_id.eq.${query},stripe_event_id.eq.${query}`
    );
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as (ContributionRow & { verse: VerseRow | null })[];
}

export async function getWebhookFailures(limit = 25) {
  const { data, error } = await supabaseAdmin()
    .from("webhook_failures")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getRecentSearchEvents(limit = 25) {
  const { data, error } = await supabaseAdmin()
    .from("search_events")
    .select("*, verse:verses(canonical_key)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type ReconciliationRow = {
  verse_id: string;
  canonical_key: string;
  stored_total_cents: number;
  computed_total_cents: number;
  diff_cents: number;
};

export async function getReconciliationDrift(): Promise<ReconciliationRow[]> {
  const { data, error } = await supabaseAdmin().rpc("reconcile_totals");
  if (error) throw new Error(error.message);
  return (data ?? []) as ReconciliationRow[];
}

export async function setContributionHidden(contributionId: string, hidden: boolean) {
  const { error } = await supabaseAdmin()
    .from("contributions")
    .update({ hidden_from_activity: hidden })
    .eq("id", contributionId);
  if (error) throw new Error(error.message);
}

export async function getVerseTotalsSummary() {
  const { count: fundedCount, error: fundedError } = await supabaseAdmin()
    .from("verses")
    .select("id", { count: "exact", head: true })
    .gt("total_contributed_cents", 0);
  if (fundedError) throw new Error(fundedError.message);

  const { count: totalVerses, error: totalError } = await supabaseAdmin()
    .from("verses")
    .select("id", { count: "exact", head: true });
  if (totalError) throw new Error(totalError.message);

  return { fundedCount: fundedCount ?? 0, totalVerses: totalVerses ?? 0 };
}
