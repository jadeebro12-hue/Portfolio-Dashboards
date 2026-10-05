/**
 * Missing-value normalization. Source systems encode "no value" many ways
 * ("", "  ", "N/A", "null", NaN, 0 for an unset rent). These helpers turn all
 * of them into `null` so downstream metrics can count and exclude them
 * explicitly instead of treating them as real values.
 */

const NULL_TOKENS = new Set(["", "n/a", "na", "null", "none", "undefined", "-", "—"])

export function normalizeText(value: unknown): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return NULL_TOKENS.has(text.toLowerCase()) ? null : text
}

export interface NumberRules {
  min?: number
  max?: number
  integer?: boolean
  /** Treat exactly zero as missing (e.g. a rent field that defaults to 0). */
  zeroIsMissing?: boolean
}

/** Returns a finite number within the rules, or null. */
export function normalizeNumber(value: unknown, rules: NumberRules = {}): number | null {
  if (value == null) return null
  const n = typeof value === "number" ? value : Number(normalizeText(value) ?? NaN)
  if (!Number.isFinite(n)) return null
  if (rules.zeroIsMissing && n === 0) return null
  if (rules.integer && !Number.isInteger(n)) return null
  if (rules.min != null && n < rules.min) return null
  if (rules.max != null && n > rules.max) return null
  return n
}

/** Returns the value if it is one of `allowed`, else null. */
export function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  const text = normalizeText(value)
  if (text == null) return null
  const lower = text.toLowerCase()
  return allowed.find((a) => a.toLowerCase() === lower) ?? null
}

export function isMissing(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === "number") return !Number.isFinite(value)
  if (typeof value === "string") return normalizeText(value) == null
  return false
}
