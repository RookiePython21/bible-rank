# BibleRank

A public leaderboard of Bible verses. Users find a canonical World English Bible (WEB) verse
and contribute money to raise its rank. Built to the spec in `BibleRank_PRD.md`.

Stack: Next.js (App Router, TypeScript) · Supabase (Postgres + pgvector) · Stripe Checkout ·
OpenAI embeddings · Vercel.

## What's implemented

- Canonical verse database + Book→Chapter→Verse selector that can only select real references
- Exact-reference parsing ("John 3:16") and semantic search (pgvector + OpenAI embeddings)
- Public leaderboard (Top 100, funded verses only, deterministic tie-break)
- Verse detail pages with SEO metadata, dynamic OG image, and sharing
- Stripe Checkout contribution flow; the webhook is the sole source of truth for totals
- Atomic, idempotent contribution processing (Postgres RPC, safe under concurrent payments)
- Refund handling (subtracts from the total, never deletes the historical record)
- `/admin` (HTTP Basic Auth): contributions, reconciliation drift, failed webhook events, search logs
- Rate limiting on `/api/search` and `/api/checkout`, sitemap, robots.txt

## 1. Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values described below
npm run dev
```

The app will run, but the leaderboard/search/checkout won't work until you complete the steps
below — that's expected.

## 2. Things YOU need to do before this works

### A. Create a Supabase project (database)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine to start).
2. In **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server-only, never expose this**)
3. Open the **SQL Editor** and run the three migration files in `supabase/migrations/` **in
   order**: `0001_init.sql`, then `0002_functions.sql`, then `0003_admin.sql`. (If you prefer the
   Supabase CLI, `supabase link` then `supabase db push` works the same way.)
4. This enables the `pgvector` extension and creates `verses`, `contributions`, `search_events`,
   `webhook_failures`, and all the RPC functions the app calls (leaderboard, rank, checkout
   processing, semantic search, reconciliation).

### B. Import the Bible text

With `.env.local` filled in for Supabase:

```bash
npm run import-bible
```

This pulls the full WEB translation (~31,102 verses) from a free public API
(bolls.life) and upserts it into your `verses` table. Takes a few minutes. Safe to re-run.

### C. Get an embedding API key (for semantic search)

1. Create an API key at [platform.openai.com](https://platform.openai.com/api-keys).
2. Set `EMBEDDING_API_KEY` in `.env.local` (and in Vercel later). Default model is
   `text-embedding-3-small` — cheap and sufficient for this use case.
3. Run:

```bash
npm run generate-embeddings
```

This embeds every verse that doesn't have one yet (only needs to run once; safe to re-run).
Until this finishes, semantic search will just return "no confidence" — exact-reference lookup
and the Book/Chapter/Verse selector work immediately without it.

### D. Set up Stripe (payments)

1. Create/use a [Stripe](https://dashboard.stripe.com) account.
2. **Developers → API keys**: copy the **Secret key** → `STRIPE_SECRET_KEY`, and the
   **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (not currently required by the
   redirect-based Checkout flow, but included for future use).
3. Start in **test mode** first. Use test cards ([listed here](https://docs.stripe.com/testing))
   to verify the full flow before going live.
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-domain>/api/stripe/webhook`
   - Events to send: `checkout.session.completed`, `charge.refunded`,
     `payment_intent.payment_failed`
   - Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`
5. For local testing, use the [Stripe CLI](https://docs.stripe.com/stripe-cli):
   `stripe listen --forward-to localhost:3000/api/stripe/webhook` (it prints a webhook secret to
   use locally).
6. When ready for real payments: switch the dashboard to **Live mode**, repeat steps 2 and 4 for
   live keys, and update your production environment variables. Nothing in the code changes.

### E. Set admin credentials

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your environment. `/admin` is protected by HTTP
Basic Auth using these values — without them, `/admin` returns 503.

### F. Deploy to Vercel + connect bible-rank.com

1. Push this repo to GitHub (or your Git provider of choice) and import it in
   [Vercel](https://vercel.com/new).
2. Add **all** the environment variables from `.env.example` in the Vercel project settings
   (Production **and** Preview environments). Set `NEXT_PUBLIC_SITE_URL=https://bible-rank.com`.
3. Deploy.
4. In Vercel → your project → **Settings → Domains**, add `bible-rank.com` (and `www` if wanted).
   Vercel will show the DNS records to add.
5. At your domain registrar (wherever `bible-rank.com` is registered), add those DNS records
   (typically an `A` record to Vercel's IP, or a `CNAME` for `www`). Propagation can take a few
   minutes to a few hours.
6. Once the domain is live, update the Stripe webhook endpoint URL (step D.4) to the real
   `https://bible-rank.com/api/stripe/webhook` if you used a temporary Vercel URL while testing.

### G. Before taking real payments

- Confirm Stripe is in **Live mode** with live keys set in Vercel's production environment.
- Send a real $1 test contribution end-to-end and confirm it appears on the leaderboard.
- Have the placeholder `Terms` (`/terms`) and `Privacy` (`/privacy`) pages reviewed by counsel —
  they're functional but intentionally generic; PRD §25 also flags that refund policy should be
  finalized before public launch.
- Optional: rate limiting is in-memory per server instance (fine for MVP). If abuse becomes a
  real problem, swap `src/lib/rate-limit.ts` for Upstash Redis (`@upstash/ratelimit`) — the call
  sites don't need to change.

## Summary of required environment variables

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your production URL, e.g. `https://bible-rank.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (server-only secret) |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → your endpoint |
| `EMBEDDING_API_KEY` | OpenAI → API keys |
| `EMBEDDING_MODEL` | `text-embedding-3-small` (default) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Chosen by you, protects `/admin` |

## Scripts

```bash
npm run dev                 # local dev server
npm run build                # production build
npm run import-bible         # one-time: import WEB text into Supabase
npm run generate-embeddings  # one-time: embed verses for semantic search
npm run reconcile            # CLI check: verses.total vs SUM(contributions)
```

## Known MVP simplifications (documented, not bugs)

- Refunds are treated as all-or-nothing per contribution (no partial-refund tracking).
- Rate limiting is per-server-instance in-memory, not a distributed limiter.
- `/admin` uses HTTP Basic Auth rather than a full auth system — adequate for a single-operator
  MVP, per PRD's "no accounts" scope.
