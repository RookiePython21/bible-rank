export function formatCompactCount(n: number): string {
  if (n < 10_000) return n.toLocaleString("en-US");
  return `${new Intl.NumberFormat("en-US", { notation: "compact" }).format(n)}+`;
}
