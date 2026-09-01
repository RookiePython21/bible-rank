-- Lets users share a short personal interpretation/reflection on a verse.
-- Additive to the existing money-based ranking — does not affect verses.total_contributed_cents.

create table if not exists interpretations (
  id uuid primary key default gen_random_uuid(),
  verse_id uuid not null references verses(id),
  author_name text check (author_name is null or char_length(author_name) <= 80),
  body text not null check (char_length(body) between 1 and 2000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_interpretations_verse_id on interpretations (verse_id);
create index if not exists idx_interpretations_created_at on interpretations (created_at desc);

alter table interpretations enable row level security;

create policy "visible interpretations are publicly readable"
  on interpretations for select
  using (not hidden);

-- No public insert/update/delete policy — writes go through the service-role
-- key via POST /api/interpretations, mirroring contributions/search_events.
