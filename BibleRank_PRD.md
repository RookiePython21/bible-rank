# BibleRank — Product Requirements Document

**Version:** 1.0  
**Product:** BibleRank  
**Status:** MVP Build Specification  
**Primary goal:** Ship a simple public Bible-verse leaderboard where people financially support the verses they believe should rank highest.  
**Canonical Bible text:** World English Bible (WEB)

---

## 1. Product Summary

BibleRank is a public leaderboard of Bible verses.

Every canonical Bible verse has a single global ranking entry. Users contribute money to a verse to increase its total. The more money contributed to a verse, the higher it ranks.

The core idea is:

> **What is the internet's favorite Bible verse?**

Users do not create verse text. BibleRank uses a canonical World English Bible dataset. A user can either:

1. Select a Bible reference by **Book → Chapter → Verse**, or
2. Search semantically using a phrase, idea, topic, or partial memory of a verse.

BibleRank then returns canonical verses from the database. The user chooses a real verse, sees its current rank and total, and may contribute to it.

**Core rule:**

> Users can search for verses. Users can rank verses. Users can never create verses.

---

## 2. Product Principles

1. **The leaderboard is the product.**
   - Keep the experience simple.
   - Avoid unnecessary social-network features in the MVP.

2. **Canonical verses only.**
   - Users cannot type arbitrary verse text into the database.
   - Every ranked verse must already exist in the WEB dataset.

3. **Rank is determined only by money contributed.**
   - No likes.
   - No votes.
   - No engagement weighting.
   - No editorial ranking.

4. **One verse, one listing.**
   - John 3:16 can only exist once on the leaderboard.
   - Every contribution to John 3:16 increases the same canonical record.

5. **Search is discovery, not generation.**
   - Semantic search retrieves canonical Bible verses.
   - An LLM does not invent or rewrite verses.

6. **No account required for MVP.**
   - A visitor should be able to discover a verse and contribute with minimal friction.

---

# 3. MVP Goals

The MVP must allow a visitor to:

- View the public Bible leaderboard.
- See each verse's:
  - current rank
  - reference
  - WEB text
  - total contributed
- Search for a verse by:
  - exact Bible reference
  - Book → Chapter → Verse selection
  - semantic/topic search
- Confirm the canonical verse before paying.
- Add money to an existing verse.
- Calculate how much is required to take the #1 position.
- Pay using Stripe Checkout.
- Update the leaderboard only after a successful payment.
- Display recent leaderboard movement.
- Prevent nonexistent or fabricated Bible verses from appearing.
- Share a ranked verse via a stable URL.

---

# 4. Non-Goals for MVP

Do **not** build the following in V1 unless they are trivial:

- User accounts
- Profiles
- Comments
- Messaging
- Likes
- Follows
- Prayer requests
- Bible study tools
- AI-generated explanations
- Multiple Bible translations
- Native mobile apps
- Recurring subscriptions
- Charity/revenue-sharing functionality
- Referral systems
- Affiliate links
- Complex moderation systems
- User-created verse text
- User-created categories
- Group chats
- Gamification beyond rankings and movement

The MVP should remain focused on the leaderboard.

---

# 5. Core User Experience

## 5.1 Homepage

The homepage should immediately explain the product.

Suggested hero:

> # BibleRank  
> **The internet's Bible leaderboard.**  
> Put your favorite Bible verse on top.

Primary actions:

- **Find a Verse**
- **View Leaderboard**

The page should prominently display the current #1 verse.

Example:

> **#1 — John 3:16**  
> "$2,419 contributed"  
> [WEB verse text]  
> **Support This Verse**

Below the hero, show the leaderboard.

---

## 5.2 Leaderboard

Default leaderboard sort:

```text
total_contributed DESC
tie_break_timestamp ASC
```

Each row/card should show:

- Rank
- Bible reference
- Verse text
- Total contributed
- Optional recent movement indicator
- CTA: **Support**
- CTA or link: **View Verse**

Example:

```text
#1
John 3:16
"For God so loved the world..."
$2,419
[Support]
```

### Leaderboard pagination

MVP options:

- Top 100 with pagination, or
- Infinite scroll

Recommended V1:

- Show Top 100.
- Load 25 at a time.
- Provide a search box to find any other verse.

---

# 6. Ranking Rules

## 6.1 Ranking Unit

