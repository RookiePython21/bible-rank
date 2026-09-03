export const MIN_CONTRIBUTION_CENTS = 100;
export const TAKE_FIRST_MARGIN_CENTS = 500;
export const CLAIM_OTHER_RANK_MARGIN_CENTS = 100;

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars) * 100;
}

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

export function formatUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(centsToDollars(cents));
}

export function isWholeDollarAmount(dollars: number): boolean {
  return Number.isInteger(dollars) && dollars >= 1;
}

/**
 * Minimum contribution (in cents) required to immediately take #1.
 * PRD 6.3: max(1, current_top_total + 5 - selected_verse_total), in dollars,
 * computed here in cents to avoid float rounding.
 */
export function requiredToTakeFirstCents(
  currentTopTotalCents: number,
  selectedVerseTotalCents: number
): number {
  const required =
    currentTopTotalCents + TAKE_FIRST_MARGIN_CENTS - selectedVerseTotalCents;
  return Math.max(MIN_CONTRIBUTION_CENTS, required);
}

/**
 * Display-only "claim this rank for $X" price shown on the leaderboard:
 * that row's own total, plus the margin required to hold the rank outright
 * (rank #1 needs +$5, any other visible rank needs +$1).
 */
export function claimPriceCents(row: { rank: number; total_contributed_cents: number }): number {
  const margin = row.rank === 1 ? TAKE_FIRST_MARGIN_CENTS : CLAIM_OTHER_RANK_MARGIN_CENTS;
  return row.total_contributed_cents + margin;
}

/**
 * Homepage leaderboard bid ceilings, highest rank first. The board's claim
 * price tracks each row's own total, which put the top of the all-time board
 * out of reach as a first contribution ("claim this rank for $205"). The
 * homepage caps the bid it asks for by rank instead — #1 never costs more
 * than $9 — while the verse and checkout pages still show the true amount
 * required to take a rank.
 */
export const TOP_RANK_BID_CEILING_CENTS = 900;

const BID_CEILINGS_CENTS: readonly { maxRank: number; ceilingCents: number }[] = [
  { maxRank: 1, ceilingCents: TOP_RANK_BID_CEILING_CENTS },
  { maxRank: 3, ceilingCents: 700 },
  { maxRank: 10, ceilingCents: 500 },
];

const LOWER_RANK_BID_CEILING_CENTS = 300;

export function bidCeilingCents(rank: number): number {
  return (
    BID_CEILINGS_CENTS.find((tier) => rank <= tier.maxRank)?.ceilingCents ??
    LOWER_RANK_BID_CEILING_CENTS
  );
}

/**
 * Bid shown on the homepage leaderboard: the row's claim price, capped by the
 * ceiling for its rank. Both inputs fall with rank, so the ladder never asks
 * more for a lower-ranked row than for a higher one.
 */
export function leaderboardBidCents(row: { rank: number; total_contributed_cents: number }): number {
  return Math.max(
    MIN_CONTRIBUTION_CENTS,
    Math.min(claimPriceCents(row), bidCeilingCents(row.rank))
  );
}
