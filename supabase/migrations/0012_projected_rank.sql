-- -----------------------------------------------------------------------------
-- get_rank_for_total: rank a verse would have if its total were p_total_cents.
-- Powers the "rank change" preview shown before a contribution is paid.
-- -----------------------------------------------------------------------------
create or replace function get_rank_for_total(p_verse_id uuid, p_total_cents bigint)
returns integer
language sql
stable
as $$
  select case when p_total_cents <= 0 then null
    else (
      select (count(*) + 1)::integer
      from verses v2
      where v2.id <> p_verse_id
        and v2.total_contributed_cents > p_total_cents
    )
  end;
$$;
