-- BibleRank initial schema
-- Run this against your Supabase Postgres project (SQL editor or `supabase db push`).

create extension if not exists pgcrypto;
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- verses: canonical World English Bible verse records
-- ---------------------------------------------------------------------------
create table if not exists verses (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  book_name text not null,
  book_slug text not null,
  book_number integer not null,
  chapter_number integer not null,
  verse_number integer not null,
  verse_text text not null,
  translation text not null default 'WEB',

  total_contributed_cents bigint not null default 0,
  rank_tiebreak_at timestamptz not null default now(),

  -- text-embedding-3-small produces 1536-dimensional vectors
  embedding vector(1536),

  created_at timestamptz not null default now(),

  unique (book_number, chapter_number, verse_number)
);

create index if not exists idx_verses_canonical_key on verses (canonical_key);
create index if not exists idx_verses_book_chapter_verse on verses (book_slug, chapter_number, verse_number);
create index if not exists idx_verses_total_desc on verses (total_contributed_cents desc, rank_tiebreak_at asc);
create index if not exists idx_verses_book_slug on verses (book_slug);

-- Vector similarity index (created after embeddings are populated for best results,
-- but safe to create up front — ivfflat tolerates an empty/sparse table at first).
create index if not exists idx_verses_embedding on verses
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Full text search fallback / lexical matching support
alter table verses add column if not exists verse_text_tsv tsvector
  generated always as (to_tsvector('english', verse_text)) stored;
create index if not exists idx_verses_text_tsv on verses using gin (verse_text_tsv);

-- ---------------------------------------------------------------------------
-- contributions: one row per completed (or refunded) Stripe payment
-- ---------------------------------------------------------------------------
create table if not exists contributions (
  id uuid primary key default gen_random_uuid(),

  verse_id uuid not null references verses(id),

  amount_cents integer not null check (amount_cents >= 100),
  currency text not null default 'usd',

  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_event_id text unique,

  status text not null default 'completed'
    check (status in ('completed', 'refunded')),

  rank_before integer,
  rank_after integer,

  created_at timestamptz not null default now()
);

create index if not exists idx_contributions_verse_id on contributions (verse_id);
create index if not exists idx_contributions_created_at on contributions (created_at desc);
create index if not exists idx_contributions_status on contributions (status);

-- ---------------------------------------------------------------------------
-- search_events: optional analytics log, never blocks launch
-- ---------------------------------------------------------------------------
create table if not exists search_events (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  selected_verse_id uuid references verses(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Public (anon) read access to verses + completed contributions.
-- All writes happen only through the service role (server-side) or RPCs below.
-- ---------------------------------------------------------------------------
alter table verses enable row level security;
alter table contributions enable row level security;
alter table search_events enable row level security;

create policy "verses are publicly readable"
  on verses for select
  using (true);

create policy "completed contributions are publicly readable"
  on contributions for select
  using (status = 'completed');

-- No public insert/update/delete policies are defined on purpose.
-- The service-role key (server-side only) bypasses RLS for writes.