Every canonical verse has one cumulative monetary total:

```text
total_contributed
```

Users contribute to a verse rather than create a new listing.

Example:

```text
John 3:16       $2,419
Philippians 4:13 $2,288
Romans 8:28      $1,931
```

---

## 6.2 Minimum Contribution

- Minimum contribution: **$1 USD**
- Contributions must be in **whole US dollars**
- No cents

Store money internally in cents.

Example:

```text
$1 = 100 cents
$25 = 2500 cents
```

---

## 6.3 Taking #1

To immediately take the #1 position, the selected verse must end at least:

```text
$5 above the current #1 verse
```

Formula:

```text
required_to_take_first =
max(
  1,
  current_top_total + 5 - selected_verse_total
)
```

Example:

```text
Current #1:
John 3:16 = $842

Selected:
Romans 8:28 = $700

Minimum contribution to take #1:
842 + 5 - 700 = $147
```

Display:

> **Take #1 for $147**

This is a convenience CTA. The user may still enter another valid whole-dollar contribution.

---

## 6.4 Equal Totals

If two verses have equal totals:

- The verse that reached that total first remains above the newer tie.

Maintain:

```text
rank_tiebreak_at
```

Whenever a verse's total changes after payment, set:

```text
rank_tiebreak_at = payment completion timestamp
```

Sort:

```sql
ORDER BY
  total_contributed_cents DESC,
  rank_tiebreak_at ASC
```

---

## 6.5 Payments Determine Rank

A verse's total and rank must only update after Stripe confirms a completed payment.

Creating a Checkout Session does **not** reserve rank.

The webhook is authoritative.

---

## 6.6 No Rank Reservation

A user may begin checkout when a verse needs $50 to take #1.

If another payment changes the leaderboard before that checkout completes:

- The original contribution remains valid.
- The payment adds the amount purchased.
- The application does not guarantee the resulting rank.

Before redirecting to Stripe, display:

> Rankings are live. Your contribution is applied when payment completes.

---

# 7. Canonical Bible Dataset

## 7.1 Translation

Use:

**World English Bible (WEB)**

The MVP should use one canonical translation only.

Rankings belong to the Bible reference, not to translation-specific wording.

Canonical identifier examples:

```text
GEN.1.1
PSA.23.4
JOHN.3.16
ROM.8.28
PHP.4.13
```

---

## 7.2 Required Verse Fields

Each verse should include:

```text
id
canonical_key
book_name
book_slug
book_number
chapter_number
verse_number
verse_text
translation
embedding
created_at
```

Example:

```json
{
  "canonical_key": "JOHN.3.16",
  "book_name": "John",
  "book_slug": "john",
  "book_number": 43,
  "chapter_number": 3,
  "verse_number": 16,
  "verse_text": "For God so loved the world...",
  "translation": "WEB"
}
```

---

## 7.3 Verse Integrity

The UI must never accept user-created Bible verse text.

Allowed flow:

```text
User input
   ↓
Canonical database lookup
   ↓
Existing verse found
   ↓
User confirms verse
   ↓
Contribution
```

Not allowed:

```text
User types verse text
   ↓
Save typed text as a verse
```

A contribution must always reference a valid existing `verse_id`.

Use a foreign key constraint.

---

# 8. Finding a Verse

There should be two primary discovery methods.

---

## 8.1 Exact Reference Selector

UI:

```text
[ Book ▼ ] [ Chapter ▼ ] [ Verse ▼ ]
```

The controls must be dynamically constrained.

Example:

1. User selects `John`.
2. Chapter selector only shows valid chapters in John.
3. User selects `3`.
4. Verse selector only shows valid verses in John 3.

This makes nonexistent references impossible to select.

After selection, show a confirmation card:

> **John 3:16**  
> [WEB verse text]  
> Is this the verse you want to rank?  
> **Rank This Verse**

---

## 8.2 Reference Text Parsing

The main search box should also recognize clear references such as:

```text
John 3:16
Romans 8:28
Psalm 23:4
1 Corinthians 13:4
```

If the query parses into a valid canonical reference:

1. Attempt exact database lookup first.
2. If found, return the canonical verse as the primary result.
3. Do not use semantic search when an exact reference is confidently resolved.

If the reference does not exist:

> We couldn't find that Bible reference.

Then offer semantic search or Book → Chapter → Verse selection.

