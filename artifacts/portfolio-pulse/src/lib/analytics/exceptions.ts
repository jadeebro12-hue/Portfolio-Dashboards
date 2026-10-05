/**
 * Exception (action-queue) generation. Each rule is registered once with its
 * severity, data source, plain-English reason and the operational follow-up it
 * implies. Rules whose inputs don't exist in the current dataset are still
 * listed, marked "not evaluated" with the reason, so a clean queue is never
 * mistaken for a clean portfolio.
 */
import type { ComplianceEvent, Property } from "../mock-data"
import { daysBetween, isAfterDay, parseDate, toISODate } from "./dates"
import { findDuplicates, groupBy } from "./dedupe"
import { formatCurrency, formatPct, formatPctPoints } from "./format"
import { bedroomLabel, type ConfidenceTier, type PhysicalUnit, type PropertyReconciliation, type UnitCheckId } from "./inventory"
import { LISTING_RULES, dedupeListings, mappingTier, type ListingSource } from "./listings"

export type Severity = "high" | "medium" | "low"
export const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 }

export type DataSourceId = "rent-roll" | "property-record" | "financials" | "compliance" | "listings"

export const DATA_SOURCE_LABEL: Record<DataSourceId, string> = {
  "rent-roll": "Rent roll (physical units)",
  "property-record": "Property records",
  financials: "Monthly financials",
  compliance: "Compliance calendar",
  listings: "Listing feed",
}

export type RuleId =
  | UnitCheckId
  | "rent-over-limit"
  | "notice-upcoming-vacancy"
  | "unit-count-mismatch"
  | "occupancy-gap"
  | "noi-shortfall"
  | "compliance-overdue"
  | "compliance-due-this-week"
  | "compliance-period-ended"
  | "unmatched-listing"
  | "low-confidence-mapping"
  | "multiple-active-listings"
  | "stale-active-listing"
  | "duplicate-listing-records"
  | "missing-asking-rent"
  | "bedroom-conflict"
  | "missing-bathrooms"
  | "sudden-availability-change"

export interface RuleDefinition {
  id: RuleId
  label: string
  severity: Severity
  source: DataSourceId
  /** Why this matters / what the operator should do. */
  action: string
  /** Null when the rule runs; otherwise why it can't. */
  notEvaluatedReason?: (ctx: { listingsConnected: boolean }) => string | null
}

const needsListings = ({ listingsConnected }: { listingsConnected: boolean }) =>
  listingsConnected ? null : "No listing feed is connected."

