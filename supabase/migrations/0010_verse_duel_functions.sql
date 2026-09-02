-- Weekly Verse Duel RPCs.

-- ---------------------------------------------------------------------------
-- create_next_duel: opens a new 7-day duel between two verses, if none is
-- currently open. Picks today's two most-contributed-to verses when at least
-- two exist; otherwise falls back to the all-time top two. Called by
-- resolve_duel() and seeded once at the end of this migration.
-- ---------------------------------------------------------------------------
create or replace function create_next_duel()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_verse_a uuid;
  v_verse_b uuid;
  v_duel_id uuid;
  v_today_verse_count integer;
begin
  if exists (select 1 from duels where status = 'open') then
    return null;
  end if;

  select count(*) into v_today_verse_count
  from (
    select verse_id
    from contributions
    where status = 'completed'
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    group by verse_id
  ) t;

  if v_today_verse_count >= 2 then
    select v.id into v_verse_a
    from verses v
    join contributions c on c.verse_id = v.id
    where c.status = 'completed'
      and c.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
    group by v.id
    order by sum(c.amount_cents) desc
    limit 1;

    select v.id into v_verse_b
    from verses v
    join contributions c on c.verse_id = v.id
    where c.status = 'completed'
      and c.created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
      and v.id <> v_verse_a
    group by v.id
    order by sum(c.amount_cents) desc
    limit 1;
  else
    select id into v_verse_a from verses order by total_contributed_cents desc, rank_tiebreak_at asc limit 1;
    select id into v_verse_b from verses where id <> v_verse_a
      order by total_contributed_cents desc, rank_tiebreak_at asc limit 1;
  end if;

  if v_verse_a is null or v_verse_b is null then
    return null;
  end if;

  insert into duels (verse_a_id, verse_b_id, window_start, window_end, status)
  values (v_verse_a, v_verse_b, now(), now() + interval '7 days', 'open')
  returning id into v_duel_id;

  return v_duel_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- process_duel_backing
