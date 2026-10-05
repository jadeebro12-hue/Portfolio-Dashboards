import * as React from "react"
import { Link, useLocation } from "wouter"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, ListChecks } from "lucide-react"

import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DataSection, EmptyState, RowsSkeleton } from "@/components/data-states"
import { FilterBar } from "@/components/analytics/filter-bar"
import { MetricInfo, SourceTag } from "@/components/analytics/metric-info"
import { useFilteredModel, useFilters } from "@/lib/analytics/use-analytics"
import { propertyDiagnostics, type PropertyDiagnostic } from "@/lib/analytics/diagnostics"
import { unitMix } from "@/lib/analytics/inventory"
import { formatCount, formatCurrency, formatPct, formatPctPoints, safeDivide } from "@/lib/analytics/format"
import { toneText } from "@/lib/status"
import { cn } from "@/lib/utils"

type SortKey = "name" | "units" | "occupancy" | "gap" | "vacant" | "notice" | "starts" | "rent" | "rentToLimit" | "confidence" | "exceptions"

const SORTERS: Record<SortKey, (r: PropertyDiagnostic) => number | string | null> = {
  name: (r) => r.property.name,
  units: (r) => r.units,
  occupancy: (r) => r.occupancy,
  gap: (r) => (r.occupancyGap == null ? null : Math.abs(r.occupancyGap)),
  vacant: (r) => r.vacant,
  notice: (r) => r.notice,
  starts: (r) => r.leaseStarts,
  rent: (r) => r.avgInPlaceRent,
  rentToLimit: (r) => r.rentToLimit,
  confidence: (r) => r.highConfidenceShare,
  exceptions: (r) => r.exceptions.high * 10000 + r.exceptions.medium * 100 + r.exceptions.low,
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
  align = "right",
  info,
  className,
}: {
  label: string
  k: SortKey
  sort: { key: SortKey; dir: "asc" | "desc" }
  onSort: (k: SortKey) => void
  align?: "left" | "right"
  info?: React.ReactNode
  className?: string
}) {
  const active = sort.key === k
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <TableHead className={cn("h-auto whitespace-normal py-2 align-bottom leading-tight", align === "right" && "text-right", className)} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <span className={cn("inline-flex items-end gap-1", align === "right" && "flex-row-reverse")}>
        <button
          onClick={() => onSort(k)}
          className={cn("inline-flex min-h-8 items-center gap-1 rounded text-left uppercase tracking-wide hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active && "text-foreground")}
        >
          {align === "right" && <Icon className="size-3" aria-hidden />}
          {label}
          {align === "left" && <Icon className="size-3" aria-hidden />}
        </button>
        {info}
      </span>
    </TableHead>
  )
}

function ExceptionCounts({ e }: { e: PropertyDiagnostic["exceptions"] }) {
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums" aria-label={`${e.high} high, ${e.medium} medium, ${e.low} low`}>
      <span className={cn("min-w-6 rounded px-1 text-center text-xs font-semibold", e.high ? "bg-destructive/10 text-danger-text" : "text-muted-foreground")}>{e.high}H</span>
      <span className={cn("min-w-6 rounded px-1 text-center text-xs font-semibold", e.medium ? "bg-warning/15 text-warning-text" : "text-muted-foreground")}>{e.medium}M</span>
      <span className="min-w-6 rounded px-1 text-center text-xs text-muted-foreground">{e.low}L</span>
    </span>
  )
}

