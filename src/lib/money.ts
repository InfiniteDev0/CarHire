/** The single currency the product displays and bills in. */
export const CURRENCY = { code: "USD", symbol: "$" } as const;

/**
 * Format an amount for display, e.g. 1284500 → "$1,284,500", 662.4 → "$662.40".
 * Whole amounts show no decimals; fractional amounts always show two.
 */
export function money(n: number | string | null | undefined): string {
  const value = Number(n ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  const fraction = Number.isInteger(safe) ? 0 : 2;
  const text = Math.abs(safe).toLocaleString("en-US", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  });
  return `${safe < 0 ? "−" : ""}${CURRENCY.symbol}${text}`;
}
