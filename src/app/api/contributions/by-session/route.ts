import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required." }, { status: 400 });
  }

  const { data, error } = await supabaseServer()
    .from("contributions")
    .select("*, verse:verses(*)")
    .eq("stripe_checkout_session_id", sessionId)
    .eq("status", "completed")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }

  return NextResponse.json({ contribution: data ?? null });
}
