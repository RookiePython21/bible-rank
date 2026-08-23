-- BibleRank RPC functions
-- All money-mutating logic lives here so it can run as a single atomic transaction.

-- ---------------------------------------------------------------------------
-- process_completed_contribution
-- The ONLY way verses.total_contributed_cents is ever incremented.
-- Idempotent on stripe_event_id: replays of the same Stripe event are no-ops.
-- ---------------------------------------------------------------------------
create or replace function process_completed_contribution(
  p_verse_id uuid,
  p_amount_cents integer,
  p_currency text,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text,
  p_stripe_event_id text,
  p_completed_at timestamptz
) returns table (
  contribution_id uuid,
  already_processed boolean,
  new_total_cents bigint,
  rank_before integer,
  rank_after integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_id uuid;
  v_rank_before integer;
  v_rank_after integer;
  v_new_total bigint;
  v_contribution_id uuid;
begin
  -- Fast-path idempotency check (avoids taking a row lock for known replays).
  select id into v_existing_id from contributions where stripe_event_id = p_stripe_event_id;
  if v_existing_id is not null then
    select total_contributed_cents into v_new_total from verses where id = p_verse_id;
    return query select v_existing_id, true, v_new_total, null::integer, null::integer;
    return;
  end if;

  -- Serialize concurrent contributions against the same verse.
  perform 1 from verses where id = p_verse_id for update;

  select count(*) + 1 into v_rank_before
  from verses v2, verses v1
  where v1.id = p_verse_id
    and (
      v2.total_contributed_cents > v1.total_contributed_cents
      or (v2.total_contributed_cents = v1.total_contributed_cents and v2.rank_tiebreak_at < v1.rank_tiebreak_at)
    );

  insert into contributions (
    verse_id, amount_cents, currency, stripe_checkout_session_id,
    stripe_payment_intent_id, stripe_event_id, status, rank_before, created_at
  ) values (
    p_verse_id, p_amount_cents, p_currency, p_stripe_checkout_session_id,
    p_stripe_payment_intent_id, p_stripe_event_id, 'completed', v_rank_before, p_completed_at
  )
  on conflict (stripe_event_id) do nothing
  returning id into v_contribution_id;

  -- Lost the race against a concurrent delivery of the same event.
  if v_contribution_id is null then
    select id into v_contribution_id from contributions where stripe_event_id = p_stripe_event_id;
    select total_contributed_cents into v_new_total from verses where id = p_verse_id;
    return query select v_contribution_id, true, v_new_total, null::integer, null::integer;
    return;
  end if;

  update verses
    set total_contributed_cents = total_contributed_cents + p_amount_cents,
        rank_tiebreak_at = p_completed_at
    where id = p_verse_id
    returning total_contributed_cents into v_new_total;

  select count(*) + 1 into v_rank_after
  from verses v2, verses v1
  where v1.id = p_verse_id
    and (
      v2.total_contributed_cents > v1.total_contributed_cents
      or (v2.total_contributed_cents = v1.total_contributed_cents and v2.rank_tiebreak_at < v1.rank_tiebreak_at)
    );

  update contributions set rank_after = v_rank_after where id = v_contribution_id;

  return query select v_contribution_id, false, v_new_total, v_rank_before, v_rank_after;
end;
$$;

-- ---------------------------------------------------------------------------
-- process_refund
-- Subtracts a refunded contribution from its verse total. Never deletes the
-- original contribution row — it is marked 'refunded' for historical integrity.
-- ---------------------------------------------------------------------------
create or replace function process_refund(
  p_stripe_payment_intent_id text
) returns table (
  contribution_id uuid,
  verse_id uuid,
  refunded_amount_cents integer,
  new_total_cents bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contribution contributions%rowtype;
  v_new_total bigint;
begin
  select * into v_contribution
  from contributions
  where stripe_payment_intent_id = p_stripe_payment_intent_id
    and status = 'completed'
  limit 1;

  if v_contribution.id is null then
    return;
  end if;

  perform 1 from verses where id = v_contribution.verse_id for update;

  update contributions set status = 'refunded' where id = v_contribution.id;

  update verses
    set total_contributed_cents = greatest(0, total_contributed_cents - v_contribution.amount_cents)
    where id = v_contribution.verse_id
    returning total_contributed_cents into v_new_total;

  return query select v_contribution.id, v_contribution.verse_id, v_contribution.amount_cents, v_new_total;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_leaderboard: Top N funded verses (total_contributed_cents > 0)
-- ---------------------------------------------------------------------------
create or replace function get_leaderboard(
  p_limit integer default 25,
  p_offset integer default 0
) returns table (
  rank bigint,
  id uuid,
  canonical_key text,
  book_name text,
  book_slug text,
  chapter_number integer,
  verse_number integer,
  verse_text text,
  total_contributed_cents bigint
)
language sql
stable
as $$
  select rank, id, canonical_key, book_name, book_slug, chapter_number, verse_number, verse_text, total_contributed_cents
  from (
    select
      row_number() over (order by total_contributed_cents desc, rank_tiebreak_at asc) as rank,
      id, canonical_key, book_name, book_slug, chapter_number, verse_number, verse_text, total_contributed_cents
    from verses
    where total_contributed_cents > 0
  ) ranked
  order by rank
  limit p_limit offset p_offset;
$$;

-- ---------------------------------------------------------------------------
-- get_verse_rank: dynamic rank for a single verse; null when unfunded ($0)
-- ---------------------------------------------------------------------------
create or replace function get_verse_rank(p_verse_id uuid)
returns integer
language sql
stable
as $$
  select case when v1.total_contributed_cents = 0 then null
    else (
      select (count(*) + 1)::integer
      from verses v2
      where v2.total_contributed_cents > v1.total_contributed_cents
        or (v2.total_contributed_cents = v1.total_contributed_cents and v2.rank_tiebreak_at < v1.rank_tiebreak_at)
    )
  end
  from verses v1
  where v1.id = p_verse_id;
$$;

-- ---------------------------------------------------------------------------
-- get_top_total: current #1 total, used for "Take #1 for $X" calculations
-- ---------------------------------------------------------------------------
create or replace function get_top_total()
returns bigint
language sql
stable
as $$
  select coalesce(max(total_contributed_cents), 0) from verses;
$$;

-- ---------------------------------------------------------------------------
-- match_verses: pgvector nearest-neighbor semantic search
-- ---------------------------------------------------------------------------
create or replace function match_verses(
  query_embedding vector(1536),
  match_count integer default 5,
  similarity_threshold float default 0.3
) returns table (
  id uuid,
  canonical_key text,
  book_name text,
  book_slug text,
  chapter_number integer,
  verse_number integer,
  verse_text text,
  total_contributed_cents bigint,
  similarity float
)
language sql
stable
as $$
  select
    v.id, v.canonical_key, v.book_name, v.book_slug, v.chapter_number, v.verse_number,
    v.verse_text, v.total_contributed_cents,
    1 - (v.embedding <=> query_embedding) as similarity
  from verses v
  where v.embedding is not null
    and 1 - (v.embedding <=> query_embedding) >= similarity_threshold
  order by v.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- reconcile_totals: admin drift check between verses.total_contributed_cents
-- and the sum of completed contributions.
-- ---------------------------------------------------------------------------
create or replace function reconcile_totals()
returns table (
  verse_id uuid,
  canonical_key text,
  stored_total_cents bigint,
  computed_total_cents bigint,
  diff_cents bigint
)
language sql
stable
as $$
  select
    v.id,
    v.canonical_key,
    v.total_contributed_cents,
    coalesce(sum(c.amount_cents), 0)::bigint as computed_total_cents,
    v.total_contributed_cents - coalesce(sum(c.amount_cents), 0)::bigint as diff_cents
  from verses v
  left join contributions c
    on c.verse_id = v.id and c.status = 'completed'
  group by v.id, v.canonical_key, v.total_contributed_cents
  having v.total_contributed_cents <> coalesce(sum(c.amount_cents), 0)::bigint;
$$;