export const RULES: Record<RuleId, RuleDefinition> = {
  // Rent roll — compliance
  "rent-over-limit": { id: "rent-over-limit", label: "Rent above AMI limit", severity: "high", source: "rent-roll", action: "Verify the rent and AMI tier; if confirmed, reduce rent and refund the overcharge. Overcharges are reportable LIHTC noncompliance." },
  // Rent roll — identifiers (record can't be trusted as a physical unit)
  "missing-unit-id": { id: "missing-unit-id", label: "Missing unit identifier", severity: "high", source: "rent-roll", action: "Add the unit number in the property-management system so the record can be tied to a physical unit." },
  "duplicate-unit-id": { id: "duplicate-unit-id", label: "Duplicate unit identifier", severity: "high", source: "rent-roll", action: "Two rent-roll rows share a unit number. Merge or correct them; unit counts and occupancy are overstated until fixed." },
  "unknown-property": { id: "unknown-property", label: "Unit linked to unknown property", severity: "high", source: "rent-roll", action: "Fix the property reference so the unit rolls up to the right asset." },
  "missing-status": { id: "missing-status", label: "Missing or unrecognized unit status", severity: "high", source: "rent-roll", action: "Set occupied / notice / vacant. The unit is excluded from occupancy until classified." },
  // Rent roll — contradictions
  "occupied-missing-rent": { id: "occupied-missing-rent", label: "Leased unit missing rent", severity: "high", source: "rent-roll", action: "Enter the lease rent; revenue and rent-limit checks can't run without it." },
  "occupied-missing-tenant": { id: "occupied-missing-tenant", label: "Leased unit missing resident", severity: "medium", source: "rent-roll", action: "Add the resident or correct the status; the record contradicts itself." },
  "vacant-with-tenant": { id: "vacant-with-tenant", label: "Vacant unit with resident or rent", severity: "medium", source: "rent-roll", action: "Confirm whether the unit is occupied and update the status or clear the stale resident data." },
  "invalid-lease-dates": { id: "invalid-lease-dates", label: "Invalid lease dates", severity: "medium", source: "rent-roll", action: "Lease end is before lease start or a date can't be read. Correct the lease record." },
  "future-lease-start": { id: "future-lease-start", label: "Leased unit with future start date", severity: "medium", source: "rent-roll", action: "Status says leased but the lease hasn't started; it may be a pre-lease recorded as occupied." },
  "ami-tier-not-in-set-asides": { id: "ami-tier-not-in-set-asides", label: "AMI tier not in property set-asides", severity: "medium", source: "rent-roll", action: "Unit's AMI tier isn't one of the property's regulatory set-asides. Confirm the unit designation." },
  // Rent roll — incomplete / stale
  "missing-bedrooms": { id: "missing-bedrooms", label: "Missing bedroom count", severity: "low", source: "rent-roll", action: "Add the bedroom count; rent limits and unit-mix analysis depend on it." },
  "missing-ami-tier": { id: "missing-ami-tier", label: "Missing AMI tier", severity: "medium", source: "rent-roll", action: "Assign the unit's AMI designation so rent-limit compliance can be checked." },
  "missing-rent-limit": { id: "missing-rent-limit", label: "Missing rent limit", severity: "medium", source: "rent-roll", action: "Load the AMI rent limit for this unit type so over-limit checks can run." },
  "expired-lease-occupied": { id: "expired-lease-occupied", label: "Occupied with expired lease", severity: "low", source: "rent-roll", action: "Lease end has passed but the unit is still occupied. Record the renewal or month-to-month status and confirm recertification." },
  "implausible-low-rent": { id: "implausible-low-rent", label: "Implausibly low rent", severity: "low", source: "rent-roll", action: "Rent is under half the AMI limit. Check for a data-entry error, concession or subsidy split." },
  "notice-upcoming-vacancy": { id: "notice-upcoming-vacancy", label: "Notice to vacate", severity: "low", source: "rent-roll", action: "Resident has given notice. Schedule the turn and start marketing to protect occupancy." },
  // Property records
  "unit-count-mismatch": { id: "unit-count-mismatch", label: "Unit count mismatch", severity: "high", source: "property-record", action: "The property's declared unit count doesn't match the rent roll. Find the missing or extra units." },
  "occupancy-gap": { id: "occupancy-gap", label: "Reported vs rent-roll occupancy gap", severity: "medium", source: "property-record", action: "The property's reported occupancy disagrees with the rent roll by more than 2 pts. Confirm which source is current before reporting it to investors." },
  "compliance-period-ended": { id: "compliance-period-ended", label: "Initial compliance period ended", severity: "low", source: "property-record", action: "The 15-year federal compliance period has ended. Confirm extended-use monitoring and the investor's exit plan." },
  // Financials
  "noi-shortfall": { id: "noi-shortfall", label: "NOI below budget (>5%)", severity: "medium", source: "financials", action: "Review expense drivers and revenue for last month; prepare a variance explanation for investors." },
  // Compliance
  "compliance-overdue": { id: "compliance-overdue", label: "Overdue compliance event", severity: "high", source: "compliance", action: "Complete and document the event now; late recertifications and inspections can trigger findings." },
  "compliance-due-this-week": { id: "compliance-due-this-week", label: "Compliance due this week", severity: "medium", source: "compliance", action: "Confirm the owner and that documents are ready before the deadline." },
  // Listings — need a listing feed
  "unmatched-listing": { id: "unmatched-listing", label: "Unmatched listing", severity: "high", source: "listings", action: "Resolve the listing to a physical unit or remove it; unmatched listings inflate availability.", notEvaluatedReason: needsListings },
  "low-confidence-mapping": { id: "low-confidence-mapping", label: "Low-confidence mapping", severity: "medium", source: "listings", action: "Manually confirm which unit the listing advertises.", notEvaluatedReason: needsListings },
  "multiple-active-listings": { id: "multiple-active-listings", label: "Multiple active listings for one unit", severity: "medium", source: "listings", action: "Remove duplicate postings so the unit is counted once.", notEvaluatedReason: needsListings },
  "stale-active-listing": { id: "stale-active-listing", label: "Stale active listing", severity: "medium", source: "listings", action: `Listing hasn't been seen in over ${LISTING_RULES.staleDays} days but is still marked active. Confirm or close it.`, notEvaluatedReason: needsListings },
  "duplicate-listing-records": { id: "duplicate-listing-records", label: "Duplicate listing records", severity: "low", source: "listings", action: "The same listing id appears more than once in the feed. Check the ingestion job.", notEvaluatedReason: needsListings },
  "missing-asking-rent": { id: "missing-asking-rent", label: "Missing asking rent", severity: "low", source: "listings", action: "Add the advertised rent; it's needed for rent benchmarking.", notEvaluatedReason: needsListings },
  "bedroom-conflict": { id: "bedroom-conflict", label: "Bedroom count conflicts with rent roll", severity: "medium", source: "listings", action: "Listing and rent roll disagree on bedrooms. One of them is wrong.", notEvaluatedReason: needsListings },
  "missing-bathrooms": { id: "missing-bathrooms", label: "Missing bathroom count", severity: "low", source: "rent-roll", action: "Bathroom counts would support floor-plan analysis.", notEvaluatedReason: () => "The rent roll has no bathroom field." },
  "sudden-availability-change": { id: "sudden-availability-change", label: "Sudden availability change", severity: "medium", source: "rent-roll", action: "Investigate large week-over-week swings in vacant units.", notEvaluatedReason: () => "Unit status is a single snapshot; no status history exists." },
}

