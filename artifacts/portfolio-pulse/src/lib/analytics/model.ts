/**
 * Builds the portfolio model once from the raw source modules. This is the only
 * analytics file that imports the data; everything else is pure and testable.
 */
import {
  DATA_AS_OF,
  complianceEvents,
  financials,
  getNegativeNOIProperties,
  properties,
  units as rawUnits,
} from "../mock-data"
import { monthKey, previousWindow, trailingWindow } from "./dates"
import { groupBy } from "./dedupe"
import { generateExceptions, summarizeRules } from "./exceptions"
import {
  buildPhysicalUnits,
  checkCounts,
  confidenceBreakdown,
  reconcileProperty,
  statusFunnel,
} from "./inventory"
import { economicOccupancyByMonth, gprReconciliation } from "./leasing"
import { REQUIRED_LISTING_FIELDS, computeListingMetrics, type ListingSource } from "./listings"
import type { PhysicalUnit } from "./inventory"

/**
 * No listing feed is connected. Swap this for
 * `{ status: "connected", name, events }` once one is available; every listing
 * metric, exception rule and chart is already wired to compute from it.
 */
export const LISTING_SOURCE: ListingSource = { status: "not-connected", requiredFields: REQUIRED_LISTING_FIELDS }

function build() {
  const asOf = DATA_AS_OF
  const units = buildPhysicalUnits(rawUnits, properties, asOf)
  const unitsByProperty = groupBy(units, (u) => u.propertyId)
  const reconciliations = properties.map((p) => reconcileProperty(p, unitsByProperty.get(p.id) ?? []))

  const lastMonth = monthKey(new Date(asOf.getFullYear(), asOf.getMonth() - 1, 1))
  const noiShortfalls = getNegativeNOIProperties().map((n) => ({
    propertyId: n.property.id,
    variance: n.variance,
    variancePct: n.variancePct,
    month: lastMonth,
  }))

  const exceptions = generateExceptions({
    asOf,
    properties,
    units,
    reconciliations,
    complianceEvents,
    noiShortfalls,
    listingSource: LISTING_SOURCE,
  })

  return {
    asOf,
    /** When the app assembled the model (mock data is generated at load). */
    loadedAt: new Date(),
    properties,
    units,
    unitsByProperty,
    reconciliations,
    reconciliationByProperty: new Map(reconciliations.map((r) => [r.propertyId, r])),
    funnel: statusFunnel(units),
    confidence: confidenceBreakdown(units),
    checks: checkCounts(units),
    economicOccupancy: economicOccupancyByMonth(financials),
    gpr: gprReconciliation(financials, units),
    complianceEvents,
    financials,
    listingSource: LISTING_SOURCE,
    exceptions,
    ruleSummary: summarizeRules(exceptions, LISTING_SOURCE),
  }
}

export type PortfolioModel = ReturnType<typeof build>

let cached: PortfolioModel | null = null

export function getPortfolioModel(): PortfolioModel {
  cached ??= build()
  return cached
}

/** Listing metrics for a unit subset and window, or null when no feed is connected. */
export function listingMetricsFor(model: PortfolioModel, units: readonly PhysicalUnit[], windowDays: number) {
  if (model.listingSource.status !== "connected") return null
  const window = trailingWindow(model.asOf, windowDays)
  return computeListingMetrics(model.listingSource.events, units, model.asOf, window, previousWindow(window))
}
