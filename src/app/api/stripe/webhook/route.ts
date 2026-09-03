import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeClient } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createInterpretation } from "@/lib/interpretations";

// Stripe webhooks need the raw request body for signature verification.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 500 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.duel_id) {
          await handleDuelBackingCompleted(event);
        } else {
          await handleCheckoutCompleted(event);
        }
        break;
      }
      case "charge.refunded": {
        await handleRefund(event);
        break;
      }
      case "payment_intent.payment_failed": {
        // Failed payments never affect totals — nothing to do beyond logging.
        console.info("payment_intent.payment_failed", event.id);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`error handling stripe event ${event.type}`, err);
    await logWebhookFailure(event, err);
    // Return 500 so Stripe retries the delivery. process_completed_contribution
    // is idempotent on stripe_event_id, so retries are safe.
    return NextResponse.json({ error: "Internal error processing event." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function logWebhookFailure(event: Stripe.Event, err: unknown) {
  try {
    await supabaseAdmin()
      .from("webhook_failures")
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        error_message: err instanceof Error ? err.message : String(err),
      });
  } catch (loggingErr) {
    console.error("failed to log webhook failure", loggingErr);
  }
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    return;
  }

  const verseId = session.metadata?.verse_id;
  const metadataAmountCents = session.metadata?.amount_cents;

  if (!verseId || !metadataAmountCents) {
    console.error("checkout.session.completed missing metadata", session.id);
    return;
  }

  // Never trust the browser or even Checkout metadata alone for money —
  // reconcile against what Stripe actually collected.
  const amountFromStripe = session.amount_total;
  const amountFromMetadata = parseInt(metadataAmountCents, 10);
  if (amountFromStripe == null || amountFromStripe !== amountFromMetadata) {
    console.error("checkout.session.completed amount mismatch", session.id, {
      amountFromStripe,
      amountFromMetadata,
    });
    return;
  }

  if ((session.currency || "usd").toLowerCase() !== "usd") {
    console.error("checkout.session.completed unexpected currency", session.id, session.currency);
    return;
  }

  const admin = supabaseAdmin();

  // Confirm the verse still exists (it always should, given a foreign key,
  // but this keeps the webhook defensive against bad metadata).
  const { data: verse, error: verseError } = await admin
    .from("verses")
    .select("id")
    .eq("id", verseId)
    .maybeSingle();

  if (verseError || !verse) {
    console.error("checkout.session.completed unknown verse_id", session.id, verseId);
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  const { error } = await admin.rpc("process_completed_contribution", {
    p_verse_id: verseId,
    p_amount_cents: amountFromStripe,
    p_currency: (session.currency || "usd").toLowerCase(),
    p_stripe_checkout_session_id: session.id,
    p_stripe_payment_intent_id: paymentIntentId ?? null,
    p_stripe_event_id: event.id,
    p_completed_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  // Best-effort: an interpretation submitted alongside the payment is a nice-to-have,
  // not the financial record — never let a failure here trigger a webhook retry.
  const interpretationBody = session.metadata?.interpretation_body?.trim();
  if (interpretationBody) {
    try {
      await createInterpretation({
        verseId,
        authorName: session.metadata?.interpretation_author_name?.trim() || null,
        body: interpretationBody,
      });
    } catch (err) {
      console.error("failed to create interpretation from checkout metadata", session.id, err);
    }
  }
}

async function handleDuelBackingCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    return;
  }

  const duelId = session.metadata?.duel_id;
  const side = session.metadata?.side;
  const metadataAmountCents = session.metadata?.amount_cents;

  if (!duelId || (side !== "a" && side !== "b") || !metadataAmountCents) {
    console.error("checkout.session.completed missing duel metadata", session.id);
    return;
  }

  // Never trust the browser or even Checkout metadata alone for money —
  // reconcile against what Stripe actually collected.
  const amountFromStripe = session.amount_total;
  const amountFromMetadata = parseInt(metadataAmountCents, 10);
  if (amountFromStripe == null || amountFromStripe !== amountFromMetadata) {
    console.error("checkout.session.completed duel amount mismatch", session.id, {
      amountFromStripe,
      amountFromMetadata,
    });
    return;
  }

  if ((session.currency || "usd").toLowerCase() !== "usd") {
    console.error("checkout.session.completed unexpected currency", session.id, session.currency);
    return;
  }

  const admin = supabaseAdmin();

  const { data: duel, error: duelError } = await admin
    .from("duels")
    .select("id")
    .eq("id", duelId)
    .maybeSingle();

  if (duelError || !duel) {
    console.error("checkout.session.completed unknown duel_id", session.id, duelId);
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  const { error } = await admin.rpc("process_duel_backing", {
    p_duel_id: duelId,
    p_side: side,
    p_amount_cents: amountFromStripe,
    p_why_note: session.metadata?.why_note || null,
    p_author_name: session.metadata?.author_name || null,
    p_stripe_checkout_session_id: session.id,
    p_stripe_payment_intent_id: paymentIntentId ?? null,
    p_stripe_event_id: event.id,
    p_completed_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

async function handleRefund(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const admin = supabaseAdmin();

  const { data: refunded, error } = await admin.rpc("process_refund", {
    p_stripe_payment_intent_id: paymentIntentId,
  });
  if (error) throw new Error(error.message);

  // process_refund only touches verse contributions. If this payment intent
  // wasn't one of those, it may be a duel backing instead.
  const matchedContribution = (refunded ?? [])[0]?.contribution_id;
  if (!matchedContribution) {
    const { error: duelRefundError } = await admin.rpc("process_duel_backing_refund", {
      p_stripe_payment_intent_id: paymentIntentId,
    });
    if (duelRefundError) throw new Error(duelRefundError.message);
  }
}
