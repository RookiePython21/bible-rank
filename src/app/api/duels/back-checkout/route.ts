import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient } from "@/lib/stripe";
import { getDuelById } from "@/lib/duels";
import { dollarsToCents, MIN_CONTRIBUTION_CENTS } from "@/lib/money";
import { isRateLimited, clientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  duelId: z.string().uuid(),
  side: z.enum(["a", "b"]),
  amountDollars: z.number().int().positive(),
  whyNote: z.string().trim().max(280).optional(),
  authorName: z.string().trim().max(80).optional(),
});

function stripControlChars(value: string): string {
  return Array.from(value)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code > 0x1f && code !== 0x7f;
    })
    .join("");
}

export async function POST(req: Request) {
  if (isRateLimited(`duel-back:${clientIp(req)}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again." },
      { status: 429 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a whole-dollar amount of at least $1." },
      { status: 400 }
    );
  }

  const { duelId, side, amountDollars } = parsed.data;
  const amountCents = dollarsToCents(amountDollars);

  if (amountCents < MIN_CONTRIBUTION_CENTS) {
    return NextResponse.json(
      { error: "Enter a whole-dollar amount of at least $1." },
      { status: 400 }
    );
  }

  const duel = await getDuelById(duelId);
  if (!duel) {
    return NextResponse.json({ error: "That duel could not be found." }, { status: 404 });
  }
  if (duel.status !== "open" || new Date(duel.windowEnd) <= new Date()) {
    return NextResponse.json(
      { error: "This week's duel has closed. Check back for the next one." },
      { status: 400 }
    );
  }

  const verse = side === "a" ? duel.verseA : duel.verseB;
  const whyNote = parsed.data.whyNote ? stripControlChars(parsed.data.whyNote) : "";
  const authorName = parsed.data.authorName ? stripControlChars(parsed.data.authorName) : "";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  try {
    const session = await stripeClient().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `Back ${verse.reference} in this week's Verse Duel on BibleRank`,
              description: "Contributions show which verse speaks to more people this week.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        duel_id: duelId,
        side,
        why_note: whyNote,
        author_name: authorName,
        amount_cents: String(amountCents),
      },
      success_url: `${siteUrl}/duel?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/duel?canceled=1`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("duel back-checkout session creation failed", err);
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again." },
      { status: 500 }
    );
  }
}
