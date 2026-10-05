import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  properties,
  financials,
  getOverRentUnits,
  getOverdueCompliance,
} from "@/lib/mock-data"
import { cn, formatCurrency, formatPercentage } from "@/lib/utils"
import { format, subMonths } from "date-fns"
import { Link } from "wouter"
import { Building2, AlertCircle, ArrowUpRight, ArrowDownRight, ChevronRight, CheckCircle2, Home, DoorOpen, Megaphone, ShieldCheck, DatabaseZap, Stethoscope, ListChecks } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { KpiCard } from "@/components/kpi-card"
import { StatusBadge, ScoreChip } from "@/components/status-badge"
import { DataSection, ChartSkeleton, RowsSkeleton, EmptyState } from "@/components/data-states"
import { MetricInfo, SourceTag } from "@/components/analytics/metric-info"
import { healthTone, occupancyTone, toneFill } from "@/lib/status"
import { getPortfolioModel } from "@/lib/analytics/model"
import { useDataState } from "@/lib/data-state"
import { formatMonthKey } from "@/lib/analytics/dates"
import { formatCount, formatPct, safeDivide } from "@/lib/analytics/format"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export default function Overview() {
  const model = getPortfolioModel()
  const { funnel, confidence, reconciliations } = model
  const ready = useDataState().status === "ready"

  const overdueItems = getOverdueCompliance();
  const overRentUnits = getOverRentUnits();

  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
  const lastMonthFinancials = financials.filter(f => f.month === lastMonth);

  const totalNOIActual = lastMonthFinancials.reduce((acc, f) => acc + (f.rentalIncome.actual + f.otherIncome.actual - f.vacancyLoss.actual - f.operatingExpenses.actual), 0);
  const totalNOIBudget = lastMonthFinancials.reduce((acc, f) => acc + (f.rentalIncome.budget + f.otherIncome.budget - f.vacancyLoss.budget - f.operatingExpenses.budget), 0);
  const noiVariance = totalNOIActual - totalNOIBudget;

  // Economic occupancy from financials (replaces a synthetic trend line).
  const econ = model.economicOccupancy.filter((p) => p.economicOccupancy != null)
  const econValues = econ.map((p) => p.economicOccupancy as number)
  const econMin = econValues.length ? Math.min(...econValues) : null
  const econMax = econValues.length ? Math.max(...econValues) : null
  const latestEcon = econ.at(-1)
  const priorEcon = econ.at(-2)
  const econDelta = latestEcon?.economicOccupancy != null && priorEcon?.economicOccupancy != null ? latestEcon.economicOccupancy - priorEcon.economicOccupancy : null

  const propertiesWithUnits = reconciliations.filter((r) => r.rentRollUnits > 0).length
  const unitCountMatches = reconciliations.filter((r) => r.unitCountMatches).length
  const occupancyGaps = reconciliations.filter((r) => r.occupancyGapFlag).length
  const highShare = safeDivide(confidence.high, funnel.total)
  const belowHigh = funnel.total - confidence.high
  const highSeverity = model.exceptions.filter((e) => e.severity === "high").length

  const attentionCount = Math.min(overRentUnits.length, 3) + Math.min(overdueItems.length, 3);

  const nextSteps = [
    {
      href: "/data-trust",
      icon: DatabaseZap,
      title: "Check data trust",
      stat: `${formatCount(belowHigh)} records below High · ${occupancyGaps} occupancy gaps`,
      detail: "Record confidence, listing coverage and reported-vs-rent-roll reconciliation.",
    },
    {
      href: "/diagnosis",
      icon: Stethoscope,
      title: "Diagnose properties",
      stat: `${funnel.vacant} vacant · ${funnel.notice} on notice`,
      detail: "Compare occupancy, rent-to-limit and exceptions by property and unit type.",
    },
    {
      href: "/actions",
      icon: ListChecks,
      title: "Work the Action Queue",
      stat: `${highSeverity} high-severity exceptions`,
      detail: "Rent-limit violations, overdue compliance and record conflicts, ranked by severity.",
    },
  ]

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Portfolio Health"
          description={`What's happening across ${properties.length} affordable housing properties.`}
          actions={
            <p className="text-xs text-muted-foreground sm:text-right">
              Data as of <span className="font-medium text-foreground">{model.asOf.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> · </span>
              Last refreshed {model.loadedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} (app load, not real-time)
            </p>
          }
        />

        {/* Executive KPIs: inventory first, then listings + trust, then financials */}
        <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12 [&>*]:xl:col-span-3 [&>*:nth-child(n+5)]:xl:col-span-4">
          <KpiCard
            label="Properties"
            metric="totalProperties"
            icon={Building2}
            value={formatCount(properties.length)}
            detail={`Across ${new Set(properties.map((p) => p.state)).size} states`}
            footer={`${propertiesWithUnits} of ${properties.length} have rent-roll records`}
          />
          <KpiCard
            label="Physical units"
            metric="physicalUnits"
            icon={Home}
            value={formatCount(funnel.total)}
            detail="One record per apartment"
            footer={`Rent roll matches declared unit count at ${unitCountMatches} of ${reconciliations.length} properties`}
          />
          <KpiCard
            label="Physical occupancy"
            metric="physicalOccupancy"
            value={formatPct(funnel.physicalOccupancy)}
            detail={`${formatCount(funnel.occupied + funnel.notice)} occupied, incl. ${funnel.notice} on notice`}
            footer="No status history, so no period comparison"
          />
          <KpiCard
            label="Vacant units"
            metric="vacantUnits"
            icon={DoorOpen}
            value={formatCount(funnel.vacant)}
            detail={`${formatPct(safeDivide(funnel.vacant, funnel.total))} of units · ${funnel.notice} more on notice`}
            footer={`Status coverage ${formatPct(funnel.statusCoverage, 0)}${funnel.unclassified ? ` · ${funnel.unclassified} unclassified` : ""}`}
          />
          <KpiCard
            label="Active listings"
            metric="activeListings"
            icon={Megaphone}
            value={null}
            unavailable="No listing feed connected"
            footer={<>New listings in period: N/A · <Link href="/methodology#required-fields" className="font-medium text-primary hover:underline max-sm:py-[15px]">fields needed</Link></>}
          />
          <KpiCard
            label="Record confidence"
            metric="recordConfidence"
            icon={ShieldCheck}
            value={<>{formatPct(highShare, 0)} <span className="text-base font-medium text-muted-foreground">High</span></>}
            detail={`${formatCount(confidence.medium)} medium · ${formatCount(confidence.low)} low · ${formatCount(confidence.unresolved)} unresolved`}
            footer="Listing → unit mapping coverage: N/A"
          />
          <KpiCard
            label="NOI vs budget · last month"
            metric="noiVariance"
            icon={noiVariance < 0 ? ArrowDownRight : ArrowUpRight}
            tone={noiVariance < 0 ? "critical" : "good"}
            value={<>{noiVariance > 0 ? '+' : ''}{formatCurrency(noiVariance)}</>}
            detail={<>{formatCurrency(totalNOIActual)} actual vs {formatCurrency(totalNOIBudget)} budget</>}
            footer={<><Link href="/data-trust#field-semantics" className="font-medium text-primary hover:underline max-sm:py-[15px]">Field-semantics note</Link> on vacancy loss</>}
            className="sm:col-span-2"
          />
        </section>

        {/* Economic occupancy + attention */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="min-w-0 xl:col-span-2">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <SourceTag kind="financials" />
                <MetricInfo metric="economicOccupancy" />
              </div>
              <CardTitle className="pt-1">
                {ready && econMin != null && econMax != null
                  ? `Economic occupancy held between ${formatPct(econMin)} and ${formatPct(econMax)} over 12 months`
                  : "Economic occupancy"}
              </CardTitle>
              <CardDescription>
                Rent earned ÷ gross potential rent, by month.
                {ready && econDelta != null && <> Latest month {formatPct(latestEcon?.economicOccupancy)} ({econDelta >= 0 ? "+" : "−"}{Math.abs(econDelta * 100).toFixed(1)} pts vs prior month).</>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full sm:h-64">
                <DataSection
                  skeleton={<ChartSkeleton />}
                  isEmpty={econ.length === 0}
                  empty={<EmptyState title="No financial history yet" description="Economic occupancy appears once monthly statements are loaded." />}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={econ} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(m: string) => formatMonthKey(m, true)}
                        minTickGap={16}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        dy={8}
                      />
                      <YAxis
                        domain={[0.9, 1]}
                        tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Tooltip
                        labelFormatter={(m) => formatMonthKey(String(m))}
                        formatter={(v: number, name) => [formatPct(v), name]}
                        contentStyle={{ borderRadius: 6, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      />
                      <Legend verticalAlign="top" align="right" height={28} iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="economicOccupancy" name="Actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
                      <Line type="monotone" dataKey="budgetEconomicOccupancy" name="Budget" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </DataSection>
              </div>
              {ready && <p className="mt-3 text-xs text-muted-foreground">
                Physical occupancy ({formatPct(funnel.physicalOccupancy)}) is a single rent-roll snapshot, so it can't be trended. Economic occupancy assumes rental income is net of vacancy; that assumption reconciles to rent-roll gross potential rent for {formatPct(model.gpr.matchRate, 0)} of property-months.
              </p>}
            </CardContent>
          </Card>

          <Card className="flex min-w-0 flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-danger-text" aria-hidden />
                <CardTitle>Attention Needed</CardTitle>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto xl:max-h-[340px]">
              <DataSection
                skeleton={<RowsSkeleton rows={3} />}
                isEmpty={attentionCount === 0}
                empty={<EmptyState compact icon={CheckCircle2} title="Nothing needs attention" description="No rent violations or overdue compliance items." />}
              >
                <ul className="divide-y divide-border">
                  {overRentUnits.slice(0, 3).map((u, i) => {
                    const property = properties.find(p => p.id === u.propertyId);
                    return (
                      <li key={`rent-${i}`}>
                        <Link href={`/properties/${u.propertyId}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none sm:px-6">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium">Rent restriction violation</span>
                              <StatusBadge tone="critical">Action required</StatusBadge>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{property?.name} · Unit {u.unitNumber}</p>
                            <p className="text-xs font-medium text-danger-text tabular-nums">
                              Rent {formatCurrency(u.currentRent)} exceeds max {formatCurrency(u.maxAllowableRent)}
                            </p>
                          </div>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </Link>
                      </li>
                    )
                  })}

                  {overdueItems.slice(0, 3).map((e, i) => {
                    const property = properties.find(p => p.id === e.propertyId);
                    return (
                      <li key={`comp-${i}`}>
                        <Link href={`/properties/${e.propertyId}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none sm:px-6">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="min-w-0 truncate text-sm font-medium">{e.eventType}</span>
                              <StatusBadge tone="critical">Overdue</StatusBadge>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{property?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Due <span className="font-medium text-foreground tabular-nums">{e.dueDate}</span>
                            </p>
                          </div>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </DataSection>
            </div>
            <div className="grid grid-cols-2 divide-x border-t">
              <Link href="/alerts" className="flex min-h-11 items-center justify-center gap-1 px-3 text-sm font-medium text-primary hover:bg-muted/60 hover:underline">
                All alerts <ChevronRight className="size-4" aria-hidden />
              </Link>
              <Link href="/actions" className="flex min-h-11 items-center justify-center gap-1 px-3 text-sm font-medium text-primary hover:bg-muted/60 hover:underline">
                Action Queue <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>
          </Card>
        </div>

        {/* Guided path: overview → diagnosis → action */}
        <section aria-labelledby="next-steps" className="space-y-3">
          <h2 id="next-steps" className="text-base font-semibold">Where to look next</h2>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {nextSteps.map((s, i) => (
              <li key={s.href}>
                <Link href={s.href} className="group flex h-full flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 sm:p-5">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground tabular-nums">{i + 1}</span>
                    <s.icon className="size-4 text-muted-foreground" aria-hidden />
                    {s.title}
                    <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  {ready && <span className="text-sm font-medium tabular-nums">{s.stat}</span>}
                  <span className="text-xs text-muted-foreground">{s.detail}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* Property Health Grid (List view simplified for dashboard) */}
        <Card className="min-w-0">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2"><SourceTag kind="property" /></div>
              <CardTitle className="pt-1">Property Health Overview</CardTitle>
              <CardDescription>Reported occupancy and the source-provided health score</CardDescription>
            </div>
            <Link href="/diagnosis" className="-my-2 flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
              Diagnose <ChevronRight className="size-4" aria-hidden />
            </Link>
          </CardHeader>
          <DataSection
            skeleton={<RowsSkeleton rows={5} />}
            empty={<EmptyState title="No properties yet" description="Properties appear here once they're added to the portfolio." />}
          >
            {/* Phone: stacked rows */}
            <ul className="divide-y border-t md:hidden">
              {properties.slice(0, 5).map((property) => (
                <li key={property.id}>
                  <Link href={`/properties/${property.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{property.name}</p>
                      <p className="text-xs text-muted-foreground">{property.city}, {property.state} · {formatPercentage(property.currentOccupancyPct)} reported</p>
                    </div>
                    <ScoreChip score={property.statusHealthScore} tone={healthTone(property.statusHealthScore)} />
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            {/* Tablet & desktop: table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right"><span className="inline-flex items-center gap-1.5">Reported occupancy <MetricInfo metric="reportedOccupancy" /></span></TableHead>
                    <TableHead className="text-right"><span className="inline-flex items-center gap-1.5">Health score <MetricInfo metric="healthScore" /></span></TableHead>
                    <TableHead className="text-right"><span className="sr-only">Action</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.slice(0, 5).map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>
                        <div className="font-medium">{property.name}</div>
                        <div className="text-xs text-muted-foreground">{property.city}, {property.state}</div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="ml-auto flex w-28 flex-col items-end gap-1.5">
                          {formatPercentage(property.currentOccupancyPct)}
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full", toneFill[occupancyTone(property.currentOccupancyPct)])}
                              style={{ width: `${property.currentOccupancyPct * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <ScoreChip score={property.statusHealthScore} tone={healthTone(property.statusHealthScore)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/properties/${property.id}`} className="inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline">
                          Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataSection>
        </Card>
      </div>
    </AppLayout>
  )
}
