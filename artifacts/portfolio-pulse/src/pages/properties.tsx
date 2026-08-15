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
import { Search, ArrowUpDown, Filter } from "lucide-react"
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

  const getComplianceStatus = (propertyId: string) => {
    const events = complianceEvents.filter(e => e.propertyId === propertyId);
    if (events.some(e => e.status === 'overdue')) return <Badge variant="destructive">Action Req</Badge>;
    if (events.some(e => e.status === 'due-this-week')) return <Badge variant="warning">Warning</Badge>;
    return <Badge variant="success" className="bg-success/10 text-success border-success/20">Clear</Badge>;
  }

  const getNOIVariance = (propertyId: string) => {
    const f = financials.find(f => f.propertyId === propertyId && f.month === lastMonth);
    if (!f) return null;
    
    const actual = f.rentalIncome.actual + f.otherIncome.actual - f.vacancyLoss.actual - f.operatingExpenses.actual;
    const budget = f.rentalIncome.budget + f.otherIncome.budget - f.vacancyLoss.budget - f.operatingExpenses.budget;
    const variance = actual - budget;
    
    return (
      <span className={variance < 0 ? "text-destructive font-medium" : "text-success"}>
        {variance > 0 ? '+' : ''}{formatCurrency(variance)}
      </span>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
            <p className="text-muted-foreground mt-1">Manage {properties.length} affordable housing assets.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search properties..."
                className="w-[250px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <div className="rounded-md border-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                      Property <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Occupancy</TableHead>
                  <TableHead className="text-right">NOI Var (LM)</TableHead>
                  <TableHead>Funding</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id} className="group">
                    <TableCell className="font-medium">
                      <Link href={`/properties/${property.id}`} className="hover:underline flex flex-col">
                        <span>{property.name}</span>
                        <span className="text-xs text-muted-foreground font-normal">{property.address}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{property.city}, {property.state}</TableCell>
                    <TableCell className="text-right tabular-nums">{property.totalUnits}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={property.currentOccupancyPct < 0.95 ? "text-warning-foreground font-medium" : ""}>
                        {formatPercentage(property.currentOccupancyPct)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {getNOIVariance(property.id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {property.fundingSources.map(f => (
                          <Badge key={f} variant="outline" className="text-[10px] py-0">{f}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getComplianceStatus(property.id)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold",
                        property.statusHealthScore >= 90 ? "bg-success/10 text-success" : 
                        property.statusHealthScore >= 80 ? "bg-warning/10 text-warning-foreground" : 
                        "bg-destructive/10 text-destructive"
                      )}>
                        {property.statusHealthScore}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProperties.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No properties found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
