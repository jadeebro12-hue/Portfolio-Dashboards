import { test } from "node:test"
import assert from "node:assert/strict"

import type { FinancialRecord, Property, Unit } from "../../mock-data"
import { buildPhysicalUnits, reconcileProperty, statusFunnel, tierFromChecks, unitMix } from "../inventory"
import { economicOccupancyByMonth, expirationSchedule, gprReconciliation, leaseStartsInWindow } from "../leasing"
import { trailingWindow } from "../dates"

const asOf = new Date(2026, 9, 5)

const property: Property = {
  id: "p1",
  name: "Test Commons",
  address: "1 Main St",
  city: "Portland",
  state: "OR",
  totalUnits: 3,
  fundingSources: ["9% LIHTC"],
  placedInServiceDate: "2015-01-01",
  compliancePeriodEndDate: "2030-12-31",
  affordabilitySetAsides: ["60% AMI", "50% AMI"],
  currentOccupancyPct: 1,
  statusHealthScore: 90,
}

const unit = (over: Partial<Unit>): Unit => ({
  id: "u1",
  propertyId: "p1",
  unitNumber: "101",
  bedrooms: 1,
  amiTier: 60,
  currentRent: 1000,
  maxAllowableRent: 1100,
  occupancyStatus: "occupied",
  tenantName: "A Resident",
  leaseStartDate: "2026-01-01",
  leaseEndDate: "2026-12-31",
  ...over,
})

test("a clean occupied unit is High confidence", () => {
  const [u] = buildPhysicalUnits([unit({})], [property], asOf)
  assert.deepEqual(u.checks, [])
  assert.equal(u.confidence, "high")
  assert.equal(u.overRentLimit, false)
})

test("vacant $0 rent is 'not applicable', not a missing-rent error", () => {
  const [u] = buildPhysicalUnits(
    [unit({ occupancyStatus: "vacant", currentRent: 0, tenantName: null, leaseStartDate: null, leaseEndDate: null })],
    [property],
    asOf,
  )
  assert.equal(u.inPlaceRent, null)
  assert.equal(u.confidence, "high")
})

test("contradictions and identifier problems lower confidence", () => {
  const units = buildPhysicalUnits(
    [
      unit({ id: "a", currentRent: 0 }), // leased, no rent → low
      unit({ id: "b", unitNumber: "102", leaseStartDate: "2026-05-01", leaseEndDate: "2026-04-01" }), // misordered → low
      unit({ id: "c", unitNumber: "103", leaseEndDate: "2026-09-01" }), // expired, still occupied → medium
      unit({ id: "d", unitNumber: "103" }), // duplicate id → unresolved
      unit({ id: "e", unitNumber: "104", occupancyStatus: "leased" as Unit["occupancyStatus"] }), // unknown status → unresolved
      unit({ id: "f", unitNumber: "105", amiTier: 80 }), // not a set-aside → low
    ],
    [property],
    asOf,
  )
  const byId = Object.fromEntries(units.map((u) => [u.id, u]))
  assert.ok(byId.a.checks.includes("occupied-missing-rent"))
  assert.equal(byId.a.confidence, "low")
  assert.ok(byId.b.checks.includes("invalid-lease-dates"))
  assert.equal(byId.c.confidence, "unresolved") // shares "103" with d
  assert.ok(byId.c.checks.includes("expired-lease-occupied"))
  assert.equal(byId.d.confidence, "unresolved")
  assert.ok(byId.e.checks.includes("missing-status"))
  assert.ok(byId.f.checks.includes("ami-tier-not-in-set-asides"))
})

test("tier is the worst failing check", () => {
  assert.equal(tierFromChecks([]), "high")
  assert.equal(tierFromChecks(["expired-lease-occupied", "invalid-lease-dates"]), "low")
  assert.equal(tierFromChecks(["missing-bedrooms", "missing-unit-id"]), "unresolved")
})

