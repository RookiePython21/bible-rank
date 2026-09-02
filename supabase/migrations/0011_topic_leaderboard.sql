-- Topic/emotion-filtered leaderboard: ranks a specific set of verse ids using the
-- SAME global ordering as get_leaderboard / get_leaderboard_today, then filters down
-- to just those ids. This makes the returned `rank` the verse's true sitewide rank,
-- not a 1..N position local to the filtered set. Purely additive.

create or replace function get_leaderboard_by_ids(
  p_verse_ids uuid[],
  p_limit integer default 10
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
  interpretation_count bigint,
  last_contribution_at timestamptz,
  total_count bigint
)
language sql
stable
as $$
  select rank, id, canonical_key, book_name, book_slug, chapter_number, verse_number, verse_text,
         total_contributed_cents, click_count, interpretation_count, last_contribution_at,
         count(*) over ()::bigint as total_count
  from (
    select
      row_number() over (order by total_contributed_cents desc, rank_tiebreak_at asc) as rank,
      id, canonical_key, book_name, book_slug, chapter_number, verse_number, verse_text,
      total_contributed_cents, click_count,
      (select count(*) from interpretations i where i.verse_id = verses.id and not i.hidden)::bigint
        as interpretation_count,
      rank_tiebreak_at as last_contribution_at
    from verses
    where total_contributed_cents > 0
  ) globally_ranked
  where id = any(p_verse_ids)
  order by rank
  limit p_limit;
$$;

create or replace function get_leaderboard_today_by_ids(
  p_verse_ids uuid[],
  p_limit integer default 10
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
  interpretation_count bigint,
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
  globally_ranked as (
    select
      row_number() over (order by t.today_total_cents desc, t.last_contribution_at asc) as rank,
      v.id, v.canonical_key, v.book_name, v.book_slug, v.chapter_number, v.verse_number, v.verse_text,
      t.today_total_cents, v.total_contributed_cents, v.click_count,
      (select count(*) from interpretations i where i.verse_id = v.id and not i.hidden)::bigint
        as interpretation_count,
      t.last_contribution_at
    from today_totals t
    join verses v on v.id = t.verse_id
  )
  select rank, id, canonical_key, book_name, book_slug, chapter_number, verse_number, verse_text,
         today_total_cents, total_contributed_cents, click_count, interpretation_count,
         last_contribution_at, count(*) over ()::bigint as total_count
  from globally_ranked
  where id = any(p_verse_ids)
  order by rank
  limit p_limit;
$$;
