import { test } from "node:test"
import assert from "node:assert/strict"

import type { Property, Unit } from "../../mock-data"
import { previousWindow, trailingWindow } from "../dates"
import { exceptionsToCsv, generateExceptions, summarizeRules, type ExceptionInputs } from "../exceptions"
import { buildPhysicalUnits, reconcileProperty } from "../inventory"
import { computeListingMetrics, dedupeListings, mappingTier, type ListingEvent } from "../listings"

const asOf = new Date(2026, 9, 5)
const window = trailingWindow(asOf, 30)

const property: Property = {
  id: "p1", name: "Test Commons", address: "1 Main St", city: "Portland", state: "OR", totalUnits: 2,
  fundingSources: ["9% LIHTC"], placedInServiceDate: "2005-01-01", compliancePeriodEndDate: "2020-12-31",
  affordabilitySetAsides: ["60% AMI"], currentOccupancyPct: 1, statusHealthScore: 90,
}
const rawUnits: Unit[] = [
  { id: "u1", propertyId: "p1", unitNumber: "101", bedrooms: 1, amiTier: 60, currentRent: 1200, maxAllowableRent: 1100, occupancyStatus: "occupied", tenantName: "A", leaseStartDate: "2026-01-01", leaseEndDate: "2026-12-31" },
  { id: "u2", propertyId: "p1", unitNumber: "102", bedrooms: 2, amiTier: 60, currentRent: 0, maxAllowableRent: 1300, occupancyStatus: "vacant", tenantName: null, leaseStartDate: null, leaseEndDate: null },
]
const units = buildPhysicalUnits(rawUnits, [property], asOf)

const ev = (over: Partial<ListingEvent>): ListingEvent => ({
  listingId: "L1", source: "ILS", propertyId: "p1", unitId: "u2", advertisedUnit: "102", status: "active",
  listedAt: "2026-09-20", delistedAt: null, lastSeenAt: "2026-10-04", askingRent: 1250, bedrooms: 2, matchScore: 0.95,
  ...over,
})

test("mapping tiers follow the documented score bands", () => {
  assert.equal(mappingTier(ev({ matchScore: 0.95 })), "high")
  assert.equal(mappingTier(ev({ matchScore: 0.75 })), "medium")
  assert.equal(mappingTier(ev({ matchScore: 0.4 })), "low")
  assert.equal(mappingTier(ev({ unitId: null })), "unresolved")
  assert.equal(mappingTier(ev({ matchScore: null })), "unresolved")
})

test("repeated snapshots of a listing collapse to the latest", () => {
  const out = dedupeListings([ev({ lastSeenAt: "2026-10-01", askingRent: 1200 }), ev({ lastSeenAt: "2026-10-04", askingRent: 1250 })])
  assert.equal(out.length, 1)
  assert.equal(out[0].askingRent, 1250)
})

test("listing metrics separate listings from units and exclude bad dates", () => {
  const events = [
    ev({}),
    ev({ listingId: "L1", lastSeenAt: "2026-10-01" }), // duplicate snapshot
    ev({ listingId: "L2", source: "Website" }), // second active listing, same unit
    ev({ listingId: "L3", unitId: null, advertisedUnit: "Apt 9" }), // unmatched
    ev({ listingId: "L4", unitId: "u1", matchScore: 0.5, lastSeenAt: "2026-09-01" }), // low + stale
    ev({ listingId: "L5", status: "removed", listedAt: "2026-09-10", delistedAt: "2026-09-30" }),
    ev({ listingId: "L6", status: "removed", listedAt: "2026-12-01" }), // future → invalid
    ev({ listingId: "L7", status: "removed", listedAt: "2026-09-10", delistedAt: "2026-09-01" }), // misordered
  ]
  const m = computeListingMetrics(events, units, asOf, window, previousWindow(window))
  assert.equal(m.rawRecords, 8)
  assert.equal(m.duplicateRecords, 1)
  assert.equal(m.activeListings, 4)
  assert.equal(m.uniqueUnitsWithActive, 2)
  assert.equal(m.unitsWithMultipleActive, 1)
  assert.equal(m.unmatchedActive, 1)
  assert.equal(m.lowConfidenceActive, 1)
  assert.equal(m.mappingCoverage, 3 / 4)
  assert.equal(m.staleActive, 1)
  assert.equal(m.invalidDateRecords, 2)
  assert.equal(m.delistedInWindow, 1)
  assert.equal(m.newInWindow, 5) // L1, L2, L3, L4, L5 (L6 future, L7 invalid)
})

test("listing metrics handle an empty feed without dividing by zero", () => {
  const m = computeListingMetrics([], units, asOf, window, previousWindow(window))
  assert.equal(m.activeListings, 0)
  assert.equal(m.mappingCoverage, null)
  assert.equal(m.medianListingAgeDays, null)
})

const baseInputs = (): ExceptionInputs => ({
  asOf,
  properties: [property],
  units,
  reconciliations: [reconcileProperty(property, units)],
  complianceEvents: [
    { id: "c1", propertyId: "p1", eventType: "HUD REAC Inspection", dueDate: "2026-09-30", status: "overdue" },
    { id: "c2", propertyId: "p1", eventType: "Physical Inspection", dueDate: "2026-11-30", status: "upcoming" },
  ],
  noiShortfalls: [],
  listingSource: { status: "not-connected", requiredFields: [] },
})

test("exceptions are generated from real fields and sorted by severity", () => {
  const rows = generateExceptions(baseInputs())
  const rules = rows.map((r) => r.rule)
  assert.ok(rules.includes("rent-over-limit"))
  assert.ok(rules.includes("compliance-overdue"))
  assert.ok(rules.includes("occupancy-gap")) // reported 100% vs rent roll 50%
  assert.ok(rules.includes("compliance-period-ended"))
  assert.ok(!rules.includes("compliance-due-this-week"))
  assert.equal(rows[0].severity, "high")
  assert.equal(rows.at(-1)?.severity, "low")
})

test("listing rules are reported as not evaluated without a feed", () => {
  const rows = generateExceptions(baseInputs())
  const summary = summarizeRules(rows, { status: "not-connected", requiredFields: [] })
  const unmatched = summary.find((s) => s.rule.id === "unmatched-listing")
  assert.equal(unmatched?.notEvaluatedReason, "No listing feed is connected.")
  assert.equal(summary.find((s) => s.rule.id === "rent-over-limit")?.notEvaluatedReason, null)
})

test("listing exceptions appear once a feed is connected", () => {
  const rows = generateExceptions({
    ...baseInputs(),
    listingSource: { status: "connected", name: "fixture", events: [ev({}), ev({ listingId: "L2" }), ev({ listingId: "L3", unitId: null }), ev({ listingId: "L4", bedrooms: 3 })] },
  })
  const rules = new Set(rows.map((r) => r.rule))
  assert.ok(rules.has("unmatched-listing"))
  assert.ok(rules.has("multiple-active-listings"))
  assert.ok(rules.has("bedroom-conflict"))
})

test("CSV export escapes quotes and has a header row", () => {
  const csv = exceptionsToCsv(generateExceptions(baseInputs()))
  const lines = csv.split("\r\n")
  assert.match(lines[0], /^"Severity","Exception"/)
  assert.ok(lines.length > 1)
  assert.equal(exceptionsToCsv([]).split("\r\n").length, 1)
})
