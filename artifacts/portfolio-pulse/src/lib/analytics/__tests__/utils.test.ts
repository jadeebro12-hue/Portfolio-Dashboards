import { test } from "node:test"
import assert from "node:assert/strict"

import {
  daysBetween,
  formatMonthKey,
  inWindow,
  isValidRange,
  parseDate,
  previousWindow,
  trailingMonthKeys,
  trailingWindow,
} from "../dates"
import { dedupeBy, findDuplicates } from "../dedupe"
import { formatCount, formatCurrency, formatPct, formatPctPoints, median, safeDivide } from "../format"
import { isMissing, normalizeEnum, normalizeNumber, normalizeText } from "../normalize"

test("parseDate reads YYYY-MM-DD as a local calendar date", () => {
  const d = parseDate("2026-03-05")
  assert.ok(d)
  assert.equal(d.getFullYear(), 2026)
  assert.equal(d.getMonth(), 2)
  assert.equal(d.getDate(), 5)
})

test("parseDate rejects impossible and empty dates", () => {
  assert.equal(parseDate("2026-02-30"), null)
  assert.equal(parseDate("not a date"), null)
  assert.equal(parseDate(""), null)
  assert.equal(parseDate(null), null)
  assert.equal(parseDate(new Date("invalid")), null)
})

test("isValidRange requires both dates and start ≤ end", () => {
  assert.equal(isValidRange(parseDate("2026-01-01"), parseDate("2026-01-01")), true)
  assert.equal(isValidRange(parseDate("2026-02-01"), parseDate("2026-01-01")), false)
  assert.equal(isValidRange(null, parseDate("2026-01-01")), false)
})

test("trailing and previous windows are contiguous and inclusive", () => {
  const asOf = new Date(2026, 9, 5)
  const w = trailingWindow(asOf, 30)
  const prev = previousWindow(w)
  assert.equal(daysBetween(w.start, w.end), 29)
  assert.equal(daysBetween(prev.end, w.start), 1)
  assert.equal(daysBetween(prev.start, prev.end), 29)
  assert.equal(inWindow(asOf, w), true)
  assert.equal(inWindow(w.start, w), true)
  assert.equal(inWindow(prev.end, w), false)
  assert.equal(inWindow(null, w), false)
})

test("trailingMonthKeys handles year boundaries", () => {
  assert.deepEqual(trailingMonthKeys(new Date(2026, 1, 10), 3), ["2025-12", "2026-01", "2026-02"])
  assert.equal(formatMonthKey("2026-03"), "Mar 2026")
  assert.equal(formatMonthKey("2026-03", true), "Mar")
  assert.equal(formatMonthKey("garbage"), "garbage")
})

test("normalizers turn placeholder values into null", () => {
  assert.equal(normalizeText("  "), null)
  assert.equal(normalizeText("N/A"), null)
  assert.equal(normalizeText(" 101 "), "101")
  assert.equal(normalizeNumber("1,200"), null) // ambiguous formatting isn't guessed
  assert.equal(normalizeNumber("1200"), 1200)
  assert.equal(normalizeNumber(0, { zeroIsMissing: true }), null)
  assert.equal(normalizeNumber(2.5, { integer: true }), null)
  assert.equal(normalizeNumber(9, { max: 6 }), null)
  assert.equal(normalizeEnum("Occupied", ["occupied", "vacant"] as const), "occupied")
  assert.equal(normalizeEnum("leased", ["occupied", "vacant"] as const), null)
  assert.equal(isMissing(NaN), true)
  assert.equal(isMissing(0), false)
})

test("dedupeBy keeps the preferred record and never merges null keys", () => {
  const rows = [
    { id: "a", v: 1 },
    { id: "a", v: 2 },
    { id: null, v: 3 },
    { id: null, v: 4 },
  ]
  const out = dedupeBy(rows, (r) => r.id, (cur, next) => (next.v > cur.v ? next : cur))
  assert.deepEqual(out.map((r) => r.v).sort(), [2, 3, 4])
  assert.equal(findDuplicates(rows, (r) => r.id).length, 1)
})

test("safe math and formatting never fabricate values", () => {
  assert.equal(safeDivide(1, 0), null)
  assert.equal(safeDivide(null, 5), null)
  assert.equal(safeDivide(1, 4), 0.25)
  assert.equal(median([]), null)
  assert.equal(median([3, 1, 2, 10]), 2.5)
  assert.equal(formatPct(null), "N/A")
  assert.equal(formatPct(0.9473), "94.7%")
  assert.equal(formatCount(null), "N/A")
  assert.equal(formatCurrency(Number.NaN), "N/A")
  assert.equal(formatPctPoints(-0.048), "−4.8 pts")
})
