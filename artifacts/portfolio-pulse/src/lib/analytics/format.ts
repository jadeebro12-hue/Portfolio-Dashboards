/**
 * Metric math and formatting. Every formatter accepts `null` and renders "N/A",
 * so an absent or undefined metric can never display as 0 or as a fabricated value.
 */

export const NA = "N/A"

/** Division that returns null instead of Infinity/NaN when the denominator is 0 or missing. */
export function safeDivide(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (numerator == null || denominator == null) return null
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null
  return numerator / denominator
}

export function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function formatCount(value: number | null | undefined): string {
  return value == null ? NA : Math.round(value).toLocaleString("en-US")
}

/** 0.947 → "94.7%". Shares are rounded to 1 decimal to avoid false precision. */
export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return NA
  return `${(value * 100).toFixed(digits)}%`
}

/** Percentage-point change: 0.012 → "+1.2 pts". */
export function formatPctPoints(delta: number | null | undefined, digits = 1): string {
  if (delta == null || !Number.isFinite(delta)) return NA
  const pts = delta * 100
  const sign = pts > 0 ? "+" : pts < 0 ? "−" : "±"
  return `${sign}${Math.abs(pts).toFixed(digits)} pts`
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return NA
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
}

/** Signed whole-number change: 4 → "+4", -2 → "−2". */
export function formatSignedCount(delta: number | null | undefined): string {
  if (delta == null || !Number.isFinite(delta)) return NA
  if (delta === 0) return "±0"
  return `${delta > 0 ? "+" : "−"}${Math.abs(Math.round(delta)).toLocaleString("en-US")}`
}

export function formatDays(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return NA
  const d = Math.round(value)
  return `${d} ${Math.abs(d) === 1 ? "day" : "days"}`
}
