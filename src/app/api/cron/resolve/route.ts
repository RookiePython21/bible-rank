import { NextResponse } from "next/server";
import { resolveDueDuels } from "@/lib/duel-resolution";

// Resolves any duel whose window has closed. Vercel Cron invokes this via GET
// with an `Authorization: Bearer $CRON_SECRET` header it attaches automatically
// (see vercel.json). The same handler is reachable via POST for a manual
// trigger. Idempotent-in-effect: resolveDueDuels() queries for anything past
// due rather than assuming exactly one row is waiting, so a missed or
// delayed trigger self-corrects on the next call.
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  return Boolean(secret) && auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const results = await resolveDueDuels();
    return NextResponse.json({ resolved: results });
  } catch (err) {
    console.error("cron/resolve failed", err);
    return NextResponse.json({ error: "Failed to resolve duels." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
