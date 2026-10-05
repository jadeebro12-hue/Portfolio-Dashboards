/**
 * Leasing activity derived from the rent roll, plus economic occupancy from
 * monthly financials.
 *
 * Important limitation: the rent roll holds only *current* leases. Lease starts
 * are therefore "current residents by move-in month" — earlier months are
 * undercounted because residents who already moved out are not in the data.
 */
import type { FinancialRecord } from "../mock-data"
import {
  daysBetween,
  forwardWindow,
  inWindow,
  isAfterDay,
  monthKey,
  trailingMonthKeys,
  type DateWindow,
} from "./dates"
import { safeDivide } from "./format"
import type { PhysicalUnit } from "./inventory"

const isLeased = (u: PhysicalUnit) => u.status === "occupied" || u.status === "notice"

/** Lease start dates usable for activity metrics: valid, not in the future, end ≥ start. */
function usableStart(u: PhysicalUnit, asOf: Date): Date | null {
  if (!u.leaseStart || isAfterDay(u.leaseStart, asOf)) return null
  if (u.leaseEnd && u.leaseEnd < u.leaseStart) return null
  return u.leaseStart
}

export function leaseStartsInWindow(units: readonly PhysicalUnit[], window: DateWindow, asOf: Date): number {
  return units.filter((u) => isLeased(u) && inWindow(usableStart(u, asOf), window)).length
}

export interface MonthCount {
  month: string
  count: number
}

/** Current leases by start month for the trailing `months` months. */
export function leaseStartsByMonth(units: readonly PhysicalUnit[], asOf: Date, months = 12): MonthCount[] {
  const keys = trailingMonthKeys(asOf, months)
  const counts = new Map(keys.map((k) => [k, 0]))
  for (const u of units) {
    if (!isLeased(u)) continue
    const start = usableStart(u, asOf)
    if (!start) continue
    const k = monthKey(start)
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return keys.map((month) => ({ month, count: counts.get(month) ?? 0 }))
}

export interface ExpirationBucket {
  key: string
  label: string
  count: number
  tone: "critical" | "warning" | "neutral"
}

/**
 * Lease expiration schedule for leased units with a valid end date.
 * "Expired" means the lease end is in the past while the unit is still leased.
 */
export function expirationSchedule(units: readonly PhysicalUnit[], asOf: Date): ExpirationBucket[] {
  const buckets: ExpirationBucket[] = [
    { key: "expired", label: "Already expired", count: 0, tone: "critical" },
    { key: "0-30", label: "Next 30 days", count: 0, tone: "warning" },
    { key: "31-60", label: "31–60 days", count: 0, tone: "warning" },
    { key: "61-90", label: "61–90 days", count: 0, tone: "neutral" },
    { key: "91-180", label: "91–180 days", count: 0, tone: "neutral" },
    { key: "181+", label: "181+ days", count: 0, tone: "neutral" },
  ]
  for (const u of units) {
    if (!isLeased(u) || !u.leaseEnd) continue
    if (u.leaseStart && u.leaseEnd < u.leaseStart) continue
    const d = daysBetween(asOf, u.leaseEnd)
    const idx = d < 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : d <= 90 ? 3 : d <= 180 ? 4 : 5
    buckets[idx].count++
  }
  return buckets
}

export function expiringWithin(units: readonly PhysicalUnit[], asOf: Date, days: number): number {
  const w = forwardWindow(asOf, days)
  return units.filter((u) => isLeased(u) && inWindow(u.leaseEnd, w)).length
}

/* ------------------------------------------------------------------ */
/* Economic occupancy + GPR reconciliation (financials)                */
/* ------------------------------------------------------------------ */

export interface EconomicOccupancyPoint {
  month: string
  /** rentalIncome.actual / (rentalIncome.actual + vacancyLoss.actual). */
  economicOccupancy: number | null
  /** Same ratio using budget figures. */
  budgetEconomicOccupancy: number | null
  properties: number
}

/**
 * Economic occupancy by month: rent earned as a share of gross potential rent.
 * Assumes `rentalIncome` is net of vacancy, so GPR = rentalIncome + vacancyLoss.
 * `gprReconciliation` tests that assumption against the rent roll.
 */
export function economicOccupancyByMonth(financials: readonly FinancialRecord[]): EconomicOccupancyPoint[] {
  const months = [...new Set(financials.map((f) => f.month))].sort()
  return months.map((month) => {
    const rows = financials.filter((f) => f.month === month)
    const sum = (pick: (f: FinancialRecord) => number) => rows.reduce((a, f) => a + (Number.isFinite(pick(f)) ? pick(f) : 0), 0)
    const rent = sum((f) => f.rentalIncome.actual)
    const vac = sum((f) => f.vacancyLoss.actual)
    const rentB = sum((f) => f.rentalIncome.budget)
    const vacB = sum((f) => f.vacancyLoss.budget)
    return {
      month,
      economicOccupancy: safeDivide(rent, rent + vac),
      budgetEconomicOccupancy: safeDivide(rentB, rentB + vacB),
      properties: rows.length,
    }
  })
}

export interface GprReconciliation {
  recordsChecked: number
  /** Records where rentalIncome + vacancyLoss is within tolerance of rent-roll GPR. */
  recordsMatching: number
  matchRate: number | null
  tolerance: number
}

/**
 * Checks the field-semantics assumption behind economic occupancy: for each
 * property-month, does rentalIncome.actual + vacancyLoss.actual equal the
 * rent roll's gross potential rent (sum of AMI-limit rents)?
 */
export function gprReconciliation(
  financials: readonly FinancialRecord[],
  units: readonly PhysicalUnit[],
  tolerance = 0.005,
): GprReconciliation {
  const gprByProperty = new Map<string, number>()
  for (const u of units) {
    if (u.maxAllowableRent == null) continue
    gprByProperty.set(u.propertyId, (gprByProperty.get(u.propertyId) ?? 0) + u.maxAllowableRent)
  }
  let checked = 0
  let matching = 0
  for (const f of financials) {
    const gpr = gprByProperty.get(f.propertyId)
    if (!gpr) continue
    checked++
    const implied = f.rentalIncome.actual + f.vacancyLoss.actual
    if (Math.abs(implied - gpr) / gpr <= tolerance) matching++
  }
  return { recordsChecked: checked, recordsMatching: matching, matchRate: safeDivide(matching, checked), tolerance }
}
