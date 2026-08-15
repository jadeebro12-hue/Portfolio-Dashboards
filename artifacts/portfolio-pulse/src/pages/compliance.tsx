import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { properties, complianceEvents } from "@/lib/mock-data"
import { Link } from "wouter"
import { CalendarDays, List, Filter, CheckCircle2 } from "lucide-react"

export default function ComplianceTracker() {
  
  // Group events
  const overdue = complianceEvents.filter(e => e.status === 'overdue');
  const dueThisWeek = complianceEvents.filter(e => e.status === 'due-this-week');
  const upcoming = complianceEvents.filter(e => e.status === 'upcoming');
  const completed = complianceEvents.filter(e => e.status === 'completed');

  const renderEventList = (events: typeof complianceEvents, badgeType: string) => {
    if (events.length === 0) return (
      <div className="py-4 text-sm text-muted-foreground italic">No events in this category.</div>
    );
    
    return (
      <div className="space-y-3 mt-4">
        {events.map((e) => {
          const property = properties.find(p => p.id === e.propertyId);
          return (
            <div key={e.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:border-primary/30 transition-colors">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{e.eventType}</span>
                  {badgeType === 'destructive' && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Overdue</Badge>}
                  {badgeType === 'warning' && <Badge variant="warning" className="h-5 px-1.5 text-[10px]">Due Soon</Badge>}
                  {badgeType === 'secondary' && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Upcoming</Badge>}
                </div>
                <Link href={`/properties/${e.propertyId}`} className="text-sm text-primary hover:underline font-medium">
                  {property?.name}
                </Link>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm font-medium">{e.dueDate}</div>
                  <div className="text-xs text-muted-foreground">Date</div>
                </div>
                {e.status !== 'completed' && (
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compliance Tracker</h1>
            <p className="text-muted-foreground mt-1">Manage regulatory requirements across all properties.</p>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
            <Button variant="secondary" size="sm" className="shadow-sm">
              <List className="h-4 w-4 mr-2" /> List
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <CalendarDays className="h-4 w-4 mr-2" /> Calendar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-destructive">Overdue</div>
                <div className="text-2xl font-bold text-destructive">{overdue.length}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-warning bg-warning/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-warning-foreground">Due This Week</div>
                <div className="text-2xl font-bold text-warning-foreground">{dueThisWeek.length}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Upcoming (30d)</div>
                <div className="text-2xl font-bold">{upcoming.length}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold">{completed.length}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-8">
          {overdue.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-destructive flex items-center gap-2 border-b pb-2">
                Action Required (Overdue)
              </h2>
              {renderEventList(overdue, 'destructive')}
            </section>
          )}

          {dueThisWeek.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-warning-foreground flex items-center gap-2 border-b pb-2">
                Due This Week
              </h2>
              {renderEventList(dueThisWeek, 'warning')}
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
              Upcoming
            </h2>
            {renderEventList(upcoming.slice(0, 5), 'secondary')}
            {upcoming.length > 5 && (
              <Button variant="ghost" className="w-full mt-2 text-muted-foreground">
                View {upcoming.length - 5} more upcoming events
              </Button>
            )}
          </section>
        </div>

      </div>
    </AppLayout>
  )
}
