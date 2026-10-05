/**
 * Physical-unit inventory: one record per apartment, sourced from the rent roll.
 *
 * This module normalizes rent-roll rows, runs record-level checks, assigns a
 * rule-based *record confidence* tier, and reconciles the rent roll against
 * property-level fields. It deliberately knows nothing about listings — a
 * physical unit exists whether or not it is being advertised.
 */
import type { Property, Unit } from "../mock-data"
import { parseDate, isAfterDay, type DateInput } from "./dates"
import { findDuplicates } from "./dedupe"
import { safeDivide, mean } from "./format"
import { normalizeEnum, normalizeNumber, normalizeText } from "./normalize"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export const UNIT_STATUSES = ["occupied", "notice", "vacant"] as const
export type UnitStatus = (typeof UNIT_STATUSES)[number]

export type ConfidenceTier = "high" | "medium" | "low" | "unresolved"
export const CONFIDENCE_TIERS: ConfidenceTier[] = ["high", "medium", "low", "unresolved"]

/** Configurable thresholds for record checks. Documented on the Methodology page. */
export const INVENTORY_RULES = {
  /** In-place rent below this share of the AMI limit is flagged as implausibly low. */
  lowRentRatio: 0.5,
  /** Bedroom counts outside this range are treated as invalid. */
  maxBedrooms: 6,
  /** Reported vs rent-roll occupancy gap (absolute, as a share) that triggers a flag. */
  occupancyGapThreshold: 0.02,
} as const

export type UnitCheckId =
  // Critical identifiers → "unresolved": the record can't be tied to a physical unit.
  | "missing-unit-id"
  | "duplicate-unit-id"
  | "unknown-property"
  | "missing-status"
  // Contradictions between fields → "low".
  | "occupied-missing-rent"
  | "occupied-missing-tenant"
  | "vacant-with-tenant"
  | "invalid-lease-dates"
  | "future-lease-start"
  | "ami-tier-not-in-set-asides"
  // Incomplete or stale but not contradictory → "medium".
  | "missing-bedrooms"
  | "missing-ami-tier"
  | "missing-rent-limit"
  | "expired-lease-occupied"
  | "implausible-low-rent"

export const CHECK_TIER: Record<UnitCheckId, Exclude<ConfidenceTier, "high">> = {
  "missing-unit-id": "unresolved",
  "duplicate-unit-id": "unresolved",
  "unknown-property": "unresolved",
  "missing-status": "unresolved",
  "occupied-missing-rent": "low",
  "occupied-missing-tenant": "low",
  "vacant-with-tenant": "low",
  "invalid-lease-dates": "low",
  "future-lease-start": "low",
  "ami-tier-not-in-set-asides": "low",
  "missing-bedrooms": "medium",
  "missing-ami-tier": "medium",
  "missing-rent-limit": "medium",
  "expired-lease-occupied": "medium",
  "implausible-low-rent": "medium",
}

const TIER_RANK: Record<ConfidenceTier, number> = { high: 0, medium: 1, low: 2, unresolved: 3 }

export interface PhysicalUnit {
  id: string
  propertyId: string
  unitNumber: string | null
  bedrooms: number | null
  amiTier: number | null
  status: UnitStatus | null
  hasTenant: boolean
  /** In-place rent for an occupied/notice unit; null when missing or not applicable (vacant). */
  inPlaceRent: number | null
  maxAllowableRent: number | null
  leaseStart: Date | null
  leaseEnd: Date | null
  checks: UnitCheckId[]
  confidence: ConfidenceTier
  /** In-place rent exceeds the AMI-restricted maximum (a compliance flag, not a data-quality flag). */
  overRentLimit: boolean
}

/* ------------------------------------------------------------------ */
/* Normalization + checks                                              */
/* ------------------------------------------------------------------ */

export function tierFromChecks(checks: readonly UnitCheckId[]): ConfidenceTier {
  let tier: ConfidenceTier = "high"
  for (const c of checks) {
    const t = CHECK_TIER[c]
    if (TIER_RANK[t] > TIER_RANK[tier]) tier = t
  }
  return tier
}

function setAsideTiers(property: Property | undefined): Set<number> {
  const tiers = new Set<number>()
  for (const s of property?.affordabilitySetAsides ?? []) {
    const n = normalizeNumber(String(s).replace(/%\s*AMI/i, ""), { min: 1, max: 140 })
    if (n != null) tiers.add(n)
  }
  return tiers
}

/**
 * Normalize raw rent-roll rows into physical units and run every record check.
 * `asOf` is the snapshot date used for "lease already ended" and "future start" checks.
 */
