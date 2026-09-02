import { NextResponse } from "next/server";
import { z } from "zod";
import { getDuelTallies } from "@/lib/duels";

const paramsSchema = z.object({ duelId: z.string().uuid() });

export async function GET(_req: Request, ctx: RouteContext<"/api/duels/[duelId]/tallies">) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid duel id." }, { status: 400 });
  }

  const tallies = await getDuelTallies(parsed.data.duelId);
  return NextResponse.json(tallies);
}
