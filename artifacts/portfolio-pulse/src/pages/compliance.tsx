import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KpiCard } from "@/components/kpi-card"
import { StatusBadge } from "@/components/status-badge"
import { DataSection, EmptyState, RowsSkeleton } from "@/components/data-states"
import { properties, complianceEvents } from "@/lib/mock-data"
import { complianceStatus, toneText, type StatusTone } from "@/lib/status"
import { cn } from "@/lib/utils"
import { Link } from "wouter"
import { CalendarDays, List, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react"

const UPCOMING_PREVIEW = 5

export default function ComplianceTracker() {
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)

  // Group events
  const overdue = complianceEvents.filter(e => e.status === 'overdue');
  const dueThisWeek = complianceEvents.filter(e => e.status === 'due-this-week');
  const upcoming = complianceEvents.filter(e => e.status === 'upcoming');
  const completed = complianceEvents.filter(e => e.status === 'completed');

  const renderEventList = (events: typeof complianceEvents) => {
    if (events.length === 0) return (
      <p className="py-4 text-sm text-muted-foreground">No events in this category.</p>
    );

    return (
      <ul className="mt-3 space-y-3">
        {events.map((e) => {
          const property = properties.find(p => p.id === e.propertyId);
          const st = complianceStatus[e.status];
          return (
            <li key={e.id}>
              <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{e.eventType}</span>
                    <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                  </div>
                  <Link href={`/properties/${e.propertyId}`} className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline sm:min-h-0">
                    {property?.name}
                  </Link>
                </div>

                <div className="flex items-center justify-between gap-4 border-t pt-3 sm:justify-end sm:gap-6 sm:border-0 sm:pt-0">
                  <div className="sm:text-right">
                    <div className="text-xs text-muted-foreground">Due date</div>
                    <div className={cn("text-sm font-medium tabular-nums", e.status === 'overdue' && toneText.critical)}>{e.dueDate}</div>
                  </div>
                  {e.status !== 'completed' && (
                    <Button variant="outline" size="sm">
                      <CheckCircle2 aria-hidden />
                      Mark complete
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    )
  }

  const sectionHeading = (label: string, count: number, tone?: StatusTone) => (
    <h2 className={cn("flex items-center gap-2 border-b pb-2 text-lg font-semibold", tone && toneText[tone])}>
      {label}
      <span className="rounded-full bg-muted px-2 text-sm font-medium tabular-nums text-muted-foreground">{count}</span>
    </h2>
  )

  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, UPCOMING_PREVIEW)

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">

        <PageHeader
          title="Compliance Tracker"
          description="Manage regulatory requirements across all properties."
          actions={
            <div role="group" aria-label="View" className="flex w-full items-center gap-1 rounded-lg border bg-muted/50 p-1 sm:w-auto">
              <Button variant="secondary" size="sm" className="flex-1 bg-card shadow-sm sm:flex-none" aria-pressed="true">
                <List aria-hidden /> List
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground sm:flex-none" disabled title="Calendar view is coming soon">
                <CalendarDays aria-hidden /> Calendar
                <span className="rounded bg-muted px-1 text-[11px] font-medium">Soon</span>
              </Button>
            </div>
          }
        />

        <section aria-label="Compliance summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="Overdue" value={overdue.length} tone="critical" emphasis="critical" />
          <KpiCard label="Due This Week" value={dueThisWeek.length} tone="warning" emphasis="warning" />
          <KpiCard label="Upcoming" value={upcoming.length} />
          <KpiCard label="Completed" value={completed.length} />
        </section>

        <DataSection
          skeleton={<Card className="overflow-hidden"><RowsSkeleton rows={6} /></Card>}
          isEmpty={complianceEvents.length === 0}
          empty={<Card><EmptyState icon={ShieldCheck} title="No compliance events scheduled" description="Recertifications, inspections and filings will appear here as they're scheduled." /></Card>}
        >
          <div className="flex flex-col gap-8">
            {overdue.length > 0 && (
              <section>
                {sectionHeading("Action Required (Overdue)", overdue.length, "critical")}
                {renderEventList(overdue)}
              </section>
            )}

            {dueThisWeek.length > 0 && (
              <section>
                {sectionHeading("Due This Week", dueThisWeek.length, "warning")}
                {renderEventList(dueThisWeek)}
              </section>
            )}

            <section>
              {sectionHeading("Upcoming", upcoming.length)}
              {renderEventList(visibleUpcoming)}
              {upcoming.length > UPCOMING_PREVIEW && (
                <Button
                  variant="ghost"
                  className="mt-2 w-full text-muted-foreground"
                  aria-expanded={showAllUpcoming}
                  onClick={() => setShowAllUpcoming(v => !v)}
                >
                  {showAllUpcoming ? (
                    <>Show fewer <ChevronUp aria-hidden /></>
                  ) : (
                    <>View {upcoming.length - UPCOMING_PREVIEW} more upcoming events <ChevronDown aria-hidden /></>
                  )}
                </Button>
              )}
            </section>
          </div>
        </DataSection>

      </div>
    </AppLayout>
  )
}
