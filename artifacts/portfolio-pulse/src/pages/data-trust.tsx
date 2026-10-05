import * as React from "react"
import { Link } from "wouter"
import { AlertTriangle, ChevronRight, Info, PlugZap } from "lucide-react"

import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataSection, EmptyState, RowsSkeleton } from "@/components/data-states"
import { FilterBar } from "@/components/analytics/filter-bar"
import { MetricInfo, SourceTag } from "@/components/analytics/metric-info"
import { BarRow, StackedBar } from "@/components/analytics/bars"
import { ConfidenceBadge, ConfidenceLegend, confidenceFill } from "@/components/analytics/confidence"
import { useFilteredModel } from "@/lib/analytics/use-analytics"
import { CHECK_TIER, CONFIDENCE_TIERS, checkCounts, confidenceBreakdown, statusFunnel, type UnitCheckId } from "@/lib/analytics/inventory"
import { RULES } from "@/lib/analytics/exceptions"
import { REQUIRED_LISTING_FIELDS } from "@/lib/analytics/listings"
import { CONFIDENCE_TIER_DEFS } from "@/lib/analytics/definitions"
import { formatCount, formatCurrency, formatPct, formatPctPoints, safeDivide } from "@/lib/analytics/format"
import { monthKey } from "@/lib/analytics/dates"
import { cn } from "@/lib/utils"

type Measure = "units" | "listings" | "properties"

function MeasureTag({ measure }: { measure: Measure }) {
  return (
    <span className="rounded border px-1 text-[11px] font-semibold uppercase leading-4 tracking-wide text-muted-foreground">
      {measure}
    </span>
  )
}

function ReconRow({ label, value, measure, note, tone }: { label: string; value: React.ReactNode; measure: Measure; note?: string; tone?: "critical" | "warning" }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1.5 text-sm">
          {label} <MeasureTag measure={measure} />
        </p>
        {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      </div>
      <p className={cn("shrink-0 text-sm font-semibold tabular-nums", tone === "critical" && "text-danger-text", tone === "warning" && "text-warning-text")}>{value}</p>
    </div>
  )
}

