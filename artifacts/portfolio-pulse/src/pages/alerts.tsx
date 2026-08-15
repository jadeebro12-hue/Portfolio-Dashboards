import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  getOverRentUnits, 
  getOverdueCompliance, 
  getNegativeNOIProperties,
  properties 
} from "@/lib/mock-data"
import { Link } from "wouter"
import { AlertTriangle, AlertCircle, DollarSign, ArrowRight } from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/utils"

export default function Alerts() {
  const overRent = getOverRentUnits();
  const overdueComp = getOverdueCompliance();
  const negativeNOI = getNegativeNOIProperties();
  
  const totalAlerts = overRent.length + overdueComp.length + negativeNOI.length;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-3">
            <AlertTriangle className="h-8 w-8" />
            Attention Needed
          </h1>
          <p className="text-muted-foreground mt-2">
            You have {totalAlerts} items requiring intervention across the portfolio.
          </p>
        </div>

        {overRent.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader className="bg-destructive/5 pb-4 border-b">
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Rent Restriction Violations ({overRent.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {overRent.map(u => {
                  const prop = properties.find(p => p.id === u.propertyId);
                  return (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <div className="font-semibold">{prop?.name} - Unit {u.unitNumber}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Current rent {formatCurrency(u.currentRent)} exceeds max allowable {formatCurrency(u.maxAllowableRent)} 
                          ({u.amiTier}% AMI restriction).
                        </div>
                      </div>
                      <Link href={`/properties/${u.propertyId}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted">Resolve <ArrowRight className="ml-1 h-3 w-3"/></Badge>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {overdueComp.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader className="bg-destructive/5 pb-4 border-b">
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Overdue Compliance Events ({overdueComp.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {overdueComp.map(e => {
                  const prop = properties.find(p => p.id === e.propertyId);
                  return (
                    <div key={e.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <div className="font-semibold">{prop?.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {e.eventType} was due on <span className="font-medium text-destructive">{e.dueDate}</span>
                        </div>
                      </div>
                      <Link href={`/compliance`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted">Resolve <ArrowRight className="ml-1 h-3 w-3"/></Badge>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {negativeNOI.length > 0 && (
          <Card className="border-warning/50">
            <CardHeader className="bg-warning/10 pb-4 border-b">
              <CardTitle className="text-lg text-warning-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Severe Financial Underperformance ({negativeNOI.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {negativeNOI.map((item, idx) => {
                  return (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <div className="font-semibold">{item.property.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          NOI missed budget by <span className="font-medium text-destructive">{formatCurrency(item.variance)}</span> ({formatPercentage(item.variancePct)}).
                        </div>
                      </div>
                      <Link href={`/properties/${item.property.id}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted">Review <ArrowRight className="ml-1 h-3 w-3"/></Badge>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </AppLayout>
  )
}