---

# 9. Semantic / Vector Search

## 9.1 Purpose

Semantic search helps users find a verse when they remember:

- a theme
- a concept
- approximate wording
- a topic
- part of the idea
- an incomplete phrase

Examples:

```text
"verse about anxiety"
"God has a plan"
"everything works together for good"
"iron sharpens iron"
"verse about courage"
"do not worry about tomorrow"
```

---

## 9.2 Search Architecture

Use vector embeddings over the canonical WEB verse corpus.

Recommended stack:

- Supabase Postgres
- `pgvector`
- An embedding model/provider
- One embedding per canonical verse

Flow:

```text
User search query
      ↓
Normalize query
      ↓
Create query embedding
      ↓
Vector similarity search
      ↓
Return top 5 canonical verses
```

An LLM is not required.

---

## 9.3 Search Results

Return the top **5** canonical results.

Each result should display:

- Reference
- Verse text
- Current rank
- Current total contributed
- Select button

Example:

```text
You searched:
"verse about strength"

#3  Philippians 4:13        $1,842
#21 Isaiah 41:10              $410
#34 Psalm 46:1                $292
#61 Joshua 1:9                $133
```

This makes search part of the competitive experience.

---

## 9.4 Search Ranking

Recommended search logic:

1. Exact canonical-reference match
2. Strong lexical/text match
3. Vector similarity
4. Return up to 5 results

Optional hybrid score:

```text
semantic_similarity
+
keyword_similarity
```

For V1, vector similarity alone is acceptable after exact-reference detection.

---

## 9.5 Search Safety

Search results must always come from the canonical `verses` table.

Never display model-generated verse text as if it were scripture.

If no result meets the configured similarity threshold:

> We couldn't confidently match that search. Try another phrase or select the verse directly.

---

# 10. Verse Detail Page

Every verse should have a permanent public URL.

Suggested route:

```text
/verse/john/3/16
```

Example:

```text
https://<domain>/verse/john/3/16
```

Display:

- Current rank
- Reference
- WEB text
- Total contributed
- Amount required to take #1
- Contribution input
- Quick amount buttons
- Recent contribution activity for this verse
- Share controls

Suggested quick buttons:

```text
+$1
+$5
+$10
+$25
+$50
Take #1
```

Also allow custom whole-dollar amount.

---

# 11. Contribution Flow

## 11.1 Standard Flow

```text
Choose canonical verse
      ↓
See current rank / total
      ↓
Choose contribution amount
      ↓
Create Stripe Checkout Session
      ↓
Complete Stripe payment
      ↓
Stripe webhook received
      ↓
Validate payment
      ↓
Create contribution record
      ↓
Atomically increment verse total
      ↓
Update tiebreak timestamp
      ↓
Leaderboard changes
      ↓
Show success page
```

---

## 11.2 Checkout Page Information

Before Stripe:

> **Support John 3:16**

Show:

```text
Current rank: #4
Current total: $500
Your contribution: $25
Projected total: $525
```

If applicable:

> $147 would currently take #1.

Disclaimer:

> Rankings are live and may change before payment completes.

CTA:

> **Continue to Payment**

---

## 11.3 Successful Payment

Success page:

> **Your contribution was added to John 3:16.**

Display:

- Contribution amount
- New verse total
- Current rank
- Movement if known

Example:

> John 3:16 moved from **#7 → #4**

CTA:

- **View Leaderboard**
- **Share This Verse**

Do not trust client-side success parameters to update totals.

Only the Stripe webhook may create the final contribution and increment totals.

---

# 12. Stripe Requirements

Use Stripe Checkout.

Recommended MVP payment methods:

- Card
- Apple Pay / Google Pay where Stripe Checkout makes them available

Store Stripe identifiers:

```text
stripe_checkout_session_id
stripe_payment_intent_id
stripe_event_id
```

Webhook requirements:

- Verify Stripe webhook signature.
- Ensure idempotency.
- Never process the same successful Stripe event twice.
- Validate:
  - payment status
  - currency
  - amount
  - verse ID metadata
- Use database transactions or an atomic database function when updating totals.

---

# 13. Data Model

Recommended Supabase/Postgres schema.

---

## 13.1 `verses`