export interface ExceptionRow {
  id: string
  rule: RuleId
  severity: Severity
  propertyId: string | null
  propertyName: string
  /** Unit, listing or property identifier as shown to the user. */
  record: string
  /** Physical unit id for unit-level rows; null for property, compliance and listing rows. */
  unitId: string | null
  /** Short contextual facts (e.g. "1 BR · 60% AMI"). */
  context: string
  /** Plain-English reason for this specific row. */
  reason: string
  /** Most relevant date for the row: due date, lease end, statement month, or the data date. */
  observedAt: Date | null
  confidence: ConfidenceTier | null
}

export interface ExceptionInputs {
  asOf: Date
  properties: readonly Property[]
  units: readonly PhysicalUnit[]
  reconciliations: readonly PropertyReconciliation[]
  complianceEvents: readonly ComplianceEvent[]
  /** Properties whose last-month NOI missed budget by >5% (existing calculation). */
  noiShortfalls: readonly { propertyId: string; variance: number; variancePct: number; month: string }[]
  listingSource: ListingSource
}

export function generateExceptions(input: ExceptionInputs): ExceptionRow[] {
  const { asOf, properties, units } = input
  const name = (id: string | null) => properties.find((p) => p.id === id)?.name ?? "Unknown property"
  const rows: ExceptionRow[] = []
  const push = (r: Omit<ExceptionRow, "severity">) => rows.push({ ...r, severity: RULES[r.rule].severity })

  // Unit-level rules (rent roll)
  for (const u of units) {
    const unitLabel = u.unitNumber ? `Unit ${u.unitNumber}` : `Record ${u.id}`
    const context = [bedroomLabel(u.bedrooms), u.amiTier != null ? `${u.amiTier}% AMI` : "AMI n/a", u.status ?? "status n/a"].join(" · ")
    const base = { propertyId: u.propertyId, propertyName: name(u.propertyId), record: unitLabel, unitId: u.id, context, observedAt: asOf, confidence: u.confidence }

    if (u.overRentLimit) {
      push({ ...base, id: `${u.id}:rent-over-limit`, rule: "rent-over-limit", reason: `In-place rent ${formatCurrency(u.inPlaceRent)} exceeds the ${formatCurrency(u.maxAllowableRent)} limit by ${formatCurrency((u.inPlaceRent ?? 0) - (u.maxAllowableRent ?? 0))}.` })
    }
    if (u.status === "notice") {
      push({ ...base, id: `${u.id}:notice`, rule: "notice-upcoming-vacancy", reason: u.leaseEnd ? `Notice given; lease ends ${u.leaseEnd.toLocaleDateString("en-US")}.` : "Notice given; lease end date missing.", observedAt: u.leaseEnd ?? asOf })
    }
    for (const check of u.checks) {
      push({ ...base, id: `${u.id}:${check}`, rule: check, reason: unitCheckReason(check, u, asOf), observedAt: check === "expired-lease-occupied" ? u.leaseEnd : asOf })
    }
  }

  // Property-level reconciliation
  for (const r of input.reconciliations) {
    const base = { propertyId: r.propertyId, propertyName: name(r.propertyId), record: "Property", unitId: null, observedAt: asOf, confidence: null }
    if (!r.unitCountMatches) {
      push({ ...base, id: `${r.propertyId}:unit-count`, rule: "unit-count-mismatch", context: `${r.declaredUnits} declared · ${r.rentRollUnits} in rent roll`, reason: `Property record lists ${r.declaredUnits} units but the rent roll has ${r.rentRollUnits}.` })
    }
    if (r.occupancyGapFlag) {
      push({ ...base, id: `${r.propertyId}:occ-gap`, rule: "occupancy-gap", context: `Reported ${formatPct(r.reportedOccupancy)} · rent roll ${formatPct(r.rentRollOccupancy)}`, reason: `Reported occupancy is ${formatPctPoints(r.occupancyGap)} vs the rent roll.` })
    }
  }
  for (const p of properties) {
    const end = parseDate(p.compliancePeriodEndDate)
    if (end && isAfterDay(asOf, end)) {
      push({ id: `${p.id}:cp-ended`, rule: "compliance-period-ended", propertyId: p.id, propertyName: p.name, record: "Property", unitId: null, context: `Placed in service ${p.placedInServiceDate}`, reason: `Initial compliance period ended ${p.compliancePeriodEndDate}.`, observedAt: end, confidence: null })
    }
  }

  // Financials
  for (const s of input.noiShortfalls) {
    push({ id: `${s.propertyId}:noi`, rule: "noi-shortfall", propertyId: s.propertyId, propertyName: name(s.propertyId), record: "Property", unitId: null, context: `Month ${s.month}`, reason: `NOI was ${formatCurrency(Math.abs(s.variance))} (${formatPct(Math.abs(s.variancePct))}) below budget.`, observedAt: parseDate(`${s.month}-01`), confidence: null })
  }

  // Compliance calendar
  for (const e of input.complianceEvents) {
    if (e.status !== "overdue" && e.status !== "due-this-week") continue
    const due = parseDate(e.dueDate)
    const days = due ? daysBetween(due, asOf) : null
    push({
      id: `${e.id}:compliance`,
      rule: e.status === "overdue" ? "compliance-overdue" : "compliance-due-this-week",
      propertyId: e.propertyId,
      propertyName: name(e.propertyId),
      record: e.eventType,
      unitId: null,
      context: `Due ${e.dueDate}`,
      reason: e.status === "overdue" ? `Due ${days != null ? `${days} days ago` : e.dueDate}; not marked complete.` : `Due ${e.dueDate}.`,
      observedAt: due,
      confidence: null,
    })
  }

  // Listing feed (only when connected)
  if (input.listingSource.status === "connected") rows.push(...listingExceptions(input.listingSource.events, units, asOf, name))

  return rows.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.propertyName.localeCompare(b.propertyName) ||
      a.record.localeCompare(b.record, undefined, { numeric: true }),
  )
}