export default function DataTrust() {
  const { model, properties, units } = useFilteredModel()
  const funnel = statusFunnel(units)
  const tiers = confidenceBreakdown(units)
  const checks = checkCounts(units)
  const propertyIds = new Set(properties.map((p) => p.id))
  const recon = model.reconciliations.filter((r) => propertyIds.has(r.propertyId))
  const gaps = [...recon].sort((a, b) => Math.abs(b.occupancyGap ?? 0) - Math.abs(a.occupancyGap ?? 0))
  const flaggedGaps = recon.filter((r) => r.occupancyGapFlag)
  const unitMismatches = recon.filter((r) => !r.unitCountMatches)
  const critical = (["missing-unit-id", "duplicate-unit-id", "unknown-property", "missing-status"] as UnitCheckId[]).reduce(
    (a, c) => a + (checks.get(c)?.length ?? 0),
    0,
  )
  const nameOf = (id: string) => model.properties.find((p) => p.id === id)?.name ?? id

  const lastMonth = monthKey(new Date(model.asOf.getFullYear(), model.asOf.getMonth() - 1, 1))
  const lastMonthVacancyLoss = model.financials
    .filter((f) => f.month === lastMonth && propertyIds.has(f.propertyId))
    .reduce((a, f) => a + f.vacancyLoss.actual, 0)

  const allChecks = Object.keys(CHECK_TIER) as UnitCheckId[]
  const checkRows = allChecks
    .map((c) => ({ id: c, tier: CHECK_TIER[c], count: checks.get(c)?.length ?? 0 }))
    .sort((a, b) => b.count - a.count || CONFIDENCE_TIERS.indexOf(b.tier) - CONFIDENCE_TIERS.indexOf(a.tier))

  const notConnected = model.listingSource.status === "not-connected"

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Inventory & Data Trust"
          description="How much to trust the numbers: physical inventory reconciled against listing activity, with uncertainty made visible."
        />

        {/* Known limitations — visible, not buried */}
        <div role="note" className="flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-text" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Known limitations</p>
            <p className="text-foreground/85">
              Listing activity is not a direct proxy for physical vacancy — and no listing feed is connected, so every listing metric below is N/A rather than estimated.
              Occupancy and vacancy come only from rent-roll unit status, a single snapshot with no history.
              Interpret metrics alongside record confidence and coverage. <Link href="/methodology" className="font-medium text-primary hover:underline max-sm:py-[15px]">Methodology</Link>
            </p>
          </div>
        </div>

        <FilterBar />

        <DataSection
          skeleton={<Card><RowsSkeleton rows={6} /></Card>}
          isEmpty={units.length === 0}
          empty={<Card><EmptyState title="No unit records match these filters" description="Widen or reset the filters to see inventory and data-trust metrics." /></Card>}
        >
          {/* 1. Reconciliation summary: units vs listings, side by side */}
          <section aria-labelledby="recon-title" className="space-y-3">
            <div>
              <h2 id="recon-title" className="text-lg font-semibold">Inventory reconciliation</h2>
              <p className="text-sm text-muted-foreground">Physical units and listing events are counted separately. Tags show whether a number counts <strong className="font-medium text-foreground">units</strong>, <strong className="font-medium text-foreground">listings</strong> or <strong className="font-medium text-foreground">properties</strong>.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2 sm:pb-2">
                  <SourceTag kind="units" className="self-start" />
                  <CardTitle className="pt-1">Physical inventory</CardTitle>
                  <CardDescription>Stable records: one per apartment.</CardDescription>
                </CardHeader>
                <CardContent className="divide-y">
                  <ReconRow label="Total physical units" value={formatCount(funnel.total)} measure="units" />
                  <ReconRow label="With a recognized status" value={`${formatCount(funnel.total - funnel.unclassified)} (${formatPct(funnel.statusCoverage, 0)})`} measure="units" />
                  <ReconRow label="Missing or duplicate critical identifiers" value={formatCount(critical)} measure="units" note="Unit number, property link or status" tone={critical ? "critical" : undefined} />
                  <ReconRow label="Records with contradictory fields" value={formatCount(tiers.low)} measure="units" note="Low confidence — e.g. lease end before lease start" tone={tiers.low ? "critical" : undefined} />
                  <ReconRow label="Records with stale or incomplete fields" value={formatCount(tiers.medium)} measure="units" note="Medium confidence — mostly expired leases still marked occupied" tone={tiers.medium ? "warning" : undefined} />
                  <ReconRow label="Rent roll matches declared unit count" value={`${recon.length - unitMismatches.length} of ${recon.length}`} measure="properties" tone={unitMismatches.length ? "critical" : undefined} />
                </CardContent>
              </Card>

              <Card className={cn(notConnected && "border-dashed")}>
                <CardHeader className="pb-2 sm:pb-2">
                  <SourceTag kind="listings" className="self-start" />
                  <CardTitle className="pt-1">Listing activity</CardTitle>
                  <CardDescription>Time-varying marketing records that can be duplicated, relisted or removed.</CardDescription>
                </CardHeader>
                <CardContent className="divide-y">
                  <ReconRow label="Active listings" value="N/A" measure="listings" />
                  <ReconRow label="Unique units with an active listing" value="N/A" measure="units" />
                  <ReconRow label="Units with multiple active listings" value="N/A" measure="units" />
                  <ReconRow label="Unmatched listings" value="N/A" measure="listings" />
                  <ReconRow label="Low-confidence mappings" value="N/A" measure="listings" />
                  <ReconRow label="Duplicate listing records" value="N/A" measure="listings" />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 2. Mapping coverage */}
          <Card className="border-dashed bg-muted/20 shadow-none">
            <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-start sm:pt-6">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning-text">
                <PlugZap className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  Mapping coverage <MetricInfo metric="mappingCoverage" />
                </p>
                <p className="text-2xl font-semibold text-muted-foreground">N/A</p>
                <p className="text-sm">
                  Confidence field unavailable — no listing feed is connected, so there are no listing records to map to physical units.
                  Once connected, it will read as “X% of active listings are mapped to a physical unit.”
                </p>
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-primary">Fields a listing feed needs</summary>
                  <ul className="mt-2 grid list-disc gap-1 pl-5 text-muted-foreground sm:grid-cols-2">
                    {REQUIRED_LISTING_FIELDS.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </details>
              </div>
            </CardContent>
          </Card>

          {/* 3. Funnel */}
          <Card>
            <CardHeader>
              <SourceTag kind="units" className="self-start" />
              <CardTitle className="pt-1">
                {formatPct(funnel.physicalOccupancy)} of classified units are occupied; {formatCount(funnel.vacant)} are vacant and {formatCount(funnel.notice)} more are on notice
              </CardTitle>
              <CardDescription>Availability & occupancy funnel, from rent-roll status only. Occupancy is never inferred from listings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BarRow label="Total physical units" value={formatCount(funnel.total)} share={1} barClassName="bg-primary/70" description="Every unit record in the rent roll." />
              <BarRow label="Occupied (incl. notice)" value={`${formatCount(funnel.occupied + funnel.notice)} · ${formatPct(safeDivide(funnel.occupied + funnel.notice, funnel.total))}`} share={safeDivide(funnel.occupied + funnel.notice, funnel.total)} barClassName="bg-primary" description="Status occupied or notice. Residents on notice still occupy the unit." />
              <BarRow indent label="of which on notice" value={`${formatCount(funnel.notice)} · ${formatPct(safeDivide(funnel.notice, funnel.total))}`} share={safeDivide(funnel.notice, funnel.total)} barClassName="bg-warning" description="Notice to vacate given — the next wave of availability." />
              <BarRow label="Vacant" value={`${formatCount(funnel.vacant)} · ${formatPct(safeDivide(funnel.vacant, funnel.total))}`} share={safeDivide(funnel.vacant, funnel.total)} barClassName="bg-muted-foreground/70" description="Status vacant. The data doesn't say whether a unit is rent-ready, offline or under renovation." />
              <BarRow indent label="Actively marketed" value="N/A" share={null} description="Needs a listing feed mapped to units. Not estimated from vacancy." />
              <BarRow label="Unable to classify" value={`${formatCount(funnel.unclassified)} · ${formatPct(safeDivide(funnel.unclassified, funnel.total))}`} share={safeDivide(funnel.unclassified, funnel.total)} barClassName="bg-foreground/50" description="Missing or unrecognized status. Kept visible instead of forced into a category, and excluded from the occupancy rate." />
              <p className="border-t pt-3 text-xs text-muted-foreground">Omitted stages: “Coming soon”, “Pre-leased” and “Down / offline” aren't statuses in the source, so they aren't shown.</p>
            </CardContent>
          </Card>

          {/* 4. Confidence tiers */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SourceTag kind="derived">Derived from rent roll</SourceTag>
                <MetricInfo metric="recordConfidence" />
              </div>
              <CardTitle className="pt-1">
                {formatPct(safeDivide(tiers.high, units.length), 0)} of unit records pass every check; {formatCount(tiers.medium + tiers.low + tiers.unresolved)} need review
              </CardTitle>
              <CardDescription>
                Rent-roll record confidence is a transparent, rule-based proxy. Listing → unit match confidence is unavailable without a listing feed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <StackedBar
                label={`Record confidence: ${CONFIDENCE_TIERS.map((t) => `${CONFIDENCE_TIER_DEFS[t].label} ${tiers[t]}`).join(", ")}`}
                segments={CONFIDENCE_TIERS.map((t) => ({ key: t, label: CONFIDENCE_TIER_DEFS[t].label, value: tiers[t], className: confidenceFill(t) }))}
              />
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CONFIDENCE_TIERS.map((t) => (
                  <li key={t} className="rounded-md border p-3">
                    <ConfidenceBadge tier={t} />
                    <p className="mt-2 text-lg font-semibold tabular-nums">{formatCount(tiers[t])}</p>
                    <p className="text-xs text-muted-foreground">{formatPct(safeDivide(tiers[t], units.length))} of units</p>
                  </li>
                ))}
              </ul>
              <div className="rounded-md bg-muted/40 p-3 sm:p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legend</p>
                <ConfidenceLegend />
              </div>
              <div className="overflow-hidden rounded-md border">
                <Table className="min-w-[520px]">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Record check</TableHead>
                      <TableHead>Lowers tier to</TableHead>
                      <TableHead className="text-right">Units failing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkRows.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{RULES[c.id].label}</TableCell>
                        <TableCell><ConfidenceBadge tier={c.tier} /></TableCell>
                        <TableCell className={cn("text-right tabular-nums", c.count === 0 ? "text-muted-foreground" : "font-semibold")}>{c.count === 0 ? "0 · pass" : formatCount(c.count)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* 5. Property reconciliation */}
          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SourceTag kind="property" />
                <span className="text-xs text-muted-foreground">vs</span>
                <SourceTag kind="units" />
                <MetricInfo metric="occupancyGap" />
              </div>
              <CardTitle className="pt-1">
                {flaggedGaps.length} of {recon.length} properties report occupancy more than 2 pts away from their rent roll
              </CardTitle>
              <CardDescription>Before quoting a property's occupancy to an investor, confirm which source is current.</CardDescription>
            </CardHeader>
            <Table className="min-w-[560px]">
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">Reported</TableHead>
                  <TableHead className="text-right">Rent roll</TableHead>
                  <TableHead className="text-right">Gap</TableHead>
                  <TableHead className="text-right">Units declared / in rent roll</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gaps.map((r) => (
                  <TableRow key={r.propertyId} className={cn(r.occupancyGapFlag && "bg-warning/5")}>
                    <TableCell>
                      <Link href={`/properties/${r.propertyId}`} className="inline-flex min-h-11 items-center md:min-h-0 font-medium hover:underline">{nameOf(r.propertyId)}</Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatPct(r.reportedOccupancy)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPct(r.rentRollOccupancy)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={cn("inline-flex items-center gap-1", r.occupancyGapFlag ? "font-semibold text-warning-text" : "text-muted-foreground")}>
                        {r.occupancyGapFlag && <AlertTriangle className="size-3.5" aria-label="Flagged" />}
                        {formatPctPoints(r.occupancyGap)}
                      </span>
                    </TableCell>
                    <TableCell className={cn("text-right tabular-nums", !r.unitCountMatches && "font-semibold text-danger-text")}>
                      {r.declaredUnits} / {r.rentRollUnits}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* 6. Field semantics */}
          <Card id="field-semantics" className="scroll-mt-20">
            <CardHeader>
              <SourceTag kind="financials" className="self-start" />
              <CardTitle className="pt-1">Field-semantics check: rental income already appears net of vacancy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                For <strong className="tabular-nums">{model.gpr.recordsMatching} of {model.gpr.recordsChecked}</strong> property-months ({formatPct(model.gpr.matchRate, 0)}), rental income + vacancy loss equals the rent roll's gross potential rent (sum of AMI-limit rents) within {formatPct(model.gpr.tolerance)}. That means <em>rental income is net of vacancy</em>.
              </p>
              <p>
                The existing NOI formula subtracts vacancy loss from rental income again. If confirmed, NOI is understated by roughly the month's vacancy loss — <strong className="tabular-nums">{formatCurrency(lastMonthVacancyLoss)}</strong> for {lastMonth} across the selected properties.
              </p>
              <p className="flex gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                The NOI calculation is left unchanged on purpose: the fix depends on confirming the field's meaning with the accounting source owner. Economic occupancy uses the reconciled interpretation.
              </p>
            </CardContent>
          </Card>

          {/* 7. Data-quality trend */}
          <Card className="border-dashed shadow-none">
            <CardHeader>
              <CardTitle>Data-quality trend</CardTitle>
              <CardDescription>Trend history unavailable — this is a current-state snapshot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>The source has no history of unit status or listing snapshots, so coverage, unresolved records, duplicates and stale records can't be trended yet.</p>
              <p className="text-muted-foreground">
                To enable it: persist a daily snapshot of the counts on this page (status coverage, tier counts, check failures, mapping coverage) keyed by load date.
              </p>
              <Link href="/actions" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary hover:underline sm:min-h-0">
                Review the records behind these numbers in the Action Queue <ChevronRight className="size-4" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        </DataSection>
      </div>
    </AppLayout>
  )
}