```sql
CREATE TABLE verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_key TEXT NOT NULL UNIQUE,
  book_name TEXT NOT NULL,
  book_slug TEXT NOT NULL,
  book_number INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  translation TEXT NOT NULL DEFAULT 'WEB',

  total_contributed_cents BIGINT NOT NULL DEFAULT 0,
  rank_tiebreak_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  embedding VECTOR,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (book_number, chapter_number, verse_number)
);
```

Create indexes for:

```text
canonical_key
book_slug + chapter_number + verse_number
total_contributed_cents
embedding vector search
```

---

## 13.2 `contributions`

```sql
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  verse_id UUID NOT NULL REFERENCES verses(id),

  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 100),
  currency TEXT NOT NULL DEFAULT 'usd',

  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_event_id TEXT UNIQUE,

  status TEXT NOT NULL DEFAULT 'completed',

  rank_before INTEGER,
  rank_after INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 13.3 Optional `search_events`

Useful for future product analytics.

```sql
CREATE TABLE search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  selected_verse_id UUID REFERENCES verses(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Do not allow this table to delay launch.

---

# 14. Atomic Contribution Processing

Payment processing must avoid race conditions.

Use a Postgres transaction or Supabase RPC.

Pseudo-operation:

```text
BEGIN

1. Confirm stripe_event_id has not already been processed.

2. Read verse current total and current rank.

3. Insert contribution.

4. Increment:
   verses.total_contributed_cents += contribution.amount_cents

5. Set:
   verses.rank_tiebreak_at = payment_completed_at

6. Calculate updated rank if desired.

COMMIT
```

Never:

1. Read total in application code.
2. Add amount.
3. Write replacement total.

That pattern can lose money when simultaneous payments occur.

Use an atomic SQL increment.

---

# 15. Recent Activity

The homepage should contain a small live/recent activity section.

Examples:

> Someone just added **$10 to Psalm 23:4**

> Romans 8:28 moved from **#17 → #11**

> **$23 separates Romans 8:28 from Philippians 4:13**

Recommended MVP:

Show the most recent 10 completed contributions.

Do not expose payer identity unless identity functionality is intentionally added later.

---

# 16. Shareability

Each verse detail page should have social sharing metadata.

Example share text:

> John 3:16 is currently #4 on BibleRank.

Potential future share card:

> I just helped Romans 8:28 reach #4 on the Bible leaderboard.

For MVP:

- Copy link
- X share
- Facebook share where practical
- Open Graph image
- Reference
- Current rank

---

# 17. Navigation

Recommended desktop navigation:

```text
BibleRank
Leaderboard
Find a Verse
How It Works
About
```

Mobile:

- Logo
- Search icon / Find Verse
- Menu

Primary CTA:

> **Find a Verse**

---

# 18. Pages

Minimum required routes:

```text
/
 /leaderboard
 /search
 /verse/[book]/[chapter]/[verse]
 /checkout/[verse]
 /payment/success
 /how-it-works
 /about
 /terms
 /privacy
```

Optional:

```text
/recent
```

---

# 19. Homepage Layout

Recommended order:

## Section 1 — Hero

```text
BibleRank

The internet's Bible leaderboard.

Put your favorite Bible verse on top.

[Find a Verse] [View Leaderboard]
```

Show current #1 verse prominently.

---

## Section 2 — Leaderboard

Top verses with:

- rank
- reference
- text
- total
- support CTA

---

## Section 3 — Find Your Verse

Search input:

> Search by verse, phrase, or idea...

Examples beneath:

```text
"verse about courage"
"John 3:16"
"God has a plan"
```

Also show:

```text
Or choose a verse:
[Book] [Chapter] [Verse]
```

---

## Section 4 — How It Works

Three steps:

```text
1. Find a real Bible verse.
2. Contribute to it.
3. Watch it move up the leaderboard.
```

---

## Section 5 — Recent Activity

Show recent contributions/movement.

---

## Section 6 — Footer

Include:

- About
- How It Works
- Terms
- Privacy
- Scripture attribution

Example:

> Scripture text displayed using the World English Bible (WEB).

---

# 20. Visual Direction

BibleRank should feel:

- modern
- simple
- public
- competitive
- credible
- fast
- respectful of Scripture

Avoid making the site look like:

- a church website
- a donation platform
- a crypto project
- a casino
- a generic SaaS dashboard
- a Bible-reading app

The leaderboard should visually dominate the experience.

Recommended characteristics:

- Strong ranking numbers
- Large verse references
- Highly readable scripture text
- Clear dollar totals
- Visible movement
- Simple contribution CTAs
- Responsive mobile layout

The visual hierarchy should make these three things instantly obvious:

```text
RANK
VERSE
TOTAL
```

---

# 21. Copy Guidelines

Preferred language:

- **Support this verse**
- **Put your favorite verse on top**
- **Take #1**
- **Find a verse**
- **The internet's Bible leaderboard**
- **Current rank**
- **Total contributed**

Avoid unnecessarily aggressive gambling terminology.

Do not use:

- Bet
- Wager
- Odds
- Jackpot
- Gamble

The product is a competitive leaderboard funded by contributions.

---

# 22. SEO

Verse pages create strong indexable URLs.

Example:

```text
/verse/john/3/16
```

Title:

```text
John 3:16 — BibleRank
```

Meta description:

```text
See where John 3:16 ranks on BibleRank and support it on the public Bible verse leaderboard.
```

Each verse page should server-render:

- reference
- verse text
- rank
- total

Generate a sitemap for canonical verse pages.

Do not allow semantic-search query URLs to create unlimited indexable pages.

---

# 23. Performance

Targets:

- Mobile-first
- LCP under 2.5 seconds where practical
- Leaderboard loads quickly
- Search result target under 1 second after embedding response when possible
- Avoid loading all ~31,000 verses into the browser

Exact selector endpoints should query only required book/chapter/verse metadata.

---

# 24. Security

Required:

- Stripe webhook signature verification
- Server-side Checkout Session creation
- Never expose Stripe secrets
- Never trust client-supplied price totals
- Server validates integer dollar amount
- Server validates canonical `verse_id`
- Foreign key constraint on contributions
- Rate-limit search endpoint
- Rate-limit Checkout Session creation
- Sanitize search input
- Add basic bot protection if abuse appears
- Use environment variables for secrets
- Supabase service-role key must remain server-side

---

# 25. Fraud / Payment Handling

For MVP:

- Stripe handles payment collection.
- Only completed payments affect totals.
- Failed or canceled payments have no effect.
- Refund handling should be defined before public launch.

Recommended refund behavior:

If a payment is refunded:

1. Create a refund/adjustment record.
2. Atomically subtract the refunded contribution from the verse total.
3. Recalculate ranking.
4. Never silently delete historical payment records.

This preserves leaderboard financial integrity.

---

# 26. Admin Requirements

Build a minimal protected admin view.

Admin should be able to:

- View recent contributions
- Search Stripe session/payment IDs
- View failed webhook events
- View verse totals
- Trigger or inspect a leaderboard reconciliation
- Disable a contribution from public activity display if necessary
- View semantic-search logs if enabled

Admin must **not** manually edit canonical scripture text through the normal public interface.

If Bible dataset corrections are required, they should occur through a controlled database process.

---

# 27. Leaderboard Reconciliation

The app should provide a way to verify:

```text
verses.total_contributed_cents
```

against:

```text
SUM(completed contributions for that verse)
```

This can be an admin script or endpoint.

Pseudo-query:

```sql
SELECT
  verse_id,
  SUM(amount_cents)
FROM contributions
WHERE status = 'completed'
GROUP BY verse_id;
```

This protects against drift.

---

# 28. Analytics

Minimum analytics events:

```text
homepage_view
leaderboard_view
verse_search
verse_selected
verse_detail_view
contribution_started
stripe_checkout_created
contribution_completed
share_clicked
```

Useful properties:

```text
verse_id
canonical_key
rank
amount
search_query
search_result_position
```

Do not block launch on sophisticated analytics.

---

# 29. Recommended Technology Stack

## Frontend / Full Stack

**Next.js**

Recommended:

- App Router
- TypeScript
- Server Components where useful
- Route handlers/server actions for protected operations

---

## Database

**Supabase Postgres**

Use:

- PostgreSQL
- pgvector
- database constraints
- atomic SQL/RPC functions

---

## Payments

**Stripe Checkout**

Use a webhook as the source of truth.

---

## Hosting

**Vercel**

---

## Semantic Search

Use an embedding provider to:

1. Generate embeddings for every WEB verse during ingestion.
2. Generate one embedding per search query.
3. Query pgvector for nearest verses.

The embedding provider should be abstracted behind a small server utility so it can be changed later.

---

# 30. Bible Import Pipeline

Do not parse the production dataset from a PDF if a structured WEB dataset is available.

Preferred source formats:

- JSON
- CSV
- USFM
- other structured verse-level data

Import process:

```text
Structured WEB dataset
      ↓
Normalize book names
      ↓
Generate canonical keys
      ↓
Insert canonical verses
      ↓
Generate embeddings
      ↓
Store embeddings
      ↓
Verify verse counts
```

After import, verify:

- 66 expected Protestant books for the selected WEB edition
- every book has valid chapters
- every chapter has valid verse sequence
- no duplicate canonical keys
- no null verse text
- exact-reference lookup succeeds

---

# 31. Embedding Job

Embedding generation should run as an offline/admin script.

Pseudo-flow:

```text
for each verse without embedding:
    input =
      "{book_name} {chapter}:{verse_number}. {verse_text}"

    embedding = embed(input)

    save embedding
```

Batch requests where supported.

Do not regenerate all embeddings on every deployment.

---

# 32. Search API

Suggested endpoint:

```text
POST /api/search
```

Request:

```json
{
  "query": "verse about courage"
}
```

Response:

```json
{
  "results": [
    {
      "id": "...",
      "canonicalKey": "JOS.1.9",
      "reference": "Joshua 1:9",
      "text": "...",
      "rank": 61,
      "totalContributedCents": 13300,
      "score": 0.87
    }
  ]
}
```

Never return fabricated verse records.

---

# 33. Exact Reference API

Suggested:

```text
GET /api/verse?book=john&chapter=3&verse=16
```

Response:

```json
{
  "id": "...",
  "canonicalKey": "JOHN.3.16",
  "reference": "John 3:16",
  "text": "...",
  "rank": 4,
  "totalContributedCents": 50000
}
```

Invalid reference:

```text
404
```

---

# 34. Checkout API

Suggested:

```text
POST /api/checkout
```

Request:

```json
{
  "verseId": "...",
  "amountDollars": 25
}
```

Server must:

1. Validate `verseId`.
2. Confirm verse exists.
3. Validate whole-dollar amount.
4. Validate minimum.
5. Convert to cents.
6. Create Stripe Checkout Session.
7. Include canonical `verse_id` in Stripe metadata.
8. Return Stripe Checkout URL.

Never accept:

```text
verse text
total after contribution
rank after contribution
```

as trusted values from the browser.

---

# 35. Stripe Metadata

Recommended Checkout Session metadata:

```text
verse_id
canonical_key
amount_cents
```

The webhook should still independently validate database values.

---

# 36. Stripe Webhook

Suggested route:

```text
POST /api/stripe/webhook
```

Handle at minimum:

```text
checkout.session.completed
```

Potential later events:

```text
charge.refunded
payment_intent.payment_failed
```

On successful Checkout completion:

```text
verify signature
      ↓
verify event has not been processed
      ↓
read verse_id from metadata
      ↓
verify verse exists
      ↓
verify amount / currency
      ↓
atomically create contribution + increment total
      ↓
mark event processed
```

---

# 37. Suggested Database Function

Create an RPC/database function similar to:

```text
process_completed_contribution(
    verse_id,
    amount_cents,
    stripe_session_id,
    stripe_payment_intent_id,
    stripe_event_id,
    completed_at
)
```

The function must:

- be transactional
- be idempotent
- insert the contribution
- increment the verse total
- update `rank_tiebreak_at`

---

# 38. Rank Calculation

For MVP, current rank may be calculated dynamically.

Conceptual query:

```sql
SELECT COUNT(*) + 1
FROM verses v2
WHERE
  v2.total_contributed_cents > selected.total_contributed_cents
  OR (
    v2.total_contributed_cents = selected.total_contributed_cents
    AND v2.rank_tiebreak_at < selected.rank_tiebreak_at
  );
```

For the Top 100 leaderboard, use SQL ranking/window functions.

Do not store a mutable `rank` column unless performance later requires it.

The total is canonical.

Rank is derived.

---

# 39. Empty Leaderboard / Launch State

At launch, most or all verses will have $0.

Do not display 31,000 zero-dollar verses as a meaningful ranked leaderboard.

Recommended behavior:

- Leaderboard primarily displays verses with `total_contributed_cents > 0`.
- If fewer than the desired number exist, show only funded verses.
- Any canonical verse can still be found through search or the direct selector.

A verse enters the visible leaderboard after its first completed contribution.

---

# 40. Search Result Rank for Unfunded Verses

For a verse with $0:

Display:

> **Unranked**

instead of assigning a meaningless position among thousands of tied zero-dollar verses.

After its first contribution:

- it becomes ranked
- its position is determined by total and tie-break rules

---

# 41. Suggested UX for an Unranked Verse

Example:

> **Joshua 1:9**  
> Currently unranked  
> $0 contributed  
> Be the first to put this verse on the board.  
> **Support Joshua 1:9**

---

# 42. Live Movement

After a contribution is processed, calculate:

```text
rank_before
rank_after
```

Store those values on the contribution where practical.

This supports activity messages:

> Romans 8:28 moved from #17 → #11.

If exact historical rank is difficult under concurrency, this feature may be approximate or deferred without blocking the core payment.

---

# 43. Competitive Callouts

Useful dynamic UI:

```text
$23 from #4
$50 from the Top 10
$147 to take #1
```

For MVP, prioritize:

> **Take #1 for $X**

Later add:

- Take Top 10
- Pass the verse above
- Gap to next rank

---

# 44. Legal / Product Copy

BibleRank must clearly describe what payment does.

Suggested language:

> Contributions increase the public leaderboard total for the selected Bible verse. Payments do not purchase ownership of a verse or Scripture text.

Also state:

> Rankings are determined solely by completed contributions.

Do not imply:

- theological authority
- doctrinal correctness
- church endorsement
- divine importance
- that higher-ranked verses are objectively more important Scripture

The leaderboard reflects user financial support only.

---

# 45. World English Bible Attribution

Display a simple attribution/footer notice appropriate to the WEB source used.

At minimum:

> Scripture text displayed using the World English Bible (WEB).

Keep the canonical source/edition documented in the repository.

---

# 46. Accessibility

Minimum:

- Semantic HTML
- Keyboard-accessible selectors
- Proper labels
- Strong contrast
- Visible focus states
- Accessible Stripe launch button
- Verse text readable without relying on color
- Rank changes not communicated only through animation/color

---

# 47. Mobile Requirements

The product must work extremely well on phones.

On mobile:

- Rank should be large and obvious.
- Reference should remain visible.
- Verse text may truncate on leaderboard cards.
- Tapping opens the full verse page.
- Dollar total and Support button should not be hidden.
- Search input should be prominent.
- Book/chapter/verse selectors should be touch-friendly.

---

# 48. Error States

Required messages:

### Invalid exact reference

> We couldn't find that Bible reference.

### Search no-confidence result

> We couldn't confidently match that search. Try another phrase or select the verse directly.

### Invalid contribution

> Enter a whole-dollar amount of at least $1.

### Checkout creation failure

> We couldn't start checkout. Please try again.

### Payment canceled

> Payment was canceled. No contribution was added.

### Payment pending webhook

> Your payment was received. We're confirming your contribution.

Do not display a new rank until the webhook has processed the payment.

---

# 49. MVP Acceptance Criteria

The MVP is complete when all of the following are true.

## Canonical Scripture

- [ ] WEB dataset imported.
- [ ] Every public verse points to a canonical database record.
- [ ] Users cannot create verse text.
- [ ] Invalid book/chapter/verse combinations cannot be selected.
- [ ] Exact-reference lookup works.

## Search

- [ ] User can search a concept or approximate verse.
- [ ] Search returns up to 5 canonical verses.
- [ ] Search results include reference and WEB text.
- [ ] Search results show current rank or Unranked.
- [ ] Search never invents a verse.

## Leaderboard

- [ ] Funded verses are ordered by total contribution.
- [ ] Tie handling is deterministic.
- [ ] Unfunded verses are not given arbitrary visible rankings.
- [ ] Current #1 is displayed.
- [ ] Verse detail pages show rank and total.

## Contributions

- [ ] User can contribute at least $1.
- [ ] Only whole-dollar contributions are allowed.
- [ ] User can see the amount required to take #1.
- [ ] Stripe Checkout works.
- [ ] A Checkout Session alone does not affect rank.
- [ ] Successful Stripe webhook updates the verse atomically.
- [ ] Duplicate webhooks do not duplicate contributions.
- [ ] Canceled/failed payments do not affect rankings.

## Public UX

- [ ] Homepage clearly explains BibleRank.
- [ ] User can find a verse within a few clicks.
- [ ] Every verse has a stable shareable URL.
- [ ] Recent activity is visible.
- [ ] Site is usable on mobile.

## Security

- [ ] Stripe secret remains server-side.
- [ ] Supabase service key remains server-side.
- [ ] Webhook signatures are verified.
- [ ] Verse IDs and amounts are server-validated.
- [ ] Database foreign keys prevent invalid contribution records.

---

# 50. Suggested Build Order

For an AI coding agent, build in this order.

## Phase 1 — Project Setup

1. Create Next.js + TypeScript app.
2. Configure Supabase.
3. Configure environment variables.
4. Configure Stripe.
5. Create base layout/navigation.

## Phase 2 — Bible Data

1. Create `verses` schema.
2. Import WEB dataset.
3. Verify canonical references.
4. Build exact-reference queries.
5. Build Book → Chapter → Verse selector.

## Phase 3 — Leaderboard

1. Add contribution totals to verse records.
2. Build leaderboard SQL query.
3. Build homepage leaderboard.
4. Build verse detail pages.
5. Implement unranked state.

## Phase 4 — Payments

1. Create `contributions` table.
2. Create Checkout endpoint.
3. Implement Stripe Checkout.
4. Implement verified webhook.
5. Implement atomic contribution RPC.
6. Test duplicate webhooks.
7. Build success/cancel states.

## Phase 5 — Semantic Search

1. Enable pgvector.
2. Generate verse embeddings.
3. Create vector-search SQL/RPC.
4. Build `/api/search`.
5. Add exact-reference detection.
6. Build search results UI.

## Phase 6 — Competitive UX

1. Add Take #1 calculation.
2. Add recent activity.
3. Add rank movement where practical.
4. Add social metadata/share links.

## Phase 7 — Production Readiness

1. Terms.
2. Privacy.
3. WEB attribution.
4. Rate limiting.
5. Analytics.
6. Admin contribution view.
7. Payment reconciliation.
8. Mobile QA.
9. Stripe live-mode verification.
10. Production deployment.

---

# 51. Environment Variables

Suggested:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

EMBEDDING_API_KEY=
EMBEDDING_MODEL=
```

Do not expose server-only secrets using `NEXT_PUBLIC_`.

---

# 52. AI Builder Instructions

When implementing this PRD:

1. **Do not invent missing Bible verses.**
2. **Do not allow user-created Scripture records.**
3. Treat the imported WEB dataset as the canonical source.
4. Contributions must reference an existing `verse_id`.
5. Stripe webhooks are the payment source of truth.
6. Ranking is based only on completed contribution totals.
7. Use atomic database operations for money totals.
8. Search retrieves canonical verses; it does not generate Scripture.
9. Keep V1 intentionally small.
10. Prioritize a polished leaderboard and payment flow over peripheral features.

---

# 53. Product Definition in One Sentence

> **BibleRank is a public leaderboard where people financially support real, canonical Bible verses and compete to put their favorite verse on top.**

---

# 54. Core Product Loop

```text
DISCOVER A VERSE
      ↓
SEE ITS RANK
      ↓
THINK "THIS SHOULD BE HIGHER"
      ↓
CONTRIBUTE
      ↓
VERSE MOVES
      ↓
SHARE / RETURN / SUPPORT ANOTHER
```

That loop should guide every MVP product decision.

---

# 55. Final MVP Test Scenario

A new visitor should be able to complete this sequence:

1. Open BibleRank.
2. See John 3:16 ranked #1.
3. Search:
   > "everything works together for good"
4. See Romans 8:28 among the canonical semantic-search results.
5. Open Romans 8:28.
6. See:
   - WEB verse text
   - current rank
   - total contributed
   - amount required to take #1
7. Enter $25.
8. Complete Stripe Checkout.
9. Return to BibleRank.
10. Stripe webhook processes the contribution.
11. Romans 8:28 total increases by $25.
12. Its rank updates based solely on its new total.
13. Recent activity displays the contribution/movement.
14. The visitor can share the Romans 8:28 page.

If this sequence works reliably, the core BibleRank MVP works.
