import * as React from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { DataSection, EmptyState, RowsSkeleton } from "@/components/data-states"
import {
  getOverRentUnits,
  getOverdueCompliance,
  getNegativeNOIProperties,
  properties
} from "@/lib/mock-data"
import { Link } from "wouter"
import { AlertCircle, DollarSign, ArrowRight, CheckCircle2 } from "lucide-react"
import { formatCurrency, formatPercentage, cn } from "@/lib/utils"
import { toneText, type StatusTone } from "@/lib/status"
import { useDataState } from "@/lib/data-state"

function AlertGroup({
  title,
  count,
  tone,
  icon: Icon,
  children,
}: {
  title: string
  count: number
  tone: StatusTone
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <Card className={cn("overflow-hidden", tone === "critical" ? "border-destructive/30" : "border-warning/40")}>
      <CardHeader className={cn("border-b py-4 sm:py-4", tone === "critical" ? "bg-destructive/5" : "bg-warning/10")}>
        <CardTitle className={cn("flex items-center gap-2", toneText[tone])}>
          <Icon className="size-5 shrink-0" aria-hidden />
          {title}
          <span className="ml-auto rounded-full bg-card px-2 text-sm font-medium tabular-nums text-foreground shadow-sm">{count}</span>
        </CardTitle>
      </CardHeader>
      <ul className="divide-y divide-border">{children}</ul>
    </Card>
  )
}

function AlertRow({ title, detail, href, action }: { title: React.ReactNode; detail: React.ReactNode; href: string; action: string }) {
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </div>
      <Link
        href={href}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted sm:h-9"
      >
        {action} <ArrowRight className="size-4" aria-hidden />
      </Link>
    </li>
  )
}

export default function Alerts() {
  const overRent = getOverRentUnits();
  const overdueComp = getOverdueCompliance();
  const negativeNOI = getNegativeNOIProperties();

  const totalAlerts = overRent.length + overdueComp.length + negativeNOI.length;
  const { status } = useDataState();

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Attention Needed"
          description={
            status === "ready" ? (
              <>You have <span className="font-semibold text-danger-text tabular-nums">{totalAlerts}</span> items requiring intervention across the portfolio.</>
            ) : status === "loading" ? "Checking the portfolio…"
              : status === "empty" ? "No items need intervention."
              : "Alert counts are unavailable right now."
          }
        />

        <DataSection
          skeleton={<Card className="overflow-hidden"><RowsSkeleton rows={6} /></Card>}
          isEmpty={totalAlerts === 0}
          empty={<Card><EmptyState icon={CheckCircle2} title="All clear" description="No rent violations, overdue compliance events or NOI shortfalls right now." /></Card>}
        >
          <div className="flex flex-col gap-6">
            {overRent.length > 0 && (
              <AlertGroup title="Rent Restriction Violations" count={overRent.length} tone="critical" icon={AlertCircle}>
                {overRent.map(u => {
                  const prop = properties.find(p => p.id === u.propertyId);
                  return (
                    <AlertRow
                      key={u.id}
                      title={<>{prop?.name} · Unit {u.unitNumber}</>}
                      detail={<>Current rent <span className="font-medium text-danger-text tabular-nums">{formatCurrency(u.currentRent)}</span> exceeds max allowable <span className="tabular-nums">{formatCurrency(u.maxAllowableRent)}</span> ({u.amiTier}% AMI restriction).</>}
                      href={`/properties/${u.propertyId}`}
                      action="Resolve"
                    />
                  )
                })}
              </AlertGroup>
            )}

            {overdueComp.length > 0 && (
              <AlertGroup title="Overdue Compliance Events" count={overdueComp.length} tone="critical" icon={AlertCircle}>
                {overdueComp.map(e => {
                  const prop = properties.find(p => p.id === e.propertyId);
                  return (
                    <AlertRow
                      key={e.id}
                      title={prop?.name}
                      detail={<>{e.eventType} was due on <span className="font-medium text-danger-text tabular-nums">{e.dueDate}</span></>}
                      href="/compliance"
                      action="Resolve"
                    />
                  )
                })}
              </AlertGroup>
            )}

            {negativeNOI.length > 0 && (
              <AlertGroup title="Severe Financial Underperformance" count={negativeNOI.length} tone="warning" icon={DollarSign}>
                {negativeNOI.map((item, idx) => (
                  <AlertRow
                    key={idx}
                    title={item.property.name}
                    detail={<>NOI missed budget by <span className="font-medium text-danger-text tabular-nums">{formatCurrency(item.variance)}</span> ({formatPercentage(item.variancePct)}).</>}
                    href={`/properties/${item.property.id}`}
                    action="Review"
                  />
                ))}
              </AlertGroup>
            )}
          </div>
        </DataSection>
      </div>
    </AppLayout>
  )
}