function unitCheckReason(check: UnitCheckId, u: PhysicalUnit, asOf: Date): string {
  switch (check) {
    case "missing-unit-id": return "Rent-roll row has no unit number."
    case "duplicate-unit-id": return `Unit number ${u.unitNumber} appears more than once at this property.`
    case "unknown-property": return `Property id "${u.propertyId}" doesn't match any property.`
    case "missing-status": return "Status is blank or not one of occupied / notice / vacant."
    case "occupied-missing-rent": return "Unit is leased but rent is blank or $0."
    case "occupied-missing-tenant": return "Unit is leased but no resident is recorded."
    case "vacant-with-tenant": return "Unit is vacant but still has a resident or rent on file."
    case "invalid-lease-dates": return "Lease end is before lease start, or a lease date is unreadable."
    case "future-lease-start": return `Lease starts ${u.leaseStart?.toLocaleDateString("en-US")}, after the data date.`
    case "ami-tier-not-in-set-asides": return `${u.amiTier}% AMI isn't one of this property's set-asides.`
    case "missing-bedrooms": return "Bedroom count is blank or out of range."
    case "missing-ami-tier": return "AMI tier is blank."
    case "missing-rent-limit": return "AMI rent limit is blank."
    case "expired-lease-occupied": return u.leaseEnd ? `Lease ended ${daysBetween(u.leaseEnd, asOf)} days ago; unit still marked occupied.` : "Lease ended; unit still marked occupied."
    case "implausible-low-rent": return `Rent ${formatCurrency(u.inPlaceRent)} is under half the ${formatCurrency(u.maxAllowableRent)} limit.`
  }
}

