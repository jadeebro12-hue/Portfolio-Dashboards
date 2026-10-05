/** Property-level diagnostic rows for the Property Diagnosis table. */
import type { Property } from "../mock-data"
import type { DateWindow } from "./dates"
import { groupBy } from "./dedupe"
import type { ExceptionRow, Severity } from "./exceptions"
import { mean, safeDivide } from "./format"
import type { PhysicalUnit, PropertyReconciliation } from "./inventory"
import { statusFunnel } from "./inventory"
import { leaseStartsInWindow } from "./leasing"
import { marketOf } from "./filters"

export interface PropertyDiagnostic {
  property: Property
  market: string
  units: number
  occupancy: number | null
  reportedOccupancy: number | null
  occupancyGap: number | null
  vacant: number
  notice: number
  leaseStarts: number
  avgInPlaceRent: number | null
  rentToLimit: number | null
  /** Share of this property's unit records rated High confidence. */
  highConfidenceShare: number | null
  exceptions: Record<Severity, number>
  exceptionTotal: number
  /** Listing metrics — null while no listing feed is connected. */
  activeListings: number | null
  newListings: number | null
  medianListingAge: number | null
}

export function propertyDiagnostics(args: {
  properties: readonly Property[]
  units: readonly PhysicalUnit[]
  reconciliations: ReadonlyMap<string, PropertyReconciliation>
  exceptions: readonly ExceptionRow[]
  window: DateWindow
  asOf: Date
}): PropertyDiagnostic[] {
  const unitsByProperty = groupBy(args.units, (u) => u.propertyId)
  const excByProperty = groupBy(args.exceptions, (e) => e.propertyId)

  return args.properties.map((property) => {
    const units = unitsByProperty.get(property.id) ?? []
    const funnel = statusFunnel(units)
    const rec = args.reconciliations.get(property.id)
    const rents = units.map((u) => u.inPlaceRent).filter((r): r is number => r != null)
    const ratios = units
      .filter((u) => u.inPlaceRent != null && u.maxAllowableRent != null)
      .map((u) => (u.inPlaceRent as number) / (u.maxAllowableRent as number))
    const exc = excByProperty.get(property.id) ?? []
    const exceptions: Record<Severity, number> = { high: 0, medium: 0, low: 0 }
    for (const e of exc) exceptions[e.severity]++

    return {
      property,
      market: marketOf(property),
      units: units.length,
      occupancy: funnel.physicalOccupancy,
      reportedOccupancy: rec?.reportedOccupancy ?? null,
      occupancyGap: rec?.occupancyGap ?? null,
      vacant: funnel.vacant,
      notice: funnel.notice,
      leaseStarts: leaseStartsInWindow(units, args.window, args.asOf),
      avgInPlaceRent: mean(rents),
      rentToLimit: mean(ratios),
      highConfidenceShare: safeDivide(units.filter((u) => u.confidence === "high").length, units.length),
      exceptions,
      exceptionTotal: exc.length,
      activeListings: null,
      newListings: null,
      medianListingAge: null,
    }
  })
}
