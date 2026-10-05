/**
 * Single source of truth for metric definitions. The same text powers the
 * info tooltips on every KPI and the Definitions & Methodology page, so the
 * two can never disagree.
 */
import { INVENTORY_RULES } from "./inventory"
import { LISTING_RULES, REQUIRED_LISTING_FIELDS } from "./listings"

export type Availability = "available" | "derived" | "source-field" | "unavailable"

export interface MetricDefinition {
  label: string
  definition: string
  formula: string
  source: string
  availability: Availability
  /** For unavailable metrics: the source fields needed to compute it. */
  requiredFields?: readonly string[]
}

const listingFields = REQUIRED_LISTING_FIELDS

export const METRICS = {
  totalProperties: {
    label: "Total properties",
    definition: "Assets in the portfolio.",
    formula: "count(properties)",
    source: "Property records",
    availability: "available",
  },
  physicalUnits: {
    label: "Physical units",
    definition: "Apartments in the rent roll, one record per unit. This is inventory, not marketing activity.",
    formula: "count(rent-roll unit records)",
    source: "Rent roll",
    availability: "available",
  },
  physicalOccupancy: {
    label: "Physical occupancy",
    definition: "Share of classified units that are leased. Units on notice are still occupied until they move out.",
    formula: "(occupied + notice) ÷ units with a recognized status",
    source: "Rent roll · Unit.occupancyStatus",
    availability: "available",
  },
  vacantUnits: {
    label: "Vacant units",
    definition: "Units with status “vacant” in the rent roll. Not derived from listings: a vacant unit may be offline, down for renovation or not yet marketed.",
    formula: "count(status = vacant)",
    source: "Rent roll · Unit.occupancyStatus",
    availability: "available",
  },
  noticeUnits: {
    label: "On notice",
    definition: "Occupied units whose residents have given notice to vacate. Leading indicator of vacancy.",
    formula: "count(status = notice)",
    source: "Rent roll · Unit.occupancyStatus",
    availability: "available",
  },
  economicOccupancy: {
    label: "Economic occupancy",
    definition: "Rent earned as a share of gross potential rent. Captures vacancy loss in dollars, not just units.",
    formula: "Σ rentalIncome.actual ÷ Σ (rentalIncome.actual + vacancyLoss.actual)",
    source: "Monthly financials (assumes rental income is net of vacancy — validated against rent-roll GPR)",
    availability: "derived",
  },
  reportedOccupancy: {
    label: "Reported occupancy",
    definition: "Occupancy as stated on the property record. Shown alongside rent-roll occupancy so differences are visible.",
    formula: "Property.currentOccupancyPct",
    source: "Property records",
    availability: "source-field",
  },
  occupancyGap: {
    label: "Occupancy gap",
    definition: `Reported occupancy minus rent-roll occupancy. Gaps over ${INVENTORY_RULES.occupancyGapThreshold * 100} pts are flagged.`,
    formula: "reported − rent-roll occupancy",
    source: "Property records vs rent roll",
    availability: "derived",
  },
  recordConfidence: {
    label: "Record confidence",
    definition: "Rule-based trust tier for each rent-roll unit record (High / Medium / Low / Unresolved). A transparent proxy — not a vendor match score.",
    formula: "Worst tier among failed record checks; High if all checks pass",
    source: "Derived from rent-roll fields",
    availability: "derived",
  },
  statusCoverage: {
    label: "Status coverage",
    definition: "Share of unit records with a recognized occupancy status.",
    formula: "units with status ∈ {occupied, notice, vacant} ÷ all units",
    source: "Rent roll",
    availability: "available",
  },
  leaseStarts: {
    label: "Lease starts",
    definition: "Current leases that began in the selected window. The rent roll only holds current residents, so this undercounts move-ins for earlier periods.",
    formula: "count(leased units with lease start in window, start ≤ data date, end ≥ start)",
    source: "Rent roll · Unit.leaseStartDate",
    availability: "available",
  },
  leaseExpirations: {
    label: "Lease expirations",
    definition: "Leased units whose lease ends in the coming window. Drives renewal and turn planning.",
    formula: "count(leased units with lease end in next N days)",
    source: "Rent roll · Unit.leaseEndDate",
    availability: "available",
  },
  inPlaceRent: {
    label: "Avg in-place rent",
    definition: "Average contract rent of leased units. This is what residents pay — not advertised rent.",
    formula: "mean(currentRent) for occupied + notice units with rent > 0",
    source: "Rent roll · Unit.currentRent",
    availability: "available",
  },
  rentToLimit: {
    label: "Rent-to-limit",
    definition: "How close in-place rents are to their AMI-restricted maximum. Above 100% is a compliance violation.",
    formula: "mean(currentRent ÷ maxAllowableRent)",
    source: "Rent roll",
    availability: "derived",
  },
  noiVariance: {
    label: "NOI vs budget",
    definition: "Last full month's net operating income compared with budget, summed across properties.",
    formula: "Σ (rental + other − vacancy loss − opex) actual − same for budget",
    source: "Monthly financials (existing calculation)",
    availability: "available",
  },
  healthScore: {
    label: "Health score",
    definition: "Source-provided 0–100 score. Its methodology isn't documented in the data, so it's shown as reported and not used in any derived metric.",
    formula: "Property.statusHealthScore",
    source: "Property records",
    availability: "source-field",
  },
  exceptions: {
    label: "Open exceptions",
    definition: "Rows in the Action Queue: data-quality, compliance and financial issues that need follow-up.",
    formula: "count(rule violations)",
    source: "Rent roll, property records, financials, compliance calendar",
    availability: "derived",
  },
  // ---- Listing metrics: no listing feed is connected ----
  activeListings: {
    label: "Active listings",
    definition: "Distinct listings currently marked active after de-duplicating repeated snapshots. Not the same as vacant units.",
    formula: "count(distinct listing_id where status = active)",
    source: "Listing feed (not connected)",
    availability: "unavailable",
    requiredFields: listingFields,
  },
  newListings: {
    label: "New listings",
    definition: "Listings first published in the selected window.",
    formula: "count(listed_at in window, listed_at ≤ data date)",
    source: "Listing feed (not connected)",
    availability: "unavailable",
    requiredFields: ["listing_id", "listed_at"],
  },
  delistings: {
    label: "Delistings",
    definition: "Listings removed in the selected window (leased, withdrawn or expired).",
    formula: "count(delisted_at in window, delisted_at ≥ listed_at)",
    source: "Listing feed (not connected)",
    availability: "unavailable",
    requiredFields: ["listing_id", "listed_at", "delisted_at"],
  },
  daysOnMarket: {
    label: "Days on market",
    definition: "Days an active listing has been published. Median is used because a few long-running listings skew the mean.",
    formula: "median(data date − listed_at) for active listings",
    source: "Listing feed (not connected)",
    availability: "unavailable",
    requiredFields: ["listed_at", "listing_status"],
  },
  timeToLease: {
    label: "Time to lease",
    definition: "Days from a unit becoming available (or listed) to a signed lease.",
    formula: "lease_signed_at − available_at (or listed_at), valid ordering only",
    source: "Listing feed + lease history (not available)",
    availability: "unavailable",
    requiredFields: ["vacated_at or available_at", "lease_signed_at", "listed_at"],
  },
  mappingCoverage: {
    label: "Mapping coverage",
    definition: "Share of active listings resolved to a physical unit in the rent roll.",
    formula: "active listings with a matched unit_id ÷ active listings",
    source: "Listing feed (not connected)",
    availability: "unavailable",
    requiredFields: ["listing_id", "unit_id or advertised unit number"],
  },
  matchConfidence: {
    label: "Match confidence",
    definition: `Entity-resolution score for a listing→unit match. High ≥ ${LISTING_RULES.highMatch}, Medium ≥ ${LISTING_RULES.mediumMatch}, Low below; Unresolved if no unit was matched.`,
    formula: "match_score banded into tiers",
    source: "Listing feed (not connected)",
    availability: "unavailable",
    requiredFields: ["match_score"],
  },
  advertisedRent: {
    label: "Advertised rent",
    definition: "Asking rent on active listings, for comparison with in-place rent and AMI limits.",
    formula: "median(asking_rent) for active listings",
    source: "Listing feed (not connected)",
    availability: "unavailable",
    requiredFields: ["asking_rent"],
  },
} satisfies Record<string, MetricDefinition>

