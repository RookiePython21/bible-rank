-- Impact stats: generic analytics events table for verse views and shares,
-- plus a read RPC aggregating impact metrics (views, searches, supported
-- verses, shares, and completed contribution totals) for the homepage.

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  verse_id uuid references verses(id),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_event_type on analytics_events (event_type);
create index if not exists idx_analytics_events_verse_id on analytics_events (verse_id);

alter table analytics_events enable row level security;

-- No public select/insert policies are defined on purpose — only the
-- service-role key (server-side) and the security definer RPC below can
-- read/write this table, matching the search_events convention.

create or replace function get_impact_stats()
returns table (
  verse_views bigint,
  bible_searches bigint,
  verses_supported bigint,
  verses_shared bigint,
  leaderboard_contributions_cents bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from analytics_events where event_type = 'verse_view'),
    (select count(*) from search_events),
    (select count(*) from verses where total_contributed_cents > 0),
    (select count(*) from analytics_events where event_type = 'verse_share'),
    coalesce((select sum(amount_cents) from contributions where status = 'completed'), 0)::bigint;
$$;
