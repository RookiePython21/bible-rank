-- "Top Today" leaderboard: ranks verses by contributions received during the
-- current UTC calendar day. Purely additive — does not touch get_leaderboard.

create index if not exists idx_contributions_completed_created
  on contributions (created_at)
  where status = 'completed';

create or replace function get_leaderboard_today(
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
  today_total_cents bigint,
  total_contributed_cents bigint,
  click_count bigint,
  last_contribution_at timestamptz,
  total_count bigint
)
language sql
stable
as $$
  with today_totals as (
    select
      verse_id,
      sum(amount_cents)::bigint as today_total_cents,
      max(created_at) as last_contribution_at
    from contributions
    where status = 'completed'
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    group by verse_id
  ),
  ranked as (
    select
      row_number() over (order by t.today_total_cents desc, t.last_contribution_at asc) as rank,
      count(*) over () as total_count,
      v.id, v.canonical_key, v.book_name, v.book_slug, v.chapter_number, v.verse_number, v.verse_text,
      t.today_total_cents, v.total_contributed_cents, v.click_count, t.last_contribution_at
    from today_totals t
    join verses v on v.id = t.verse_id
    where p_book_slugs is null or v.book_slug = any(p_book_slugs)
  )
  select rank, id, canonical_key, book_name, book_slug, chapter_number, verse_number, verse_text,
         today_total_cents, total_contributed_cents, click_count, last_contribution_at, total_count
  from ranked
  order by rank
  limit p_limit offset p_offset;
$$;