export default function Diagnosis() {
  const { model, properties, units, window, exceptions, filters } = useFilteredModel()
  const { setFilter } = useFilters()
  const [, navigate] = useLocation()
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "exceptions", dir: "desc" })

  const rows = React.useMemo(() => {
    const diag = propertyDiagnostics({
      properties,
      units,
      reconciliations: model.reconciliationByProperty,
      exceptions,
      window,
      asOf: model.asOf,
    }).filter((r) => r.units > 0)
    const get = SORTERS[sort.key]
    return diag.sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      if (va == null && vb == null) return 0
      if (va == null) return 1 // nulls last regardless of direction
      if (vb == null) return -1
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)
      return sort.dir === "asc" ? cmp : -cmp
    })
  }, [properties, units, model, exceptions, window, sort])

  const onSort = (k: SortKey) =>
    setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: k === "name" ? "asc" : "desc" }))

  const openQueue = (propertyId: string) => {
    setFilter("propertyId", propertyId)
    navigate("/actions")
  }

  const mix = unitMix(units)
  const totalUnits = units.length
  const worst = rows.length ? [...rows].sort((a, b) => b.exceptions.high - a.exceptions.high || b.exceptionTotal - a.exceptionTotal)[0] : null

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Property Diagnosis"
          description="Which properties and unit types explain the portfolio picture — and where the data is weakest."
        />

        <FilterBar windowLabel="Lease-start window" />

        <DataSection
          skeleton={<Card><RowsSkeleton rows={8} /></Card>}
          isEmpty={rows.length === 0}
          empty={<Card><EmptyState title="No properties match these filters" description="Widen or reset the filters to compare properties." /></Card>}
        >
          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SourceTag kind="units" />
                <SourceTag kind="property" />
                <SourceTag kind="listings" />
              </div>
              <CardTitle className="pt-1">
                {worst && worst.exceptionTotal > 0
                  ? `${worst.property.name} carries the most open exceptions (${worst.exceptions.high} high, ${worst.exceptions.medium} medium)`
                  : "Property diagnostics"}
              </CardTitle>
              <CardDescription>
                Sort any column. Occupancy is from the rent roll; “Gap” compares it with the property's reported figure. Listing columns are N/A until a feed is connected. Wider screens also show notice, lease starts, rent and rent-to-limit.
              </CardDescription>
            </CardHeader>

            {/* Phone: cards */}
            <ul className="divide-y border-t md:hidden">
              {rows.map((r) => (
                <li key={r.property.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/properties/${r.property.id}`} className="inline-flex min-h-11 items-center font-medium hover:underline">{r.property.name}</Link>
                      <p className="text-xs text-muted-foreground">{r.market} · {r.units} units</p>
                    </div>
                    <ExceptionCounts e={r.exceptions} />
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Occupancy</dt><dd className="font-medium tabular-nums">{formatPct(r.occupancy)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Gap</dt><dd className={cn("tabular-nums", r.occupancyGap != null && Math.abs(r.occupancyGap) > 0.02 && "font-semibold text-warning-text")}>{formatPctPoints(r.occupancyGap)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Vacant / notice</dt><dd className="tabular-nums">{r.vacant} / {r.notice}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Avg rent</dt><dd className="tabular-nums">{formatCurrency(r.avgInPlaceRent)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Rent / limit</dt><dd className="tabular-nums">{formatPct(r.rentToLimit, 0)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">High conf.</dt><dd className="tabular-nums">{formatPct(r.highConfidenceShare, 0)}</dd></div>
                  </dl>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Active listings: N/A</span>
                    <Button variant="outline" size="sm" onClick={() => openQueue(r.property.id)}>
                      <ListChecks aria-hidden /> Exceptions
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Tablet & desktop: sortable table */}
            <div className="hidden md:block">
              <Table className="[&_td]:px-2 [&_th]:px-2 min-w-[600px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <SortHeader label="Property" k="name" sort={sort} onSort={onSort} align="left" className="min-w-40" />
                    <SortHeader label="Units" k="units" sort={sort} onSort={onSort} />
                    <SortHeader label="Occ." k="occupancy" sort={sort} onSort={onSort} info={<MetricInfo metric="physicalOccupancy" />} />
                    <SortHeader label="Gap" k="gap" sort={sort} onSort={onSort} info={<MetricInfo metric="occupancyGap" />} />
                    <SortHeader label="Vacant" k="vacant" sort={sort} onSort={onSort} />
                    <SortHeader label="Notice" k="notice" sort={sort} onSort={onSort} className="hidden min-[1400px]:table-cell" />
                    <SortHeader label={`Starts ${filters.windowDays}d`} k="starts" sort={sort} onSort={onSort} className="hidden min-[1400px]:table-cell" />
                    <SortHeader label="Avg rent" k="rent" sort={sort} onSort={onSort} className="hidden min-[1400px]:table-cell" />
                    <SortHeader label="Rent/ limit" k="rentToLimit" sort={sort} onSort={onSort} className="hidden min-[1400px]:table-cell" />
                    <TableHead className="hidden text-right min-[1400px]:table-cell"><span className="inline-flex items-center gap-1">Listings <MetricInfo metric="activeListings" /></span></TableHead>
                    <SortHeader label="High conf." k="confidence" sort={sort} onSort={onSort} info={<MetricInfo metric="recordConfidence" />} />
                    <SortHeader label="Exceptions" k="exceptions" sort={sort} onSort={onSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.property.id}>
                      <TableCell>
                        <Link href={`/properties/${r.property.id}`} className="font-medium hover:underline">{r.property.name}</Link>
                        <div className="text-xs text-muted-foreground">{r.market}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.units}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPct(r.occupancy)}</TableCell>
                      <TableCell className={cn("whitespace-nowrap text-right tabular-nums", r.occupancyGap != null && Math.abs(r.occupancyGap) > 0.02 ? "font-semibold text-warning-text" : "text-muted-foreground")}>{formatPctPoints(r.occupancyGap)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.vacant}</TableCell>
                      <TableCell className="hidden text-right tabular-nums min-[1400px]:table-cell">{r.notice}</TableCell>
                      <TableCell className="hidden text-right tabular-nums min-[1400px]:table-cell">{r.leaseStarts}</TableCell>
                      <TableCell className="hidden text-right tabular-nums min-[1400px]:table-cell">{formatCurrency(r.avgInPlaceRent)}</TableCell>
                      <TableCell className={cn("hidden text-right tabular-nums min-[1400px]:table-cell", r.rentToLimit != null && r.rentToLimit > 1 && toneText.critical)}>{formatPct(r.rentToLimit, 0)}</TableCell>
                      <TableCell className="hidden text-right text-muted-foreground min-[1400px]:table-cell">N/A</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPct(r.highConfidenceShare, 0)}</TableCell>
                      <TableCell className="text-right">
                        <button onClick={() => openQueue(r.property.id)} className="inline-flex min-h-9 items-center gap-1 rounded hover:underline" aria-label={`Open ${r.property.name} in the Action Queue`}>
                          <ExceptionCounts e={r.exceptions} />
                          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Unit mix */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SourceTag kind="units" />
                <SourceTag kind="listings" />
              </div>
              <CardTitle className="pt-1">
                {(() => {
                  const top = [...mix].sort((a, b) => safeDivide(b.vacant, b.units)! - safeDivide(a.vacant, a.units)!)[0]
                  return top && top.units > 0
                    ? `${top.label} units have the highest vacancy rate (${formatPct(safeDivide(top.vacant, top.units))})`
                    : "Unit mix"
                })()}
              </CardTitle>
              <CardDescription>
                Physical-unit mix by bedrooms compared with listing mix (N/A). Rents are in-place contract rents, not advertised rents.
              </CardDescription>
            </CardHeader>
            <Table className="[&_td]:px-2 [&_th]:px-2 min-w-[600px]">
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Unit type</TableHead>
                  <TableHead className="w-40 xl:w-48">Physical mix</TableHead>
                  <TableHead className="text-right">Vacant</TableHead>
                  <TableHead className="hidden text-right xl:table-cell">Notice</TableHead>
                  <TableHead className="text-right">Avg in-place rent</TableHead>
                  <TableHead className="hidden text-right xl:table-cell">Avg AMI limit</TableHead>
                  <TableHead className="hidden text-right xl:table-cell">Rent / limit</TableHead>
                  <TableHead className="text-right">Listing mix</TableHead>
                  <TableHead className="text-right">Low / unresolved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mix.map((m) => {
                  const share = safeDivide(m.units, totalUnits)
                  return (
                    <TableRow key={m.label}>
                      <TableCell className="font-medium">{m.label}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                            <div className="h-full rounded-full bg-primary" style={{ width: `${(share ?? 0) * 100}%` }} />
                          </div>
                          <span className="shrink-0 whitespace-nowrap text-right text-xs tabular-nums">{formatCount(m.units)} · {formatPct(share, 0)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">{m.vacant} <span className="text-xs text-muted-foreground">({formatPct(safeDivide(m.vacant, m.units))})</span></TableCell>
                      <TableCell className="hidden text-right tabular-nums xl:table-cell">{m.notice}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(m.avgInPlaceRent)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums text-muted-foreground xl:table-cell">{formatCurrency(m.avgMaxRent)}</TableCell>
                      <TableCell className="hidden text-right tabular-nums xl:table-cell">{formatPct(m.rentToLimit, 0)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">N/A</TableCell>
                      <TableCell className={cn("text-right tabular-nums", m.lowOrUnresolved > 0 ? "font-semibold text-danger-text" : "text-muted-foreground")}>{m.lowOrUnresolved}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <p className="border-t px-4 py-3 text-xs text-muted-foreground sm:px-6">
              Unmatched or low-confidence <em>listings</em> by unit type need a listing feed; the last column counts rent-roll <em>records</em> rated Low or Unresolved.
            </p>
          </Card>
        </DataSection>
      </div>
    </AppLayout>
  )
}
