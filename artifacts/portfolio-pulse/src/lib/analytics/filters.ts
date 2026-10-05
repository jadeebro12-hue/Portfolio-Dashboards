/**
 * Dashboard filter model. Every dimension maps to a real source field:
 * - market   → `Property.city` + `Property.state` (no submarket field exists)
 * - program  → `Property.fundingSources` (used instead of asset class, which isn't in the data)
 * - bedrooms → `Unit.bedrooms` (no bathroom field exists)
 * - AMI tier → `Unit.amiTier`
 * - confidence → derived rent-roll record confidence
 */
import type { Property } from "../mock-data"
import type { ConfidenceTier, PhysicalUnit } from "./inventory"

export const WINDOW_OPTIONS = [30, 90, 180, 365] as const
export type WindowDays = (typeof WINDOW_OPTIONS)[number]

export interface DashboardFilters {
  propertyId: string | "all"
  market: string | "all"
  program: string | "all"
  bedrooms: number | "all"
  amiTier: number | "all"
  confidence: ConfidenceTier | "all"
  windowDays: WindowDays
}

export const DEFAULT_FILTERS: DashboardFilters = {
  propertyId: "all",
  market: "all",
  program: "all",
  bedrooms: "all",
  amiTier: "all",
  confidence: "all",
  windowDays: 90,
}

export const marketOf = (p: Pick<Property, "city" | "state">) => `${p.city}, ${p.state}`

/** Property-level dimensions: property, market, funding program. */
export function filterProperties(properties: readonly Property[], f: DashboardFilters): Property[] {
  return properties.filter(
    (p) =>
      (f.propertyId === "all" || p.id === f.propertyId) &&
      (f.market === "all" || marketOf(p) === f.market) &&
      (f.program === "all" || p.fundingSources.includes(f.program as Property["fundingSources"][number])),
  )
}

/** Unit-level dimensions applied on top of the property filter. */
export function filterUnits(
  units: readonly PhysicalUnit[],
  propertyIds: ReadonlySet<string>,
  f: DashboardFilters,
): PhysicalUnit[] {
  return units.filter(
    (u) =>
      propertyIds.has(u.propertyId) &&
      (f.bedrooms === "all" || u.bedrooms === f.bedrooms) &&
      (f.amiTier === "all" || u.amiTier === f.amiTier) &&
      (f.confidence === "all" || u.confidence === f.confidence),
  )
}

/** Count of non-default dimension filters (the time window isn't counted). */
export function activeFilterCount(f: DashboardFilters): number {
  return (["propertyId", "market", "program", "bedrooms", "amiTier", "confidence"] as const).filter(
    (k) => f[k] !== "all",
  ).length
}

export interface FilterOptions {
  properties: { value: string; label: string }[]
  markets: string[]
  programs: string[]
  bedrooms: number[]
  amiTiers: number[]
}

export function filterOptions(properties: readonly Property[], units: readonly PhysicalUnit[]): FilterOptions {
  const uniq = <T,>(xs: T[]) => [...new Set(xs)]
  return {
    properties: [...properties].sort((a, b) => a.name.localeCompare(b.name)).map((p) => ({ value: p.id, label: p.name })),
    markets: uniq(properties.map(marketOf)).sort(),
    programs: uniq(properties.flatMap((p) => p.fundingSources)).sort(),
    bedrooms: uniq(units.map((u) => u.bedrooms).filter((b): b is number => b != null)).sort((a, b) => a - b),
    amiTiers: uniq(units.map((u) => u.amiTier).filter((t): t is number => t != null)).sort((a, b) => a - b),
  }
}
