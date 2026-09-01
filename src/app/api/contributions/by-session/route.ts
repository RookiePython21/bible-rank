import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { UNLOCK_COOKIE_NAME, unlockCookieOptions, unlockCookieValue } from "@/lib/interpretation-unlock";

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

  const response = NextResponse.json({ contribution: data ?? null });

  if (data?.verse_id) {
    const existing = (await cookies()).get(UNLOCK_COOKIE_NAME)?.value;
    response.cookies.set(UNLOCK_COOKIE_NAME, unlockCookieValue(existing, data.verse_id), unlockCookieOptions);
  }

  return response;
}
