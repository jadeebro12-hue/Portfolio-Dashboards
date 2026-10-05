import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { properties, complianceEvents, financials } from "@/lib/mock-data"
import { formatPercentage, formatCurrency, cn } from "@/lib/utils"
import { Link } from "wouter"
import { Search, ChevronRight, SearchX } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { StatusBadge, ScoreChip } from "@/components/status-badge"
import { DataSection, RowsSkeleton, EmptyState } from "@/components/data-states"
import { healthTone, occupancyTone, toneText } from "@/lib/status"
import { useState } from "react"
import { format, subMonths } from "date-fns"

export default function PropertiesList() {
  const [searchTerm, setSearchTerm] = useState("")

  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM')
  
  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.state.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Same rules as before: any overdue → action required; any due this week → warning; else clear.
  const getComplianceStatus = (propertyId: string) => {
    const events = complianceEvents.filter(e => e.propertyId === propertyId);
    if (events.some(e => e.status === 'overdue')) return <StatusBadge tone="critical">Action required</StatusBadge>;
    if (events.some(e => e.status === 'due-this-week')) return <StatusBadge tone="warning">Due this week</StatusBadge>;
    return <StatusBadge tone="good">Clear</StatusBadge>;
  }

  const getNOIVariance = (propertyId: string) => {
    const f = financials.find(f => f.propertyId === propertyId && f.month === lastMonth);
    if (!f) return null;
    
    const actual = f.rentalIncome.actual + f.otherIncome.actual - f.vacancyLoss.actual - f.operatingExpenses.actual;
    const budget = f.rentalIncome.budget + f.otherIncome.budget - f.vacancyLoss.budget - f.operatingExpenses.budget;
    const variance = actual - budget;
    
    return (
      <span className={cn("font-medium", variance < 0 ? toneText.critical : toneText.good)}>
        {variance > 0 ? '+' : ''}{formatCurrency(variance)}
      </span>
    );
  }

  const fundingBadges = (sources: string[]) => (
    <div className="flex flex-wrap gap-1">
      {sources.map(f => (
        <Badge key={f} variant="outline" className="whitespace-nowrap rounded-md px-1.5 py-0 text-xs font-medium text-muted-foreground">{f}</Badge>
      ))}
    </div>
  )

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Properties"
          description={`Manage ${properties.length} affordable housing assets.`}
          actions={
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                aria-label="Search properties by name, city or state"
                placeholder="Search name, city or state"
                className="h-11 w-full bg-card pl-9 sm:h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          }
        />

        <Card className="min-w-0 overflow-hidden">
          <DataSection
            skeleton={<RowsSkeleton rows={8} />}
            isEmpty={filteredProperties.length === 0}
            empty={
              filteredProperties.length === 0 && searchTerm ? (
                <EmptyState
                  icon={SearchX}
                  title={`No properties match “${searchTerm}”`}
                  description="Try a different name, city or two-letter state code."
                  action={<Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>Clear search</Button>}
                />
              ) : (
                <EmptyState title="No properties yet" description="Properties appear here once they're added to the portfolio." />
              )
            }
          >
            {/* Phone: one card per property */}
            <ul className="divide-y md:hidden">
              {filteredProperties.map((property) => (
                <li key={property.id}>
                  <Link href={`/properties/${property.id}`} className="block space-y-3 p-4 hover:bg-muted/60">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{property.name}</p>
                        <p className="text-xs text-muted-foreground">{property.city}, {property.state}</p>
                      </div>
                      <ScoreChip score={property.statusHealthScore} tone={healthTone(property.statusHealthScore)} />
                      <ChevronRight className="mt-1.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </div>
                    <dl className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted-foreground">Units</dt>
                        <dd className="font-medium tabular-nums">{property.totalUnits}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">Occupancy</dt>
                        <dd className={cn("font-medium tabular-nums", property.currentOccupancyPct < 0.95 && toneText[occupancyTone(property.currentOccupancyPct)])}>
                          {formatPercentage(property.currentOccupancyPct)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted-foreground">NOI var (LM)</dt>
                        <dd className="tabular-nums">{getNOIVariance(property.id)}</dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap items-center gap-2">
                      {getComplianceStatus(property.id)}
                      {fundingBadges(property.fundingSources)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Tablet & desktop: table (scrolls sideways if it ever runs out of room) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-48">Property</TableHead>
                    <TableHead className="hidden xl:table-cell">Location</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Occupancy</TableHead>
                    <TableHead className="text-right">NOI Var (LM)</TableHead>
                    <TableHead className="hidden xl:table-cell">Funding</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.id} className="group">
                      <TableCell>
                        <Link href={`/properties/${property.id}`} className="flex flex-col font-medium hover:underline">
                          <span>{property.name}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            <span className="xl:hidden">{property.city}, {property.state}</span>
                            <span className="hidden xl:inline">{property.address}</span>
                          </span>
                          <span className="mt-1 text-xs font-normal text-muted-foreground xl:hidden">{property.fundingSources.join(" · ")}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">{property.city}, {property.state}</TableCell>
                      <TableCell className="text-right tabular-nums">{property.totalUnits}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={cn(property.currentOccupancyPct < 0.95 && cn("font-medium", toneText[occupancyTone(property.currentOccupancyPct)]))}>
                          {formatPercentage(property.currentOccupancyPct)}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {getNOIVariance(property.id)}
                      </TableCell>
                      <TableCell className="hidden max-w-56 xl:table-cell">
                        {fundingBadges(property.fundingSources)}
                      </TableCell>
                      <TableCell>
                        {getComplianceStatus(property.id)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ScoreChip score={property.statusHealthScore} tone={healthTone(property.statusHealthScore)} />
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
