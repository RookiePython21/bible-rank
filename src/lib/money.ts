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
