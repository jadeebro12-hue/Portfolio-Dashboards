import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  units, 
  financials, 
  complianceEvents,
  getOverRentUnits,
  getOverdueCompliance,
  getDueThisWeekCompliance,
  getNegativeNOIProperties
} from "@/lib/mock-data"
import { cn, formatCurrency, formatPercentage } from "@/lib/utils"
import { format, subMonths } from "date-fns"
import { Link } from "wouter"
import { Building2, AlertCircle, ShieldAlert, ArrowUpRight, ArrowDownRight, TrendingUp, ChevronRight, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { KpiCard } from "@/components/kpi-card"
import { StatusBadge, ScoreChip } from "@/components/status-badge"
import { DataSection, ChartSkeleton, RowsSkeleton, EmptyState } from "@/components/data-states"
import { healthTone, occupancyTone, toneFill } from "@/lib/status"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine
} from "recharts"

export default function Overview() {
  const totalUnits = properties.reduce((acc, p) => acc + p.totalUnits, 0);
  const occupiedUnits = units.filter(u => u.occupancyStatus !== 'vacant').length;
  const portfolioOccupancy = occupiedUnits / totalUnits;
  
  const overdueItems = getOverdueCompliance();
  const dueThisWeekItems = getDueThisWeekCompliance();
  const overRentUnits = getOverRentUnits();
  const negativeNOI = getNegativeNOIProperties();
  
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
  const lastMonthFinancials = financials.filter(f => f.month === lastMonth);
  
  const totalNOIActual = lastMonthFinancials.reduce((acc, f) => acc + (f.rentalIncome.actual + f.otherIncome.actual - f.vacancyLoss.actual - f.operatingExpenses.actual), 0);
  const totalNOIBudget = lastMonthFinancials.reduce((acc, f) => acc + (f.rentalIncome.budget + f.otherIncome.budget - f.vacancyLoss.budget - f.operatingExpenses.budget), 0);
  const noiVariance = totalNOIActual - totalNOIBudget;

  // Occupancy trend data (last 12 months)
  const occupancyTrend = Array.from({ length: 12 }).map((_, i) => {
    const d = subMonths(new Date(), 11 - i);
    return {
      month: format(d, 'MMM yyyy'),
      occupancy: 0.92 + (Math.sin(i) * 0.02) + (i * 0.003) // Mock trend
    };
  });

  // NOI Variance by property
  const noiChartData = lastMonthFinancials.map(f => {
    const actual = f.rentalIncome.actual + f.otherIncome.actual - f.vacancyLoss.actual - f.operatingExpenses.actual;
    const budget = f.rentalIncome.budget + f.otherIncome.budget - f.vacancyLoss.budget - f.operatingExpenses.budget;
    return {
      name: properties.find(p => p.id === f.propertyId)?.name || '',
      actual,
      budget,
      variance: actual - budget
    };
  }).sort((a, b) => a.variance - b.variance).slice(0, 8); // Top 8 largest variances

  const attentionCount = Math.min(overRentUnits.length, 3) + Math.min(overdueItems.length, 3);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Portfolio Overview"
          description={`At-a-glance metrics across ${properties.length} properties.`}
        />

        {/* Summary Cards */}
        <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total Units"
            icon={Building2}
            value={totalUnits.toLocaleString()}
            detail={<>{occupiedUnits.toLocaleString()} occupied · {totalUnits - occupiedUnits} vacant</>}
          />
          <KpiCard
            label="Portfolio Occupancy"
            icon={TrendingUp}
            value={formatPercentage(portfolioOccupancy)}
            detail={
              <span className="flex items-center gap-1">
                <ArrowUpRight className="size-3.5 text-success-text" aria-hidden />
                <span className="font-medium text-success-text">1.2%</span> from last month
              </span>
            }
          />
          <KpiCard
            label="NOI Variance · Last Month"
            icon={noiVariance < 0 ? ArrowDownRight : ArrowUpRight}
            tone={noiVariance < 0 ? "critical" : "good"}
            value={<>{noiVariance > 0 ? '+' : ''}{formatCurrency(noiVariance)}</>}
            detail={<>{formatCurrency(totalNOIActual)} actual vs {formatCurrency(totalNOIBudget)} budget</>}
          />
          <KpiCard
            label="Compliance Due"
            icon={ShieldAlert}
            emphasis="warning"
            value={overdueItems.length + dueThisWeekItems.length}
            detail={
              <span className="flex flex-wrap items-center gap-1.5">
                {overdueItems.length > 0 && (
                  <StatusBadge tone="critical">{overdueItems.length} overdue</StatusBadge>
                )}
                {dueThisWeekItems.length > 0 && (
                  <StatusBadge tone="warning">{dueThisWeekItems.length} due this week</StatusBadge>
                )}
              </span>
            }
          />
        </section>

        {/* Charts & Attention Needed */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="min-w-0 xl:col-span-2">
            <CardHeader>
              <CardTitle>Occupancy Trend</CardTitle>
              <CardDescription>Trailing 12-month portfolio average · dashed line marks the 95% target</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full sm:h-64">
                <DataSection
                  skeleton={<ChartSkeleton />}
                  empty={<EmptyState title="No occupancy history yet" description="Trend data appears after the first full month of rent rolls." />}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={occupancyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val: string) => val.slice(0, 3)}
                        minTickGap={16}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        dy={8}
                      />
                      <YAxis
                        domain={[0.85, 1]}
                        tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Occupancy']}
                        contentStyle={{ borderRadius: '6px', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                      />
                      <ReferenceLine y={0.95} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                      <Area
                        type="monotone"
                        dataKey="occupancy"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorOcc)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </DataSection>
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-w-0 flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-danger-text" aria-hidden />
                <CardTitle>Attention Needed</CardTitle>
              </div>
            </CardHeader>
            <div className="flex-1 overflow-y-auto xl:max-h-[300px]">
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
            <div className="border-t">
              <Link href="/alerts" className="flex min-h-11 items-center justify-center gap-1 px-4 text-sm font-medium text-primary hover:bg-muted/60 hover:underline">
                View all alerts <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>
          </Card>
        </div>

        {/* Property Health Grid (List view simplified for dashboard) */}
        <Card className="min-w-0">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Property Health Overview</CardTitle>
              <CardDescription>Quick status check across the portfolio</CardDescription>
            </div>
            <Link href="/properties" className="-my-2 flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ChevronRight className="size-4" aria-hidden />
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
                      <p className="text-xs text-muted-foreground">{property.city}, {property.state} · {formatPercentage(property.currentOccupancyPct)} occupied</p>
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
                    <TableHead className="text-right">Occupancy</TableHead>
                    <TableHead className="text-right">Health Score</TableHead>
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