export function buildPhysicalUnits(rawUnits: readonly Unit[], properties: readonly Property[], asOf: Date): PhysicalUnit[] {
  const propertyById = new Map(properties.map((p) => [p.id, p]))

  const units = rawUnits.map((u) => {
    const status = normalizeEnum(u.occupancyStatus, UNIT_STATUSES)
    const occupiedLike = status === "occupied" || status === "notice"
    const rentValue = normalizeNumber(u.currentRent, { min: 0, zeroIsMissing: true })
    return {
      raw: u,
      unit: {
        id: u.id,
        propertyId: u.propertyId,
        unitNumber: normalizeText(u.unitNumber),
        bedrooms: normalizeNumber(u.bedrooms, { integer: true, min: 0, max: INVENTORY_RULES.maxBedrooms }),
        amiTier: normalizeNumber(u.amiTier, { min: 1, max: 140 }),
        status,
        hasTenant: normalizeText(u.tenantName) != null,
        // The source stores 0 for vacant units; that's "not applicable", not a $0 rent.
        inPlaceRent: occupiedLike ? rentValue : null,
        maxAllowableRent: normalizeNumber(u.maxAllowableRent, { min: 0, zeroIsMissing: true }),
        leaseStart: parseDate(u.leaseStartDate as DateInput),
        leaseEnd: parseDate(u.leaseEndDate as DateInput),
        checks: [] as UnitCheckId[],
        confidence: "high" as ConfidenceTier,
        overRentLimit: false,
      } satisfies PhysicalUnit,
      vacantRent: status === "vacant" ? rentValue : null,
    }
  })

  // Duplicate identifiers are only detectable across rows.
  const dupIds = new Set(
    findDuplicates(units, (x) => (x.unit.unitNumber ? `${x.unit.propertyId}::${x.unit.unitNumber}` : null))
      .flat()
      .map((x) => x.unit.id),
  )

  return units.map(({ raw, unit, vacantRent }) => {
    const checks: UnitCheckId[] = []
    const property = propertyById.get(unit.propertyId)
    const occupiedLike = unit.status === "occupied" || unit.status === "notice"

    if (!unit.unitNumber) checks.push("missing-unit-id")
    if (dupIds.has(unit.id)) checks.push("duplicate-unit-id")
    if (!property) checks.push("unknown-property")
    if (!unit.status) checks.push("missing-status")

    if (occupiedLike && unit.inPlaceRent == null) checks.push("occupied-missing-rent")
    if (occupiedLike && !unit.hasTenant) checks.push("occupied-missing-tenant")
    if (unit.status === "vacant" && (unit.hasTenant || vacantRent != null)) checks.push("vacant-with-tenant")

    const startRaw = normalizeText(raw.leaseStartDate)
    const endRaw = normalizeText(raw.leaseEndDate)
    const unparseable = (startRaw != null && !unit.leaseStart) || (endRaw != null && !unit.leaseEnd)
    const misordered = unit.leaseStart && unit.leaseEnd && unit.leaseEnd.getTime() < unit.leaseStart.getTime()
    if (unparseable || misordered) checks.push("invalid-lease-dates")
    if (occupiedLike && unit.leaseStart && isAfterDay(unit.leaseStart, asOf)) checks.push("future-lease-start")

    if (unit.amiTier == null) checks.push("missing-ami-tier")
    else if (property && !setAsideTiers(property).has(unit.amiTier)) checks.push("ami-tier-not-in-set-asides")

    if (unit.bedrooms == null) checks.push("missing-bedrooms")
    if (unit.maxAllowableRent == null) checks.push("missing-rent-limit")
    if (unit.status === "occupied" && unit.leaseEnd && !misordered && isAfterDay(asOf, unit.leaseEnd)) {
      checks.push("expired-lease-occupied")
    }
    if (
      unit.inPlaceRent != null &&
      unit.maxAllowableRent != null &&
      unit.inPlaceRent < unit.maxAllowableRent * INVENTORY_RULES.lowRentRatio
    ) {
      checks.push("implausible-low-rent")
    }

    return {
      ...unit,
      checks,
      confidence: tierFromChecks(checks),
      overRentLimit:
        unit.inPlaceRent != null && unit.maxAllowableRent != null && unit.inPlaceRent > unit.maxAllowableRent,
    }
  })
}

/* ------------------------------------------------------------------ */
/* Summaries                                                           */
/* ------------------------------------------------------------------ */