export type MetricId = keyof typeof METRICS

/** Plain-language concepts for the methodology glossary. */
export const CONCEPTS: { term: string; meaning: string }[] = [
  { term: "Physical unit", meaning: "A stable piece of inventory — one apartment, one record in the rent roll. It exists whether or not it's advertised." },
  { term: "Listing event", meaning: "A marketing record (ILS post, website listing) that can be created, updated, duplicated, relisted or removed. One unit can have zero, one or many." },
  { term: "Active listing", meaning: "A de-duplicated listing whose latest status is active. It is not proof the unit is vacant: pre-leasing, stale posts and duplicates all break that link." },
  { term: "Occupied unit", meaning: "A unit with status occupied or notice in the rent roll. Notice units are occupied until move-out." },
  { term: "Available / vacant unit", meaning: "A unit with status vacant in the rent roll. Whether it's rent-ready or marketed is not recorded." },
  { term: "Mapping coverage", meaning: "Share of active listings tied to a physical unit. Requires a listing feed." },
  { term: "Match confidence", meaning: "How sure entity resolution is that a listing points to a specific unit. Requires a listing feed." },
  { term: "Record confidence", meaning: "This dashboard's rule-based trust tier for rent-roll records — High, Medium, Low or Unresolved — based on the checks listed below." },
  { term: "Days on market", meaning: "Days since an active listing was first published. Requires a listing feed." },
]

export const CONFIDENCE_TIER_DEFS = {
  high: { label: "High", meaning: "Passes every record check. Safe to use in all metrics." },
  medium: { label: "Medium", meaning: "Complete but stale or unusual (e.g. lease ended while still occupied, implausibly low rent). Usable; verify before acting." },
  low: { label: "Low", meaning: "Fields contradict each other (e.g. leased with no rent, vacant with a resident). Treat related metrics with caution." },
  unresolved: { label: "Unresolved", meaning: "Can't be reliably tied to a physical unit (missing or duplicate id, unknown property, missing status). Units without a status are excluded from occupancy." },
} as const
