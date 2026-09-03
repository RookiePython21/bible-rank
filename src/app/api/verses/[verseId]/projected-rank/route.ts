import { NextResponse } from "next/server";
import { z } from "zod";
import { getRankForTotal } from "@/lib/verses";

const paramsSchema = z.object({ verseId: z.string().uuid() });

// Live rank preview: what rank a verse would land at if its total were the
// projected total (current total + the amount being entered), before payment.
export async function GET(req: Request, ctx: RouteContext<"/api/verses/[verseId]/projected-rank">) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid verse id." }, { status: 400 });
  }

  const cents = parseInt(new URL(req.url).searchParams.get("cents") ?? "", 10);
  if (!Number.isFinite(cents) || cents < 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  const rank = await getRankForTotal(parsed.data.verseId, cents);
  return NextResponse.json({ rank });
}