export interface StatusFunnel {
  total: number
  occupied: number
  notice: number
  vacant: number
  unclassified: number
  /** (occupied + notice) / classified units; null when nothing is classified. */
  physicalOccupancy: number | null
  /** Share of unit records with a recognized status. */
  statusCoverage: number | null
}

export function statusFunnel(units: readonly PhysicalUnit[]): StatusFunnel {
  const count = (s: UnitStatus) => units.filter((u) => u.status === s).length
  const occupied = count("occupied")
  const notice = count("notice")
  const vacant = count("vacant")
  const unclassified = units.length - occupied - notice - vacant
  const classified = units.length - unclassified
  return {
    total: units.length,
    occupied,
    notice,
    vacant,
    unclassified,
    physicalOccupancy: safeDivide(occupied + notice, classified),
    statusCoverage: safeDivide(classified, units.length),
  }
}

export function confidenceBreakdown(units: readonly PhysicalUnit[]): Record<ConfidenceTier, number> {
  const out: Record<ConfidenceTier, number> = { high: 0, medium: 0, low: 0, unresolved: 0 }
  for (const u of units) out[u.confidence]++
  return out
}

export function checkCounts(units: readonly PhysicalUnit[]): Map<UnitCheckId, PhysicalUnit[]> {
  const out = new Map<UnitCheckId, PhysicalUnit[]>()
  for (const u of units) {
    for (const c of u.checks) {
      const list = out.get(c)
      if (list) list.push(u)
      else out.set(c, [u])
    }
  }
  return out
}

export interface PropertyReconciliation {
  propertyId: string
  /** `Property.totalUnits` as declared on the property record. */
  declaredUnits: number
  /** Unit rows actually present in the rent roll. */
  rentRollUnits: number
  unitCountMatches: boolean
  /** `Property.currentOccupancyPct`, a source-provided summary field. */
  reportedOccupancy: number | null
  /** Occupancy recomputed from the rent roll. */
  rentRollOccupancy: number | null
  /** reported − rent roll, as a share (0.03 = 3 pts). */
  occupancyGap: number | null
  occupancyGapFlag: boolean
}

export function reconcileProperty(property: Property, units: readonly PhysicalUnit[]): PropertyReconciliation {
  const funnel = statusFunnel(units)
  const reported = normalizeNumber(property.currentOccupancyPct, { min: 0, max: 1 })
  const gap = reported != null && funnel.physicalOccupancy != null ? reported - funnel.physicalOccupancy : null
  return {
    propertyId: property.id,
    declaredUnits: property.totalUnits,
    rentRollUnits: units.length,
    unitCountMatches: property.totalUnits === units.length,
    reportedOccupancy: reported,
    rentRollOccupancy: funnel.physicalOccupancy,
    occupancyGap: gap,
    occupancyGapFlag: gap != null && Math.abs(gap) > INVENTORY_RULES.occupancyGapThreshold,
  }
}

export interface UnitMixRow {
  bedrooms: number | null
  label: string
  units: number
  occupied: number
  notice: number
  vacant: number
  avgInPlaceRent: number | null
  avgMaxRent: number | null
  /** Average in-place rent / AMI limit for units with both values. */
  rentToLimit: number | null
  lowOrUnresolved: number
}

export function bedroomLabel(bedrooms: number | null): string {
  if (bedrooms == null) return "Unknown"
  return bedrooms === 0 ? "Studio" : `${bedrooms} BR`
}

export function unitMix(units: readonly PhysicalUnit[]): UnitMixRow[] {
  const keys = [...new Set(units.map((u) => u.bedrooms))].sort((a, b) => (a ?? 99) - (b ?? 99))
  return keys.map((bedrooms) => {
    const group = units.filter((u) => u.bedrooms === bedrooms)
    const rents = group.map((u) => u.inPlaceRent).filter((r): r is number => r != null)
    const limits = group.map((u) => u.maxAllowableRent).filter((r): r is number => r != null)
    const ratios = group
      .filter((u) => u.inPlaceRent != null && u.maxAllowableRent != null)
      .map((u) => (u.inPlaceRent as number) / (u.maxAllowableRent as number))
    return {
      bedrooms,
      label: bedroomLabel(bedrooms),
      units: group.length,
      occupied: group.filter((u) => u.status === "occupied").length,
      notice: group.filter((u) => u.status === "notice").length,
      vacant: group.filter((u) => u.status === "vacant").length,
      avgInPlaceRent: mean(rents),
      avgMaxRent: mean(limits),
      rentToLimit: mean(ratios),
      lowOrUnresolved: group.filter((u) => u.confidence === "low" || u.confidence === "unresolved").length,
    }
  })
}
