import * as React from "react"

import { trailingWindow, previousWindow } from "./dates"
import { DEFAULT_FILTERS, filterProperties, filterUnits, type DashboardFilters } from "./filters"
import { getPortfolioModel } from "./model"

interface FiltersContextValue {
  filters: DashboardFilters
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void
  reset: () => void
}

const FiltersContext = React.createContext<FiltersContextValue | null>(null)

/** Shared filter state so a filter set on Diagnosis carries to the Action Queue. */
export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = React.useState<DashboardFilters>(DEFAULT_FILTERS)
  const value = React.useMemo<FiltersContextValue>(
    () => ({
      filters,
      setFilter: (key, v) => setFilters((f) => ({ ...f, [key]: v })),
      reset: () => setFilters(DEFAULT_FILTERS),
    }),
    [filters],
  )
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}

export function useFilters() {
  const ctx = React.useContext(FiltersContext)
  if (!ctx) throw new Error("useFilters must be used inside FiltersProvider")
  return ctx
}

/** The portfolio model narrowed to the current filters. */
export function useFilteredModel() {
  const model = getPortfolioModel()
  const { filters } = useFilters()
  return React.useMemo(() => {
    const properties = filterProperties(model.properties, filters)
    const propertyIds = new Set(properties.map((p) => p.id))
    const units = filterUnits(model.units, propertyIds, filters)
    const window = trailingWindow(model.asOf, filters.windowDays)
    // Unit-level filters only narrow unit-level exceptions; property-level rows
    // (financials, compliance, reconciliation) stay when their property is in scope.
    const unitIds = new Set(units.map((u) => u.id))
    const unitFiltered = filters.bedrooms !== "all" || filters.amiTier !== "all" || filters.confidence !== "all"
    const exceptions = model.exceptions.filter((e) => {
      if (!e.propertyId || !propertyIds.has(e.propertyId)) return false
      return e.unitId ? unitIds.has(e.unitId) : !unitFiltered
    })
    return { model, filters, properties, units, window, previous: previousWindow(window), exceptions }
  }, [model, filters])
}
