-- Leaderboard v2: category filtering, pagination metadata, click tracking,
-- and site-wide visitor/stats support for the outbid.lol-style homepage.

-- ---------------------------------------------------------------------------
-- Click tracking
-- ---------------------------------------------------------------------------
alter table verses add column if not exists click_count bigint not null default 0;

create or replace function increment_verse_click(p_verse_id uuid)
returns bigint
language sql
security definer
set search_path = public
as $$
  update verses set click_count = click_count + 1
  where id = p_verse_id
  returning click_count;
$$;

-- ---------------------------------------------------------------------------
-- site_stats: single-row table tracking lifetime visitors + launch time.
-- Revenue/highest-bid are computed from contributions at read time, not stored.
-- ---------------------------------------------------------------------------
create table if not exists site_stats (
  id boolean primary key default true check (id),
  total_visitors bigint not null default 0,
  launched_at timestamptz not null default now()
);

insert into site_stats (id) values (true) on conflict (id) do nothing;

alter table site_stats enable row level security;

create policy "site stats are publicly readable"
  on site_stats for select
  using (true);

create or replace function increment_visitor_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  update site_stats set total_visitors = total_visitors + 1
  where id = true
  returning total_visitors;
$$;

create or replace function get_site_stats()
returns table (
  total_visitors bigint,
  launched_at timestamptz,
  total_revenue_cents bigint,
  highest_bid_cents bigint
)
language sql
stable
as $$
  select
    s.total_visitors,
    s.launched_at,
    coalesce((select sum(amount_cents) from contributions where status = 'completed'), 0)::bigint,
    coalesce((select max(amount_cents) from contributions where status = 'completed'), 0)::bigint
  from site_stats s
  where s.id = true;
$$;

-- ---------------------------------------------------------------------------
-- get_leaderboard: add category (book_slug) filtering, click_count,
-- last_contribution_at, and total_count (for pagination). Return columns
-- changed, so the old signature must be dropped before recreating.
-- ---------------------------------------------------------------------------
drop function if exists get_leaderboard(integer, integer);

create or replace function get_leaderboard(
  p_limit integer default 25,
  p_offset integer default 0,
  p_book_slugs text[] default null
) returns table (
  rank bigint,
  id uuid,
  canonical_key text,
  book_name text,
  book_slug text,
  chapter_number integer,
  verse_number integer,
  verse_text text,
  total_contributed_cents bigint,
  click_count bigint,
  last_contribution_at timestamptz,
  total_count bigint
)
language sql
stable
as $$
  select rank, id, canonical_key, book_name, book_slug, chapter_number, verse_number, verse_text,
         total_contributed_cents, click_count, last_contribution_at, total_count
  from (
    select
      row_number() over (order by total_contributed_cents desc, rank_tiebreak_at asc) as rank,
      count(*) over () as total_count,
      id, canonical_key, book_name, book_slug, chapter_number, verse_number, verse_text,
      total_contributed_cents, click_count, rank_tiebreak_at as last_contribution_at
    from verses
    where total_contributed_cents > 0
      and (p_book_slugs is null or book_slug = any(p_book_slugs))
  ) ranked
  order by rank
  limit p_limit offset p_offset;
$$;
