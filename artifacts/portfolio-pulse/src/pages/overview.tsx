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
import { Building2, AlertCircle, ShieldAlert, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"
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

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Overview</h1>
          <p className="text-muted-foreground mt-1">At a glance metrics across 18 properties.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnits}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {occupiedUnits} occupied ({totalUnits - occupiedUnits} vacant)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Occupancy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(portfolioOccupancy)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-success" /> 
                <span className="text-success font-medium">1.2%</span> from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NOI Variance (Last Month)</CardTitle>
              <span className="text-muted-foreground text-xs font-medium">vs Budget</span>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${noiVariance < 0 ? 'text-destructive' : 'text-success'}`}>
                {noiVariance > 0 ? '+' : ''}{formatCurrency(noiVariance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(totalNOIActual)} Actual / {formatCurrency(totalNOIBudget)} Budget
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Compliance</CardTitle>
              <ShieldAlert className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueItems.length + dueThisWeekItems.length}</div>
              <div className="text-xs mt-1 flex items-center gap-2">
                {overdueItems.length > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 rounded-sm font-mono">{overdueItems.length} Overdue</Badge>
                )}
                {dueThisWeekItems.length > 0 && (
                  <span className="text-warning-foreground font-medium">{dueThisWeekItems.length} Due this week</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Attention Needed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Occupancy Trend</CardTitle>
              <CardDescription>Trailing 12-month portfolio average</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={occupancyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                    />
                    <YAxis 
                      domain={[0.85, 1]} 
                      tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Occupancy']}
                      contentStyle={{ borderRadius: '6px', border: '1px solid hsl(var(--border))' }}
                    />
                    <ReferenceLine y={0.95} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
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
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Attention Needed</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto max-h-[300px]">
              <div className="divide-y divide-border">
                {overRentUnits.slice(0, 3).map((u, i) => {
                  const property = properties.find(p => p.id === u.propertyId);
                  return (
                    <Link key={`rent-${i}`} href={`/properties/${u.propertyId}`} className="block p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm">Rent Restriction Violation</span>
                        <Badge variant="destructive" className="h-5 px-1.5 rounded-sm">Action Req</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {property?.name} - Unit {u.unitNumber}
                      </div>
                      <div className="text-xs mt-1 font-medium text-destructive">
                        Rent {formatCurrency(u.currentRent)} exceeds max {formatCurrency(u.maxAllowableRent)}
                      </div>
                    </Link>
                  )
                })}
                
                {overdueItems.slice(0, 3).map((e, i) => {
                  const property = properties.find(p => p.id === e.propertyId);
                  return (
                    <Link key={`comp-${i}`} href={`/properties/${e.propertyId}`} className="block p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm truncate pr-2">{e.eventType}</span>
                        <Badge variant="destructive" className="h-5 px-1.5 rounded-sm shrink-0">Overdue</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {property?.name}
                      </div>
                      <div className="text-xs mt-1">
                        Due: <span className="font-medium">{e.dueDate}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
            <div className="p-3 border-t bg-muted/20 text-center">
              <Link href="/alerts" className="text-sm text-primary font-medium hover:underline">
                View all alerts &rarr;
              </Link>
            </div>
          </Card>

        </div>

        {/* Property Health Grid (List view simplified for dashboard) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Property Health Overview</CardTitle>
              <CardDescription>Quick status check across the portfolio</CardDescription>
            </div>
            <Link href="/properties" className="text-sm font-medium text-primary hover:underline">
              View full list
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Health Score</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.slice(0, 5).map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      {property.name}
                      <div className="text-xs text-muted-foreground font-normal">{property.city}, {property.state}</div>
                    </TableCell>
                    <TableCell>
                      {formatPercentage(property.currentOccupancyPct)}
                      <div className="w-24 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className={cn("h-full", property.currentOccupancyPct < 0.95 ? "bg-warning" : "bg-success")} 
                          style={{ width: `${property.currentOccupancyPct * 100}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs",
                          property.statusHealthScore >= 90 ? "bg-success/10 text-success" : 
                          property.statusHealthScore >= 80 ? "bg-warning/10 text-warning-foreground" : 
                          "bg-destructive/10 text-destructive"
                        )}>
                          {property.statusHealthScore}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/properties/${property.id}`} className="text-sm text-primary hover:underline">
                        Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