-- Idempotent on stripe_event_id, mirroring process_completed_contribution.
-- ---------------------------------------------------------------------------
create or replace function process_duel_backing(
  p_duel_id uuid,
  p_side text,
  p_amount_cents integer,
  p_why_note text,
  p_author_name text,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text,
  p_stripe_event_id text,
  p_completed_at timestamptz
) returns table (
  backing_id uuid,
  already_processed boolean,
  side_a_total_cents bigint,
  side_b_total_cents bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_id uuid;
  v_backing_id uuid;
  v_side_a_total bigint;
  v_side_b_total bigint;
  v_window_still_open boolean;
begin
  select id into v_existing_id from duel_backings where stripe_event_id = p_stripe_event_id;
  if v_existing_id is not null then
    select coalesce(sum(amount_cents) filter (where side = 'a'), 0),
           coalesce(sum(amount_cents) filter (where side = 'b'), 0)
      into v_side_a_total, v_side_b_total
      from duel_backings where duel_id = p_duel_id and status = 'completed';
    return query select v_existing_id, true, v_side_a_total, v_side_b_total;
    return;
  end if;

  perform 1 from duels where id = p_duel_id for update;

  select exists (
    select 1 from duels where id = p_duel_id and status = 'open' and window_end > p_completed_at
  ) into v_window_still_open;

  if not v_window_still_open then
    -- Window closed between checkout creation and webhook delivery (rare
    -- race). Recorded as refunded so admin can see and refund it manually —
    -- never silently drops paid-but-late money.
    insert into duel_backings (
      duel_id, side, amount_cents, why_note, author_name,
      stripe_checkout_session_id, stripe_payment_intent_id, stripe_event_id, status
    ) values (
      p_duel_id, p_side, p_amount_cents, p_why_note, p_author_name,
      p_stripe_checkout_session_id, p_stripe_payment_intent_id, p_stripe_event_id, 'refunded'
    )
    on conflict (stripe_event_id) do nothing
    returning id into v_backing_id;

    return query select v_backing_id, false, null::bigint, null::bigint;
    return;
  end if;

  insert into duel_backings (
    duel_id, side, amount_cents, why_note, author_name,
    stripe_checkout_session_id, stripe_payment_intent_id, stripe_event_id, status, created_at
  ) values (
    p_duel_id, p_side, p_amount_cents, p_why_note, p_author_name,
    p_stripe_checkout_session_id, p_stripe_payment_intent_id, p_stripe_event_id, 'completed', p_completed_at
  )
  on conflict (stripe_event_id) do nothing
  returning id into v_backing_id;

  if v_backing_id is null then
    select id into v_backing_id from duel_backings where stripe_event_id = p_stripe_event_id;
  end if;

  select coalesce(sum(amount_cents) filter (where side = 'a'), 0),
         coalesce(sum(amount_cents) filter (where side = 'b'), 0)
    into v_side_a_total, v_side_b_total
    from duel_backings where duel_id = p_duel_id and status = 'completed';

  return query select v_backing_id, false, v_side_a_total, v_side_b_total;
end;
$$;

-- ---------------------------------------------------------------------------
-- process_duel_backing_refund: mirrors process_refund, scoped to duel_backings.
-- Never deletes the original row — marks it 'refunded' for historical
-- integrity, same as contributions.
-- ---------------------------------------------------------------------------
create or replace function process_duel_backing_refund(
  p_stripe_payment_intent_id text
) returns table (
  backing_id uuid,
  duel_id uuid,
  refunded_amount_cents integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_backing duel_backings%rowtype;
begin
  select * into v_backing
  from duel_backings
  where stripe_payment_intent_id = p_stripe_payment_intent_id
    and status = 'completed'
  limit 1;

  if v_backing.id is null then
    return;
  end if;

  update duel_backings set status = 'refunded' where id = v_backing.id;

  return query select v_backing.id, v_backing.duel_id, v_backing.amount_cents;
end;
$$;

-- ---------------------------------------------------------------------------
-- resolve_duel: cron-only. Tallies backing per side, records which side
-- (if any) spoke to more people, and opens next week's duel.
-- ---------------------------------------------------------------------------
create or replace function resolve_duel(p_duel_id uuid)
returns table (
  duel_id uuid,
  resolved_side text,
  side_a_total_cents bigint,
  side_b_total_cents bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_side_a_total bigint;
  v_side_b_total bigint;
  v_resolved_side text;
  v_eligible boolean;
begin
  perform 1 from duels where id = p_duel_id for update;

  select exists (
    select 1 from duels where id = p_duel_id and status = 'open' and window_end <= now()
  ) into v_eligible;

  if not v_eligible then
    return query select p_duel_id, null::text, null::bigint, null::bigint;
    return;
  end if;

  select coalesce(sum(amount_cents) filter (where side = 'a'), 0),
         coalesce(sum(amount_cents) filter (where side = 'b'), 0)
    into v_side_a_total, v_side_b_total
    from duel_backings where duel_id = p_duel_id and status = 'completed';

  v_resolved_side := case
    when v_side_a_total > v_side_b_total then 'a'
    when v_side_b_total > v_side_a_total then 'b'
    else null
  end;

  update duels
    set status = 'resolved', resolved_side = v_resolved_side
    where id = p_duel_id;

  perform create_next_duel();

  return query select p_duel_id, v_resolved_side, v_side_a_total, v_side_b_total;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_duel_tallies: live read for the widget (Realtime/polling apply deltas
-- on top of this initial load).
-- ---------------------------------------------------------------------------
create or replace function get_duel_tallies(p_duel_id uuid)
returns table (
  side_a_total_cents bigint,
  side_b_total_cents bigint,
  side_a_backer_count bigint,
  side_b_backer_count bigint
)
language sql
stable
as $$
  select
    coalesce(sum(amount_cents) filter (where side = 'a'), 0),
    coalesce(sum(amount_cents) filter (where side = 'b'), 0),
    count(*) filter (where side = 'a'),
    count(*) filter (where side = 'b')
  from duel_backings
  where duel_id = p_duel_id and status = 'completed';
$$;

-- ---------------------------------------------------------------------------
-- get_duel_by_id / get_current_duel: verse detail + totals for a duel page.
-- ---------------------------------------------------------------------------
create or replace function get_duel_by_id(p_duel_id uuid)
returns table (
  id uuid,
  window_start timestamptz,
  window_end timestamptz,
  status text,
  resolved_side text,
  verse_a_id uuid,
  verse_a_canonical_key text,
  verse_a_book_name text,
  verse_a_book_slug text,
  verse_a_chapter_number integer,
  verse_a_verse_number integer,
  verse_a_text text,
  verse_b_id uuid,
  verse_b_canonical_key text,
  verse_b_book_name text,
  verse_b_book_slug text,
  verse_b_chapter_number integer,
  verse_b_verse_number integer,
  verse_b_text text,
  side_a_total_cents bigint,
  side_b_total_cents bigint,
  side_a_backer_count bigint,
  side_b_backer_count bigint
)
language sql
stable
as $$
  select
    d.id, d.window_start, d.window_end, d.status, d.resolved_side,
    va.id, va.canonical_key, va.book_name, va.book_slug, va.chapter_number, va.verse_number, va.verse_text,
    vb.id, vb.canonical_key, vb.book_name, vb.book_slug, vb.chapter_number, vb.verse_number, vb.verse_text,
    coalesce((select sum(amount_cents) from duel_backings where duel_id = d.id and side = 'a' and status = 'completed'), 0),
    coalesce((select sum(amount_cents) from duel_backings where duel_id = d.id and side = 'b' and status = 'completed'), 0),
    coalesce((select count(*) from duel_backings where duel_id = d.id and side = 'a' and status = 'completed'), 0),
    coalesce((select count(*) from duel_backings where duel_id = d.id and side = 'b' and status = 'completed'), 0)
  from duels d
  join verses va on va.id = d.verse_a_id
  join verses vb on vb.id = d.verse_b_id
  where d.id = p_duel_id;
$$;

create or replace function get_current_duel()
returns table (
  id uuid,
  window_start timestamptz,
  window_end timestamptz,
  status text,
  resolved_side text,
  verse_a_id uuid,
  verse_a_canonical_key text,
  verse_a_book_name text,
  verse_a_book_slug text,
  verse_a_chapter_number integer,
  verse_a_verse_number integer,
  verse_a_text text,
  verse_b_id uuid,
  verse_b_canonical_key text,
  verse_b_book_name text,
  verse_b_book_slug text,
  verse_b_chapter_number integer,
  verse_b_verse_number integer,
  verse_b_text text,
  side_a_total_cents bigint,
  side_b_total_cents bigint,
  side_a_backer_count bigint,
  side_b_backer_count bigint
)
language sql
stable
as $$
  select * from get_duel_by_id((select id from duels where status = 'open' order by window_start desc limit 1));
$$;

-- Seed the very first duel so the feature has content immediately, without
-- waiting for the first cron tick.
select create_next_duel();
