import { NextResponse } from "next/server";
import { z } from "zod";
import { stripeClient } from "@/lib/stripe";
import { getVerseById } from "@/lib/verses";
import { reference } from "@/types/db";
import { dollarsToCents, MIN_CONTRIBUTION_CENTS } from "@/lib/money";
import { isRateLimited, clientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  verseId: z.string().uuid(),
  amountDollars: z.number().int().positive(),
});

export async function POST(req: Request) {
  if (isRateLimited(`checkout:${clientIp(req)}`, 20, 60_000)) {
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

  const { verseId, amountDollars } = parsed.data;
  const amountCents = dollarsToCents(amountDollars);

  if (amountCents < MIN_CONTRIBUTION_CENTS) {
    return NextResponse.json(
      { error: "Enter a whole-dollar amount of at least $1." },
      { status: 400 }
    );
  }

  const verse = await getVerseById(verseId);
  if (!verse) {
    return NextResponse.json({ error: "That verse could not be found." }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const ref = reference(verse);

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
              name: `Support ${ref} on BibleRank`,
              description: "Contributions increase the public leaderboard total for this verse.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        verse_id: verse.id,
        canonical_key: verse.canonical_key,
        amount_cents: String(amountCents),
      },
      success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/verse/${verse.book_slug}/${verse.chapter_number}/${verse.verse_number}?canceled=1`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout session creation failed", err);
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again." },
      { status: 500 }
    );
  }
}
