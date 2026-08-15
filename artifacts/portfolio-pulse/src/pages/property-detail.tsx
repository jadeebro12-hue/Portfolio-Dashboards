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
import { ArrowLeft, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react"
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
  
  if (!property) {
    return <AppLayout><div>Property not found</div></AppLayout>;
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

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/properties" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Properties
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{property.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{property.name}</h1>
            <p className="text-muted-foreground mt-1">{property.address}, {property.city}, {property.state}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {property.fundingSources.map(f => (
                <Badge key={f} variant="secondary">{f}</Badge>
              ))}
              <Badge variant="outline">Placed in Service: {property.placedInServiceDate}</Badge>
              <Badge variant="outline">Compliance End: {property.compliancePeriodEndDate}</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-6 bg-card border rounded-lg p-4 shadow-sm">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Health Score</div>
              <div className={cn(
                "text-2xl font-bold",
                property.statusHealthScore >= 90 ? "text-success" : 
                property.statusHealthScore >= 80 ? "text-warning-foreground" : "text-destructive"
              )}>
                {property.statusHealthScore}/100
              </div>
            </div>
            <div className="h-10 w-px bg-border"></div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Occupancy</div>
              <div className="text-2xl font-bold">{formatPercentage(property.currentOccupancyPct)}</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="rent-roll" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-4 max-w-[500px]">
            <TabsTrigger value="rent-roll">Rent Roll</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          </TabsList>
          
          {/* RENT ROLL TAB */}
          <TabsContent value="rent-roll" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Unit Rent Roll</CardTitle>
                  <CardDescription>All {property.totalUnits} units with compliance checks.</CardDescription>
                </div>
                {overRentUnits.length > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1 text-sm py-1">
                    <AlertTriangle className="h-4 w-4" />
                    {overRentUnits.length} Units Over Rent Limits
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                      <TableRow>
                        <TableHead>Unit</TableHead>
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
                        return (
                          <TableRow key={u.id} className={isOver ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                            <TableCell className="font-medium">
                              {u.unitNumber}
                              {isOver && <AlertCircle className="inline-block ml-2 h-4 w-4 text-destructive" />}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{u.bedrooms}BR • {u.amiTier}% AMI</TableCell>
                            <TableCell>
                              {u.occupancyStatus === 'vacant' ? (
                                <Badge variant="outline" className="text-muted-foreground">Vacant</Badge>
                              ) : u.occupancyStatus === 'notice' ? (
                                <Badge variant="warning" className="bg-warning/20">On Notice</Badge>
                              ) : (
                                <Badge variant="success" className="bg-success/10 text-success">Occupied</Badge>
                              )}
                            </TableCell>
                            <TableCell>{u.tenantName || '-'}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatCurrency(u.maxAllowableRent)}</TableCell>
                            <TableCell className={cn("text-right tabular-nums font-medium", isOver && "text-destructive font-bold")}>
                              {u.currentRent === 0 ? '-' : formatCurrency(u.currentRent)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {u.currentRent === 0 ? '-' : (
                                <span className={isOver ? "text-destructive font-bold" : "text-muted-foreground"}>
                                  {formatCurrency(u.currentRent - u.maxAllowableRent)}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FINANCIALS TAB */}
          <TabsContent value="financials" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Net Operating Income (NOI) - 12 Months</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={financialData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tickFormatter={(val) => `$${val/1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Legend />
                      <Line type="monotone" dataKey="actual" name="Actual NOI" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="budget" name="Budget NOI" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest Month Variance ({latestFinancials.month})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                          <TableCell className="font-medium">{item.label}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(item.data.actual)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(item.data.budget)}</TableCell>
                          <TableCell className={cn("text-right tabular-nums", isNegativeImpact ? "text-destructive font-medium" : "text-success")}>
                            {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMPLIANCE TAB */}
          <TabsContent value="compliance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Events</CardTitle>
                <CardDescription>Upcoming deadlines and historical events for this property.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {propCompliance.map((e) => (
                    <div key={e.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {e.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-success" /> : 
                           e.status === 'overdue' ? <AlertCircle className="h-5 w-5 text-destructive" /> :
                           e.status === 'due-this-week' ? <AlertTriangle className="h-5 w-5 text-warning" /> :
                           <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />}
                        </div>
                        <div>
                          <div className="font-medium">{e.eventType}</div>
                          <div className="text-sm text-muted-foreground mt-0.5">Due: {e.dueDate}</div>
                        </div>
                      </div>
                      <div>
                        {e.status === 'overdue' && <Badge variant="destructive">Overdue</Badge>}
                        {e.status === 'due-this-week' && <Badge variant="warning">Due Soon</Badge>}
                        {e.status === 'completed' && <Badge variant="outline" className="text-muted-foreground">Completed</Badge>}
                        {e.status === 'upcoming' && <Badge variant="secondary">Upcoming</Badge>}
                      </div>
                    </div>
                  ))}
                  {propCompliance.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">No compliance events found.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OCCUPANCY TAB */}
          <TabsContent value="occupancy" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Occupancy History</CardTitle>
                <CardDescription>Last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                  Detailed occupancy history chart would render here. <br/>
                  Current occupancy is {formatPercentage(property.currentOccupancyPct)}.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

      </div>
    </AppLayout>
  )
}
