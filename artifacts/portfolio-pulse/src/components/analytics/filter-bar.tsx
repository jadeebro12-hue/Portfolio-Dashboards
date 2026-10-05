import * as React from "react"
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CONFIDENCE_TIER_DEFS } from "@/lib/analytics/definitions"
import { WINDOW_OPTIONS, activeFilterCount, filterOptions, type DashboardFilters, type WindowDays } from "@/lib/analytics/filters"
import type { ConfidenceTier } from "@/lib/analytics/inventory"
import { bedroomLabel } from "@/lib/analytics/inventory"
import { getPortfolioModel } from "@/lib/analytics/model"
import { useFilters } from "@/lib/analytics/use-analytics"
import { cn } from "@/lib/utils"

type FilterKey = Exclude<keyof DashboardFilters, "windowDays">

const LABELS: Record<FilterKey, { label: string; hint: string }> = {
  propertyId: { label: "Property", hint: "" },
  market: { label: "Market", hint: "City, State — no submarket field in source" },
  program: { label: "Funding program", hint: "Used in place of asset class, which isn't in the data" },
  bedrooms: { label: "Unit type", hint: "Bedrooms — bathrooms aren't in the data" },
  amiTier: { label: "AMI tier", hint: "" },
  confidence: { label: "Record confidence", hint: "Rule-based rent-roll tier" },
}

function Select({
  id,
  label,
  hint,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground" title={hint || undefined}>
        {label}
      </span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full min-w-0 rounded-md border border-input bg-card px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-9",
          value !== "all" && "border-primary/50 bg-primary/5 font-medium",
        )}
      >
        {children}
      </select>
    </label>
  )
}

export function WindowSelector({ label = "Window" }: { label?: string }) {
  const { filters, setFilter } = useFilters()
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border bg-muted/50 p-0.5">
        {WINDOW_OPTIONS.map((d) => (
          <button
            key={d}
            role="radio"
            aria-checked={filters.windowDays === d}
            onClick={() => setFilter("windowDays", d as WindowDays)}
            className={cn(
              "h-11 min-w-12 flex-1 rounded px-2.5 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8",
              filters.windowDays === d ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {d}d
          </button>
        ))}
      </div>
    </div>
  )
}

interface FilterBarProps {
  /** Which dimension filters to show (default: all). */
  show?: FilterKey[]
  /** Show the 30/90/180/365-day selector, with this label. */
  windowLabel?: string
  className?: string
}

export function FilterBar({
  show = ["propertyId", "market", "program", "bedrooms", "amiTier", "confidence"],
  windowLabel,
  className,
}: FilterBarProps) {
  const { filters, setFilter, reset } = useFilters()
  const model = getPortfolioModel()
  const options = React.useMemo(() => filterOptions(model.properties, model.units), [model])
  const [open, setOpen] = React.useState(false)
  const active = activeFilterCount(filters)

  const field = (key: FilterKey, opts: { value: string; label: string }[]) => (
    <Select
      key={key}
      id={`filter-${key}`}
      label={LABELS[key].label}
      hint={LABELS[key].hint}
      value={String(filters[key])}
      onChange={(v) => {
        const numeric = key === "bedrooms" || key === "amiTier"
        setFilter(key, (v === "all" ? "all" : numeric ? Number(v) : v) as never)
      }}
    >
      <option value="all">All</option>
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  )

  const fields: Record<FilterKey, () => React.ReactNode> = {
    propertyId: () => field("propertyId", options.properties),
    market: () => field("market", options.markets.map((m) => ({ value: m, label: m }))),
    program: () => field("program", options.programs.map((p) => ({ value: p, label: p }))),
    bedrooms: () => field("bedrooms", options.bedrooms.map((b) => ({ value: String(b), label: bedroomLabel(b) }))),
    amiTier: () => field("amiTier", options.amiTiers.map((t) => ({ value: String(t), label: `${t}% AMI` }))),
    confidence: () =>
      field(
        "confidence",
        (Object.keys(CONFIDENCE_TIER_DEFS) as ConfidenceTier[]).map((t) => ({ value: t, label: CONFIDENCE_TIER_DEFS[t].label })),
      ),
  }

  return (
    <section aria-label="Filters" className={cn("rounded-lg border bg-card p-3 shadow-sm sm:p-4", className)}>
      <div className="flex flex-wrap items-end gap-3">
        <Button
          variant="outline"
          size="sm"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="filter-fields"
          onClick={() => setOpen((o) => !o)}
        >
          <SlidersHorizontal aria-hidden />
          Filters{active > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{active}</span>}
          <ChevronDown className={cn("transition-transform", open && "rotate-180")} aria-hidden />
        </Button>
        {windowLabel && <WindowSelector label={windowLabel} />}
        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="ml-auto text-muted-foreground">
            <RotateCcw aria-hidden /> Reset filters
          </Button>
        )}
      </div>
      <div
        id="filter-fields"
        className={cn(
          "mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid md:grid-cols-3 xl:grid-cols-6",
          open ? "grid" : "hidden",
          !windowLabel && active === 0 && "md:mt-0",
        )}
      >
        {show.map((k) => fields[k]())}
      </div>
    </section>
  )
}
