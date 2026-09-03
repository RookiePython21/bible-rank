-- Rescale the all-time leaderboard down to launch-scale amounts.
--
-- The all-time board had grown far past what a first-time visitor will bid, so
-- every funded verse is scaled by a single factor that lands the #1 verse at
-- the cap below ($9 — the same ceiling the homepage uses for its #1 bid, see
-- TOP_RANK_BID_CEILING_CENTS in src/lib/money.ts). One factor for every verse
-- and rank_tiebreak_at untouched, so the board keeps its exact order.
--
-- The contributions ledger records real Stripe payments and is NOT rewritten.
-- The reduction is stored per verse in verses.total_adjustment_cents, and
-- reconcile_totals() now checks
--   total_contributed_cents = SUM(completed contributions) + total_adjustment_cents
-- so the /admin drift check stays at zero and every payment stays auditable
-- against Stripe.
--
-- Safe to re-run: a no-op once the top total is at or below the cap.

-- ---------------------------------------------------------------------------
-- total_adjustment_cents: manual corrections to a verse's displayed total that
-- do not correspond to a payment.
-- ---------------------------------------------------------------------------
alter table verses add column if not exists total_adjustment_cents bigint not null default 0;

comment on column verses.total_adjustment_cents is
  'Adjustment folded into total_contributed_cents on top of the contributions ledger (the launch-scale rescale in migration 0013). Negative values reduce the displayed total; reconcile_totals() accounts for it.';

-- ---------------------------------------------------------------------------
-- reconcile_totals: compare the stored total against the ledger *plus* the
-- verse's adjustment. Return columns are unchanged.
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
    (coalesce(sum(c.amount_cents), 0) + v.total_adjustment_cents)::bigint as computed_total_cents,
    v.total_contributed_cents - (coalesce(sum(c.amount_cents), 0) + v.total_adjustment_cents)::bigint as diff_cents
  from verses v
  left join contributions c
    on c.verse_id = v.id and c.status = 'completed'
  group by v.id, v.canonical_key, v.total_contributed_cents, v.total_adjustment_cents
  having v.total_contributed_cents <> (coalesce(sum(c.amount_cents), 0) + v.total_adjustment_cents)::bigint;
$$;

-- ---------------------------------------------------------------------------
-- The rescale itself.
-- ---------------------------------------------------------------------------
do $$
declare
  -- Cap for the #1 verse's total, in cents.
  c_cap constant bigint := 900;
  v_max bigint;
  v_factor numeric;
begin
  select coalesce(max(total_contributed_cents), 0) into v_max from verses;

  if v_max <= c_cap then
    raise notice 'Top verse total is already % cents; nothing to rescale.', v_max;
    return;
  end if;

  v_factor := c_cap::numeric / v_max::numeric;
  raise notice 'Rescaling funded verses by factor % (top total % cents -> % cents).',
    round(v_factor, 6), v_max, c_cap;

  -- Funded verses stay at or above the $1 minimum contribution, so no row on
  -- the board renders as "$0 contributed". The adjustment absorbs exactly the
  -- amount each total moved by.
  update verses v
     set total_contributed_cents = scaled.new_total_cents,
         total_adjustment_cents =
           v.total_adjustment_cents + (scaled.new_total_cents - v.total_contributed_cents)
    from (
      select id, greatest(100, round(total_contributed_cents * v_factor)::bigint) as new_total_cents
        from verses
       where total_contributed_cents > 0
    ) scaled
   where scaled.id = v.id;

  raise notice 'Rescale complete: % verses, new top total % cents.',
    (select count(*) from verses where total_contributed_cents > 0),
    (select coalesce(max(total_contributed_cents), 0) from verses);
end $$;

-- A refund of a payment made before this rescale subtracts its full, unscaled
-- amount from an already-reduced total (process_refund clamps at 0), which can
-- leave that verse showing drift in /admin. Re-running this migration puts the
-- board back on one scale.
