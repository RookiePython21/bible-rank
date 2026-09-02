-- Weekly Verse Duel: every week, two verses go head-to-head. People back
-- whichever verse "speaks to them more" with a small contribution and an
-- optional note. Purely additive — never touches verses.total_contributed_cents.

create table if not exists duels (
  id uuid primary key default gen_random_uuid(),

  verse_a_id uuid not null references verses(id),
  verse_b_id uuid not null references verses(id),

  window_start timestamptz not null,
  window_end timestamptz not null,

  status text not null default 'open' check (status in ('open', 'resolved')),
  resolved_side text check (resolved_side in ('a', 'b')), -- null = tie or unresolved

  created_at timestamptz not null default now()
);

-- Only one duel is ever open at a time.
create unique index if not exists idx_duels_one_open on duels ((true)) where status = 'open';
create index if not exists idx_duels_status on duels (status);

create table if not exists duel_backings (
  id uuid primary key default gen_random_uuid(),

  duel_id uuid not null references duels(id),
  side text not null check (side in ('a', 'b')),
  amount_cents integer not null check (amount_cents >= 100),

  why_note text check (why_note is null or char_length(why_note) <= 280),
  author_name text check (author_name is null or char_length(author_name) <= 80),

  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_event_id text unique,

  status text not null default 'pending' check (status in ('pending', 'completed', 'refunded')),
  hidden boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists idx_duel_backings_duel_id on duel_backings (duel_id);
create index if not exists idx_duel_backings_stripe_event_id on duel_backings (stripe_event_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table duels enable row level security;
alter table duel_backings enable row level security;

create policy "duels are publicly readable"
  on duels for select
  using (true);

create policy "non-hidden completed backings are publicly readable"
  on duel_backings for select
  using (not hidden and status = 'completed');

-- No public insert/update/delete policies — writes go through the
-- service-role key via POST /api/duels/back-checkout and the Stripe webhook,
-- mirroring contributions/interpretations.

-- ---------------------------------------------------------------------------
-- Realtime: enables live "which speaks to you more" tallies on the duel page.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table duel_backings;
