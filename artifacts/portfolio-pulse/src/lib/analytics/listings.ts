/**
 * Listing events: time-varying marketing records (ILS posts, website listings)
 * that may be created, updated, duplicated, relisted or removed. They are
 * modeled separately from physical units because a unit can have zero, one or
 * several listings, and a listing may not map to any known unit.
 *
 * Portfolio Pulse has NO listing feed connected today. Everything here is
 * implemented and unit-tested against fixtures so the dashboard is ready for a
 * feed, but the app passes `{ status: "not-connected" }` and every listing
 * metric renders as "N/A" with the fields it needs.
 */
import { daysBetween, inWindow, isAfterDay, parseDate, type DateWindow } from "./dates"
import { dedupeBy, groupBy } from "./dedupe"
import { median, safeDivide } from "./format"
import type { ConfidenceTier, PhysicalUnit } from "./inventory"

export interface ListingEvent {
  /** Source system's listing identifier. */
  listingId: string | null
  source: string | null
  propertyId: string | null
  /** Resolved physical unit id (`Unit.id`), if entity resolution found a match. */
  unitId: string | null
  /** Unit number exactly as advertised (e.g. "Apt 2B"), before resolution. */
  advertisedUnit: string | null
  status: "active" | "inactive" | "removed" | null
  listedAt: string | null
  delistedAt: string | null
  /** When the listing was last observed in the source. */
  lastSeenAt: string | null
  askingRent: number | null
  bedrooms: number | null
  /** Entity-resolution match score in [0, 1]. */
  matchScore: number | null
}

export type ListingSource =
  | { status: "not-connected"; requiredFields: readonly string[] }
  | { status: "connected"; name: string; events: readonly ListingEvent[] }

/** Fields a listing feed must provide for the listing metrics to compute. */
export const REQUIRED_LISTING_FIELDS = [
  "listing_id",
  "property_id",
  "unit_id or advertised unit number",
  "listing_status (active / inactive / removed)",
  "listed_at",
  "delisted_at",
  "last_seen_at",
  "asking_rent",
  "bedrooms / bathrooms",
  "match_score (entity-resolution confidence, 0–1)",
] as const

export const LISTING_RULES = {
  /** Match score bands for mapping-confidence tiers. */
  highMatch: 0.9,
  mediumMatch: 0.7,
  /** An active listing not seen in the source for this many days is stale. */
  staleDays: 14,
  /** An active listing older than this is flagged as aged inventory. */
  agedListingDays: 60,
} as const

export function mappingTier(event: ListingEvent): ConfidenceTier {
  if (!event.unitId || event.matchScore == null) return "unresolved"
  if (event.matchScore >= LISTING_RULES.highMatch) return "high"
  if (event.matchScore >= LISTING_RULES.mediumMatch) return "medium"
  return "low"
}

/** Collapse repeated snapshots of the same listing id, keeping the most recently seen. */
export function dedupeListings(events: readonly ListingEvent[]): ListingEvent[] {
  return dedupeBy(
    events,
    (e) => e.listingId,
    (a, b) => {
      const ta = parseDate(a.lastSeenAt)?.getTime() ?? -Infinity
      const tb = parseDate(b.lastSeenAt)?.getTime() ?? -Infinity
      return tb >= ta ? b : a
    },
  )
}

export interface ListingMetrics {
  /** Raw rows before de-duplication. */
  rawRecords: number
  duplicateRecords: number
  /** De-duplicated listings with status "active". */
  activeListings: number
  /** Distinct physical units with ≥1 active, mapped listing. */
  uniqueUnitsWithActive: number
  /** Physical units with more than one active listing (double-posting). */
  unitsWithMultipleActive: number
  /** Active listings with no resolved unit, or a unit id not in the rent roll. */
  unmatchedActive: number
  lowConfidenceActive: number
  /** Mapped active listings / active listings. */
  mappingCoverage: number | null
  tiers: Record<ConfidenceTier, number>
  newInWindow: number
  newInPreviousWindow: number
  delistedInWindow: number
  /** Median days since listed, for active listings with a valid list date. */
  medianListingAgeDays: number | null
  staleActive: number
  /** Listings excluded from date metrics because of invalid or future dates. */
  invalidDateRecords: number
}

export function computeListingMetrics(
  events: readonly ListingEvent[],
  units: readonly PhysicalUnit[],
  asOf: Date,
  window: DateWindow,
  previous: DateWindow,
): ListingMetrics {
  const unitIds = new Set(units.map((u) => u.id))
  const deduped = dedupeListings(events)
  const active = deduped.filter((e) => e.status === "active")

  const isMapped = (e: ListingEvent) => e.unitId != null && unitIds.has(e.unitId)
  const mapped = active.filter(isMapped)
  const byUnit = groupBy(mapped, (e) => e.unitId)

  const tiers: Record<ConfidenceTier, number> = { high: 0, medium: 0, low: 0, unresolved: 0 }
  for (const e of active) tiers[isMapped(e) ? mappingTier(e) : "unresolved"]++

  // Date hygiene: a listing is only used for date metrics if its dates parse,
  // are not in the future, and delisted ≥ listed.
  let invalidDateRecords = 0
  const validListed = (e: ListingEvent): Date | null => {
    const listed = parseDate(e.listedAt)
    const delisted = parseDate(e.delistedAt)
    const bad =
      (e.listedAt != null && !listed) ||
      (listed != null && isAfterDay(listed, asOf)) ||
      (listed != null && delisted != null && delisted < listed)
    if (bad) {
      invalidDateRecords++
      return null
    }
    return listed
  }
  const listedDates = new Map(deduped.map((e) => [e, validListed(e)]))

  const ages = active
    .map((e) => listedDates.get(e))
    .filter((d): d is Date => d != null)
    .map((d) => daysBetween(d, asOf))

  const staleActive = active.filter((e) => {
    const seen = parseDate(e.lastSeenAt)
    return seen != null && daysBetween(seen, asOf) > LISTING_RULES.staleDays
  }).length

  return {
    rawRecords: events.length,
    duplicateRecords: events.length - deduped.length,
    activeListings: active.length,
    uniqueUnitsWithActive: byUnit.size,
    unitsWithMultipleActive: [...byUnit.values()].filter((g) => g.length > 1).length,
    unmatchedActive: active.length - mapped.length,
    lowConfidenceActive: tiers.low,
    mappingCoverage: safeDivide(mapped.length, active.length),
    tiers,
    newInWindow: deduped.filter((e) => inWindow(listedDates.get(e) ?? null, window)).length,
    newInPreviousWindow: deduped.filter((e) => inWindow(listedDates.get(e) ?? null, previous)).length,
    delistedInWindow: deduped.filter((e) => listedDates.get(e) != null && inWindow(parseDate(e.delistedAt), window)).length,
    medianListingAgeDays: median(ages),
    staleActive,
    invalidDateRecords,
  }
}