function listingExceptions(
  events: Parameters<typeof dedupeListings>[0],
  units: readonly PhysicalUnit[],
  asOf: Date,
  name: (id: string | null) => string,
): ExceptionRow[] {
  const rows: ExceptionRow[] = []
  const unitById = new Map(units.map((u) => [u.id, u]))
  const deduped = dedupeListings(events)
  const active = deduped.filter((e) => e.status === "active")
  const label = (id: string | null) => (id ? `Listing ${id}` : "Listing (no id)")
  const mk = (rule: RuleId, e: (typeof events)[number], reason: string, idSuffix: string = rule): ExceptionRow => ({
    id: `${e.listingId ?? `no-id-${e.advertisedUnit ?? "unknown"}-${rows.length}`}:${idSuffix}`,
    rule,
    severity: RULES[rule].severity,
    propertyId: e.propertyId,
    propertyName: name(e.propertyId),
    record: label(e.listingId),
    unitId: null,
    context: [e.advertisedUnit ?? "unit n/a", e.source ?? "source n/a"].join(" · "),
    reason,
    observedAt: parseDate(e.lastSeenAt),
    confidence: e.unitId && unitById.has(e.unitId) ? mappingTier(e) : "unresolved",
  })

  for (const group of findDuplicates(events, (e) => e.listingId)) {
    rows.push(mk("duplicate-listing-records", group[0], `Listing id appears ${group.length} times in the feed.`))
  }
  for (const e of active) {
    const unit = e.unitId ? unitById.get(e.unitId) : undefined
    if (!unit) rows.push(mk("unmatched-listing", e, "Active listing isn't mapped to a unit in the rent roll."))
    else if (mappingTier(e) === "low") rows.push(mk("low-confidence-mapping", e, `Match score ${e.matchScore?.toFixed(2)} is below ${LISTING_RULES.mediumMatch}.`))
    if (unit && e.bedrooms != null && unit.bedrooms != null && e.bedrooms !== unit.bedrooms) {
      rows.push(mk("bedroom-conflict", e, `Listing says ${bedroomLabel(e.bedrooms)}; rent roll says ${bedroomLabel(unit.bedrooms)}.`))
    }
    if (e.askingRent == null) rows.push(mk("missing-asking-rent", e, "Active listing has no asking rent."))
    const seen = parseDate(e.lastSeenAt)
    if (seen && daysBetween(seen, asOf) > LISTING_RULES.staleDays) rows.push(mk("stale-active-listing", e, `Last seen ${daysBetween(seen, asOf)} days ago.`))
  }
  for (const [unitId, group] of groupBy(active.filter((e) => e.unitId && unitById.has(e.unitId)), (e) => e.unitId)) {
    if (group.length > 1) rows.push(mk("multiple-active-listings", group[0], `${group.length} active listings point to the same unit.`, `multi-${unitId}`))
  }
  return rows
}

export interface RuleSummary {
  rule: RuleDefinition
  count: number
  /** Null when evaluated. */
  notEvaluatedReason: string | null
}

export function summarizeRules(rows: readonly ExceptionRow[], listingSource: ListingSource): RuleSummary[] {
  const ctx = { listingsConnected: listingSource.status === "connected" }
  const counts = new Map<RuleId, number>()
  for (const r of rows) counts.set(r.rule, (counts.get(r.rule) ?? 0) + 1)
  return Object.values(RULES)
    .map((rule) => ({ rule, count: counts.get(rule.id) ?? 0, notEvaluatedReason: rule.notEvaluatedReason?.(ctx) ?? null }))
    .sort(
      (a, b) =>
        Number(a.notEvaluatedReason != null) - Number(b.notEvaluatedReason != null) ||
        SEVERITY_RANK[a.rule.severity] - SEVERITY_RANK[b.rule.severity] ||
        b.count - a.count,
    )
}

/** CSV for the visible exception rows. Values are quoted and quotes escaped. */
export function exceptionsToCsv(rows: readonly ExceptionRow[]): string {
  const header = ["Severity", "Exception", "Property", "Record", "Context", "Reason", "Key date", "Confidence", "Suggested action"]
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = rows.map((r) =>
    [
      r.severity,
      RULES[r.rule].label,
      r.propertyName,
      r.record,
      r.context,
      r.reason,
      r.observedAt ? toISODate(r.observedAt) : "",
      r.confidence ?? "",
      RULES[r.rule].action,
    ].map((v) => esc(String(v))).join(","),
  )
  return [header.map(esc).join(","), ...lines].join("\r\n")
}
