/**
 * Date helpers for analytics. All functions are null-safe: an unparseable or
 * missing date becomes `null` and is excluded from date-based metrics rather
 * than silently coerced to "today" or the epoch.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export type DateInput = string | Date | null | undefined

/**
 * Parse a source date. Plain `YYYY-MM-DD` strings are read as *local* calendar
 * dates (the JS default treats them as UTC midnight, which shifts them a day
 * in US time zones). Impossible dates such as 2026-02-30 return null.
 */
export function parseDate(value: DateInput): Date | null {
  if (value == null) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const trimmed = value.trim()
  if (!trimmed) return null

  const m = ISO_DATE.exec(trimmed)
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
    const date = new Date(y, mo - 1, d)
    const roundTrips =
      date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d
    return roundTrips ? date : null
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Local midnight of the given date. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS)
}

export function addDays(date: Date, days: number): Date {
  const d = startOfDay(date)
  d.setDate(d.getDate() + days)
  return d
}

/** True only when both dates exist and start is on or before end. */
export function isValidRange(start: Date | null, end: Date | null): boolean {
  return start != null && end != null && start.getTime() <= end.getTime()
}

export function isAfterDay(date: Date, reference: Date): boolean {
  return startOfDay(date).getTime() > startOfDay(reference).getTime()
}

export interface DateWindow {
  /** Inclusive start (local midnight). */
  start: Date
  /** Inclusive end (local midnight). */
  end: Date
  days: number
}

/** The `days`-long window ending on `asOf` (inclusive), e.g. "last 30 days". */
export function trailingWindow(asOf: Date, days: number): DateWindow {
  const end = startOfDay(asOf)
  return { start: addDays(end, -(days - 1)), end, days }
}

/** The same-length window immediately before `window`, for period-over-period. */
export function previousWindow(window: DateWindow): DateWindow {
  const end = addDays(window.start, -1)
  return { start: addDays(end, -(window.days - 1)), end, days: window.days }
}

/** The `days`-long window starting the day after `asOf`, e.g. "next 90 days". */
export function forwardWindow(asOf: Date, days: number): DateWindow {
  const start = addDays(asOf, 1)
  return { start, end: addDays(start, days - 1), days }
}

export function inWindow(date: Date | null, window: DateWindow): boolean {
  if (!date) return false
  const t = startOfDay(date).getTime()
  return t >= window.start.getTime() && t <= window.end.getTime()
}

/** `YYYY-MM` bucket key. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

/** The last `count` month keys ending with the month of `asOf`, oldest first. */
export function trailingMonthKeys(asOf: Date, count: number): string[] {
  const keys: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(asOf.getFullYear(), asOf.getMonth() - i, 1)))
  }
  return keys
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2026-03" → "Mar 2026" (or "Mar" when short). Returns the input if malformed. */
export function formatMonthKey(key: string, short = false): string {
  const m = /^(\d{4})-(\d{2})$/.exec(key)
  if (!m) return key
  const label = MONTHS[Number(m[2]) - 1]
  if (!label) return key
  return short ? label : `${label} ${m[1]}`
}

export function toISODate(date: Date): string {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, "0")}`
}