test("rent above the AMI limit is a compliance flag, not a confidence downgrade", () => {
  const [u] = buildPhysicalUnits([unit({ currentRent: 1200 })], [property], asOf)
  assert.equal(u.overRentLimit, true)
  assert.equal(u.confidence, "high")
})

test("funnel counts notice as occupied and keeps unclassified units out of the rate", () => {
  const units = buildPhysicalUnits(
    [
      unit({ id: "a" }),
      unit({ id: "b", unitNumber: "102", occupancyStatus: "notice" }),
      unit({ id: "c", unitNumber: "103", occupancyStatus: "vacant", currentRent: 0, tenantName: null }),
      unit({ id: "d", unitNumber: "104", occupancyStatus: "" as Unit["occupancyStatus"] }),
    ],
    [property],
    asOf,
  )
  const f = statusFunnel(units)
  assert.equal(f.unclassified, 1)
  assert.equal(f.physicalOccupancy, 2 / 3)
  assert.equal(f.statusCoverage, 3 / 4)
  assert.equal(statusFunnel([]).physicalOccupancy, null) // no divide-by-zero
})

test("reconciliation compares declared vs rent-roll units and occupancy", () => {
  const units = buildPhysicalUnits([unit({ id: "a" }), unit({ id: "b", unitNumber: "102", occupancyStatus: "vacant", currentRent: 0, tenantName: null })], [property], asOf)
  const r = reconcileProperty(property, units)
  assert.equal(r.unitCountMatches, false) // declared 3, rent roll 2
  assert.equal(r.rentRollOccupancy, 0.5)
  assert.equal(r.occupancyGap, 0.5)
  assert.equal(r.occupancyGapFlag, true)
})

test("unit mix groups by bedrooms and averages only real rents", () => {
  const units = buildPhysicalUnits(
    [unit({ id: "a", bedrooms: 0 }), unit({ id: "b", unitNumber: "102", bedrooms: 0, occupancyStatus: "vacant", currentRent: 0, tenantName: null })],
    [property],
    asOf,
  )
  const [row] = unitMix(units)
  assert.equal(row.label, "Studio")
  assert.equal(row.units, 2)
  assert.equal(row.avgInPlaceRent, 1000)
})

test("lease activity excludes invalid and future dates", () => {
  const units = buildPhysicalUnits(
    [
      unit({ id: "a", leaseStartDate: "2026-09-20" }),
      unit({ id: "b", unitNumber: "102", leaseStartDate: "2026-11-01" }), // future
      unit({ id: "c", unitNumber: "103", leaseStartDate: "2026-09-25", leaseEndDate: "2026-09-01" }), // misordered
    ],
    [property],
    asOf,
  )
  assert.equal(leaseStartsInWindow(units, trailingWindow(asOf, 30), asOf), 1)
  const expired = expirationSchedule(units, asOf).find((b) => b.key === "expired")
  assert.equal(expired?.count, 0)
})

test("economic occupancy and GPR reconciliation", () => {
  const fin = (month: string, rent: number, vac: number): FinancialRecord => ({
    id: month,
    propertyId: "p1",
    month,
    rentalIncome: { actual: rent, budget: rent },
    vacancyLoss: { actual: vac, budget: vac },
    otherIncome: { actual: 0, budget: 0 },
    operatingExpenses: { actual: 0, budget: 0 },
    debtService: { actual: 0, budget: 0 },
    reserveDeposit: { actual: 0, budget: 0 },
  })
  const points = economicOccupancyByMonth([fin("2026-01", 950, 50), fin("2026-02", 0, 0)])
  assert.equal(points[0].economicOccupancy, 0.95)
  assert.equal(points[1].economicOccupancy, null)
  const units = buildPhysicalUnits([unit({ maxAllowableRent: 1000 })], [property], asOf)
  const r = gprReconciliation([fin("2026-01", 950, 50), fin("2026-02", 900, 50)], units)
  assert.equal(r.recordsChecked, 2)
  assert.equal(r.recordsMatching, 1)
})
