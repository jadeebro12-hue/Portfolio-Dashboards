import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { properties, units, financials, complianceEvents } from "@/lib/mock-data"
import { formatCurrency, formatPercentage, cn } from "@/lib/utils"
import { useParams, Link } from "wouter"
import { ArrowLeft, AlertTriangle, CheckCircle2, AlertCircle, ChevronRight, Clock, Building2, LineChart as LineChartIcon } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { StatusBadge } from "@/components/status-badge"
import { DataSection, ChartSkeleton, RowsSkeleton, EmptyState } from "@/components/data-states"
import { complianceStatus, healthTone, occupancyStatus, toneText } from "@/lib/status"
import { useDataState } from "@/lib/data-state"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Legend
} from "recharts"

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const property = properties.find(p => p.id === id);
  const ready = useDataState().status === "ready";
  
  if (!property) {
    return (
      <AppLayout>
        <Card>
          <EmptyState
            icon={Building2}
            title="Property not found"
            description="This property may have been removed, or the link is out of date."
            action={
              <Link href="/properties" className="inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted sm:h-10">
                <ArrowLeft className="size-4" aria-hidden /> Back to properties
              </Link>
            }
          />
        </Card>
      </AppLayout>
    );
  }

  const propUnits = units.filter(u => u.propertyId === id);
  const propFinancials = financials.filter(f => f.propertyId === id).sort((a,b) => a.month.localeCompare(b.month));
  const propCompliance = complianceEvents.filter(e => e.propertyId === id).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const overRentUnits = propUnits.filter(u => u.currentRent > u.maxAllowableRent);

  // Financials Chart Data
  const financialData = propFinancials.map(f => {
    const actual = f.rentalIncome.actual + f.otherIncome.actual - f.vacancyLoss.actual - f.operatingExpenses.actual;
    const budget = f.rentalIncome.budget + f.otherIncome.budget - f.vacancyLoss.budget - f.operatingExpenses.budget;
    return {
      month: f.month.substring(5), // just MM
      actual,
      budget,
      variance: actual - budget
    };
  });

  const latestFinancials = propFinancials[propFinancials.length - 1];

  const healthToneValue = healthTone(property.statusHealthScore);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow={
            <nav aria-label="Breadcrumb" className="-ml-2 mb-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Link href="/properties" className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 hover:text-foreground sm:min-h-8">
                <ArrowLeft className="size-4" aria-hidden /> Properties
              </Link>
              <ChevronRight className="size-4 shrink-0" aria-hidden />
              <span className="truncate font-medium text-foreground" aria-current="page">{property.name}</span>
            </nav>
          }
          title={property.name}
          description={`${property.address}, ${property.city}, ${property.state}`}
          actions={
            <dl className="grid w-full grid-cols-2 divide-x rounded-lg border bg-card shadow-sm sm:w-auto">
              <div className="px-4 py-3 sm:px-5">
                <dt className="text-xs font-medium text-muted-foreground">Health Score</dt>
                <dd className={cn("text-2xl font-semibold tabular-nums", ready ? toneText[healthToneValue] : "text-muted-foreground")}>
                  {ready ? <>{property.statusHealthScore}<span className="text-base font-medium text-muted-foreground">/100</span></> : "—"}
                </dd>
              </div>
              <div className="px-4 py-3 sm:px-5">
                <dt className="text-xs font-medium text-muted-foreground">Occupancy</dt>
                <dd className={cn("text-2xl font-semibold tabular-nums", !ready && "text-muted-foreground")}>{ready ? formatPercentage(property.currentOccupancyPct) : "—"}</dd>
              </div>
            </dl>
          }
        />

        <div className="-mt-2 flex flex-wrap gap-2">
          {property.fundingSources.map(f => (
            <Badge key={f} variant="secondary" className="rounded-md font-medium">{f}</Badge>
          ))}
          <Badge variant="outline" className="rounded-md font-medium text-muted-foreground">Placed in service <span className="ml-1 text-foreground tabular-nums">{property.placedInServiceDate}</span></Badge>
          <Badge variant="outline" className="rounded-md font-medium text-muted-foreground">Compliance ends <span className="ml-1 text-foreground tabular-nums">{property.compliancePeriodEndDate}</span></Badge>
        </div>

        <Tabs defaultValue="rent-roll" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:inline-flex sm:w-auto">
            <TabsTrigger value="rent-roll" className="px-1 text-[13px] sm:px-3 sm:text-sm">Rent Roll</TabsTrigger>
            <TabsTrigger value="financials" className="px-1 text-[13px] sm:px-3 sm:text-sm">Financials</TabsTrigger>
            <TabsTrigger value="compliance" className="px-1 text-[13px] sm:px-3 sm:text-sm">Compliance</TabsTrigger>
            <TabsTrigger value="occupancy" className="px-1 text-[13px] sm:px-3 sm:text-sm">Occupancy</TabsTrigger>
          </TabsList>

          {/* RENT ROLL TAB */}
          <TabsContent value="rent-roll" className="mt-4 sm:mt-6">
            <Card className="min-w-0 overflow-hidden">
              <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle>Unit Rent Roll</CardTitle>
                  <CardDescription>{ready ? `All ${property.totalUnits} units` : "Every unit"} with rent-restriction checks. Rows over the AMI limit are flagged.</CardDescription>
                  <p className="text-xs text-muted-foreground md:hidden">Swipe the table sideways to see rents →</p>
                </div>
                {overRentUnits.length > 0 && (
                  <StatusBadge tone="critical" dot={false} className="gap-1 self-start px-2.5 py-1">
                    <AlertTriangle className="size-3.5" aria-hidden />
                    {overRentUnits.length} {overRentUnits.length === 1 ? 'unit' : 'units'} over rent limit
                  </StatusBadge>
                )}
              </CardHeader>
              <DataSection
                skeleton={<RowsSkeleton rows={8} />}
                isEmpty={propUnits.length === 0}
                empty={<EmptyState title="No units on the rent roll" description="Units appear here once the rent roll is imported." />}
              >
                <Table containerClassName="max-h-[600px] border-t" className="min-w-[640px]">
                  <TableHeader className="sticky top-0 z-20 bg-muted shadow-[0_1px_0_hsl(var(--border))]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="sticky left-0 z-10 bg-muted">Unit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">Max Rent</TableHead>
                      <TableHead className="text-right">Actual Rent</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propUnits.map((u) => {
                      const isOver = u.currentRent > u.maxAllowableRent;
                      const occ = occupancyStatus[u.occupancyStatus];
                      return (
                        <TableRow key={u.id} className={cn("group", isOver && "bg-destructive/5 hover:bg-destructive/10")}>
                          <TableCell className={cn("sticky left-0 z-10 whitespace-nowrap font-medium tabular-nums", isOver ? "bg-[hsl(0_86%_97%)] group-hover:bg-[hsl(0_86%_95%)]" : "bg-card group-hover:bg-muted")}>
                            <span className="inline-flex items-center gap-1.5">
                              {u.unitNumber}
                              {isOver && <AlertCircle className="size-4 text-danger-text" aria-label="Over rent limit" />}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">{u.bedrooms}BR · {u.amiTier}% AMI</TableCell>
                          <TableCell><StatusBadge tone={occ.tone}>{occ.label}</StatusBadge></TableCell>
                          <TableCell className="whitespace-nowrap">{u.tenantName || <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(u.maxAllowableRent)}</TableCell>
                          <TableCell className={cn("text-right tabular-nums font-medium", isOver && "font-semibold text-danger-text")}>
                            {u.currentRent === 0 ? <span className="font-normal text-muted-foreground">—</span> : formatCurrency(u.currentRent)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {u.currentRent === 0 ? <span className="text-muted-foreground">—</span> : (
                              <span className={isOver ? "font-semibold text-danger-text" : "text-muted-foreground"}>
                                {isOver ? '+' : ''}{formatCurrency(u.currentRent - u.maxAllowableRent)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </DataSection>
            </Card>
          </TabsContent>

          {/* FINANCIALS TAB */}
          <TabsContent value="financials" className="mt-4 space-y-6 sm:mt-6">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Net Operating Income · 12 Months</CardTitle>
                <CardDescription>Actual vs budget by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full sm:h-72">
                  <DataSection
                    skeleton={<ChartSkeleton />}
                    isEmpty={financialData.length === 0}
                    empty={<EmptyState icon={LineChartIcon} title="No financials reported" description="Monthly operating statements haven't been submitted for this property." />}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={financialData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} minTickGap={8} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis width={52} tickFormatter={(val) => `$${Math.round(val/1000)}k`} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip formatter={(val: number) => formatCurrency(val)} labelFormatter={(m) => `Month ${m}`} contentStyle={{ borderRadius: '6px', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                        <Legend verticalAlign="top" align="right" height={32} iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="actual" name="Actual NOI" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="budget" name="Budget NOI" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </DataSection>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Latest Month Variance{latestFinancials ? ` (${latestFinancials.month})` : ''}</CardTitle>
                <CardDescription>Red marks a variance that hurts NOI</CardDescription>
              </CardHeader>
              <DataSection
                skeleton={<RowsSkeleton rows={5} />}
                isEmpty={!latestFinancials}
                empty={<EmptyState title="No statement for the latest month" />}
              >
                {latestFinancials && (
                <Table className="min-w-[480px]">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Line Item</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { label: "Rental Income", key: "rentalIncome", data: latestFinancials.rentalIncome, inverted: false },
                      { label: "Vacancy Loss", key: "vacancyLoss", data: latestFinancials.vacancyLoss, inverted: true },
                      { label: "Other Income", key: "otherIncome", data: latestFinancials.otherIncome, inverted: false },
                      { label: "Operating Expenses", key: "operatingExpenses", data: latestFinancials.operatingExpenses, inverted: true },
                      { label: "Debt Service", key: "debtService", data: latestFinancials.debtService, inverted: true },
                    ].map(item => {
                      const variance = item.data.actual - item.data.budget;
                      const isNegativeImpact = item.inverted ? variance > 0 : variance < 0;
                      return (
                        <TableRow key={item.key}>
                          <TableCell className="whitespace-nowrap font-medium">{item.label}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(item.data.actual)}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(item.data.budget)}</TableCell>
                          <TableCell className={cn("text-right tabular-nums font-medium", isNegativeImpact ? toneText.critical : toneText.good)}>
                            {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                )}
              </DataSection>
            </Card>
          </TabsContent>

          {/* COMPLIANCE TAB */}
          <TabsContent value="compliance" className="mt-4 sm:mt-6">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Compliance Events</CardTitle>
                <CardDescription>Upcoming deadlines and historical events for this property.</CardDescription>
              </CardHeader>
              <DataSection
                skeleton={<RowsSkeleton rows={3} />}
                isEmpty={propCompliance.length === 0}
                empty={<EmptyState icon={CheckCircle2} title="No compliance events" description="Nothing is scheduled or on record for this property." />}
              >
                <ul className="divide-y border-t">
                  {propCompliance.map((e) => {
                    const st = complianceStatus[e.status];
                    return (
                      <li key={e.id} className="flex items-start gap-3 px-4 py-4 sm:px-6">
                        <div className="mt-0.5 shrink-0">
                          {e.status === 'completed' ? <CheckCircle2 className="size-5 text-success-text" aria-hidden /> :
                           e.status === 'overdue' ? <AlertCircle className="size-5 text-danger-text" aria-hidden /> :
                           e.status === 'due-this-week' ? <AlertTriangle className="size-5 text-warning-text" aria-hidden /> :
                           <Clock className="size-5 text-info-text" aria-hidden />}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-medium">{e.eventType}</p>
                            <p className="text-sm text-muted-foreground">Due <span className="tabular-nums">{e.dueDate}</span></p>
                          </div>
                          <StatusBadge tone={st.tone} className="self-start sm:self-center">{st.label}</StatusBadge>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </DataSection>
            </Card>
          </TabsContent>

          {/* OCCUPANCY TAB */}
          <TabsContent value="occupancy" className="mt-4 sm:mt-6">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Occupancy History</CardTitle>
                <CardDescription>Last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed bg-muted/30">
                  <EmptyState
                    icon={LineChartIcon}
                    title="Monthly history isn't tracked yet"
                    description={<>Current occupancy is <span className="font-semibold text-foreground tabular-nums">{formatPercentage(property.currentOccupancyPct)}</span>. A month-by-month trend will appear once historical rent rolls are connected.</>}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

      </div>
    </AppLayout>
  )
}
