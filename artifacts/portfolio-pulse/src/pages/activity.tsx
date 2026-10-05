import { Link } from "wouter"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CalendarClock, Info } from "lucide-react"

import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KpiCard } from "@/components/kpi-card"
import { ChartSkeleton, DataSection, EmptyState } from "@/components/data-states"
import { FilterBar } from "@/components/analytics/filter-bar"
import { MetricInfo, SourceTag } from "@/components/analytics/metric-info"
import { BarRow } from "@/components/analytics/bars"
import { useFilteredModel } from "@/lib/analytics/use-analytics"
import { formatMonthKey, toISODate } from "@/lib/analytics/dates"
import { expirationSchedule, expiringWithin, leaseStartsByMonth, leaseStartsInWindow } from "@/lib/analytics/leasing"
import { bedroomLabel } from "@/lib/analytics/inventory"
import { groupBy } from "@/lib/analytics/dedupe"
import { formatCount, formatPct, formatSignedCount, safeDivide } from "@/lib/analytics/format"
import { cn } from "@/lib/utils"

const BUCKET_FILL = { critical: "bg-destructive", warning: "bg-warning", neutral: "bg-primary/70" } as const

export default function Activity() {
  const { model, properties, units, window, previous, filters } = useFilteredModel()
  const asOf = model.asOf

  const starts = leaseStartsInWindow(units, window, asOf)
  const prevStarts = leaseStartsInWindow(units, previous, asOf)
  const byMonth = leaseStartsByMonth(units, asOf, 12)
  const schedule = expirationSchedule(units, asOf)
  const expiring90 = expiringWithin(units, asOf, 90)
  const leased = units.filter((u) => u.status === "occupied" || u.status === "notice").length
  const maxBucket = Math.max(1, ...schedule.map((b) => b.count))
  // Flag the latest months as possibly incomplete only when they fall well
  // below the average of the earlier months (a posting-lag signature).
  const baseline = byMonth.slice(0, -2)
  const avgStarts = baseline.length ? baseline.reduce((a, m) => a + m.count, 0) / baseline.length : null
  const lagging = new Set(
    byMonth.filter((m, i) => i >= byMonth.length - 2 && avgStarts != null && avgStarts > 0 && m.count < avgStarts * 0.5).map((m) => m.month),
  )

  const byProperty = groupBy(units, (u) => u.propertyId)
  const propertyRows = properties
    .map((p) => {
      const us = byProperty.get(p.id) ?? []
      return {
        property: p,
        units: us.length,
        starts: leaseStartsInWindow(us, window, asOf),
        expiring90: expiringWithin(us, asOf, 90),
        notice: us.filter((u) => u.status === "notice").length,
        vacant: us.filter((u) => u.status === "vacant").length,
      }
    })
    .filter((r) => r.units > 0)
    .sort((a, b) => b.expiring90 - a.expiring90)

  const byBedroom = groupBy(units, (u) => u.bedrooms ?? -1)
  const bedroomRows = [...byBedroom.entries()]
    .sort(([a], [b]) => a - b)
    .map(([b, us]) => ({
      label: bedroomLabel(b === -1 ? null : b),
      units: us.length,
      starts: leaseStartsInWindow(us, window, asOf),
      expiring90: expiringWithin(us, asOf, 90),
      notice: us.filter((u) => u.status === "notice").length,
    }))

  const windowText = `${toISODate(window.start)} – ${toISODate(window.end)}`

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Leasing & Listing Activity"
          description="Lease velocity and upcoming turnover from the rent roll. Listing-market activity needs a listing feed."
        />

        <FilterBar windowLabel="Activity window" />

        <section aria-label="Activity metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={`Lease starts · last ${filters.windowDays}d`}
            metric="leaseStarts"
            value={formatCount(starts)}
            detail={<>{formatSignedCount(starts - prevStarts)} vs prior {filters.windowDays}d ({formatCount(prevStarts)})</>}
            footer="Current residents only — earlier periods undercount"
          />
          <KpiCard
            label="Expiring · next 90d"
            metric="leaseExpirations"
            icon={CalendarClock}
            value={formatCount(expiring90)}
            detail={`${formatPct(safeDivide(expiring90, leased))} of leased units`}
            footer={`${formatCount(schedule[0].count)} leases already past their end date`}
          />
          <KpiCard
            label={`New listings · last ${filters.windowDays}d`}
            metric="newListings"
            value={null}
            unavailable="No listing feed connected"
            footer="Delistings: N/A"
          />
          <KpiCard
            label="Days on market"
            metric="daysOnMarket"
            value={null}
            unavailable="Needs listed_at dates"
            footer="Time to lease: N/A — needs available_at and lease_signed_at"
          />
        </section>

        <DataSection
          skeleton={<Card className="p-6"><div className="h-64"><ChartSkeleton /></div></Card>}
          isEmpty={units.length === 0}
          empty={<Card><EmptyState title="No units match these filters" description="Widen or reset the filters to see leasing activity." /></Card>}
        >
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Lease starts by month */}
            <Card className="min-w-0">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <SourceTag kind="units" />
                  <MetricInfo metric="leaseStarts" />
                </div>
                <CardTitle className="pt-1">
                  {avgStarts == null
                    ? "Current leases by start month"
                    : lagging.size > 0
                      ? `Current leases started at about ${formatCount(avgStarts)} a month, but the latest ${lagging.size === 1 ? "month looks" : "months look"} incomplete`
                      : `Current leases started at about ${formatCount(avgStarts)} a month`}
                </CardTitle>
                <CardDescription>Trailing 12 months. Each bar counts residents still in place.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tickFormatter={(m: string) => formatMonthKey(m, true)} tickLine={false} axisLine={false} minTickGap={8} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        labelFormatter={(m) => formatMonthKey(String(m))}
                        formatter={(v: number) => [formatCount(v), "Lease starts"]}
                        contentStyle={{ borderRadius: 6, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                        {byMonth.map((m, i) => (
                          <Cell key={m.month} fill={lagging.has(m.month) ? "hsl(var(--muted-foreground) / 0.45)" : "hsl(var(--primary))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    {lagging.size > 0 && (
                      <>Grey bars are under half the earlier monthly average ({[...lagging].map((m) => `${formatMonthKey(m)}: ${byMonth.find((x) => x.month === m)?.count}`).join(", ")}). That pattern often means new leases post to the rent roll with a lag — confirm before reading it as a slowdown. </>
                    )}
                    Earlier months undercount residents who have since moved out.
                  </span>
                </p>
              </CardContent>
            </Card>

            {/* Expiration schedule */}
            <Card className="min-w-0">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <SourceTag kind="units" />
                  <MetricInfo metric="leaseExpirations" />
                </div>
                <CardTitle className="pt-1">
                  {formatCount(schedule[0].count)} leased units are past their lease end; {formatCount(schedule[1].count)} more expire in 30 days
                </CardTitle>
                <CardDescription>Lease expiration schedule for leased units with valid lease dates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {schedule.map((b) => (
                  <BarRow key={b.key} label={b.label} value={formatCount(b.count)} share={b.count / maxBucket} barClassName={BUCKET_FILL[b.tone]} />
                ))}
                <p className="border-t pt-3 text-xs text-muted-foreground">
                  “Already expired” usually means a renewal or month-to-month status wasn't recorded. Each is in the{" "}
                  <Link href="/actions" className="font-medium text-primary hover:underline max-sm:py-[15px]">Action Queue</Link> as a low-severity record check.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Listing activity: unavailable */}
          <Card className="border-dashed shadow-none">
            <CardHeader>
              <SourceTag kind="listings" className="self-start" />
              <CardTitle className="pt-1">Listing activity isn't available</CardTitle>
              <CardDescription>These views are built and tested but need a listing feed. They are not estimated from vacancy.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["New listings over time", "listed_at"],
                  ["Delistings over time", "delisted_at"],
                  ["Active-listing trend", "daily listing snapshots"],
                  ["Days on market / listing age", "listed_at, status"],
                  ["Time to lease", "available_at, lease_signed_at"],
                  ["Advertised vs in-place rent", "asking_rent"],
                ].map(([title, fields]) => (
                  <li key={title} className="rounded-md border border-dashed p-3">
                    <p className="font-medium">{title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Needs: {fields}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Activity by property and unit type */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <Card className="min-w-0 overflow-hidden xl:col-span-3">
              <CardHeader>
                <SourceTag kind="units" className="self-start" />
                <CardTitle className="pt-1">Turnover pressure by property</CardTitle>
                <CardDescription>Sorted by leases expiring in the next 90 days. Lease starts use the {filters.windowDays}-day window ({windowText}).</CardDescription>
              </CardHeader>
              <Table className="min-w-[520px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Starts</TableHead>
                    <TableHead className="text-right">Expiring 90d</TableHead>
                    <TableHead className="text-right">Notice</TableHead>
                    <TableHead className="text-right">Vacant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyRows.map((r) => (
                    <TableRow key={r.property.id}>
                      <TableCell><Link href={`/properties/${r.property.id}`} className="inline-flex min-h-11 items-center md:min-h-0 font-medium hover:underline">{r.property.name}</Link></TableCell>
                      <TableCell className="text-right tabular-nums">{r.units}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.starts}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{r.expiring90}</TableCell>
                      <TableCell className={cn("text-right tabular-nums", r.notice > 0 && "text-warning-text")}>{r.notice}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.vacant}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="min-w-0 overflow-hidden xl:col-span-2">
              <CardHeader>
                <SourceTag kind="units" className="self-start" />
                <CardTitle className="pt-1">Activity by unit type</CardTitle>
                <CardDescription>Bedrooms only — the source has no bathroom or floor-plan field.</CardDescription>
              </CardHeader>
              <Table className="min-w-[360px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Starts</TableHead>
                    <TableHead className="text-right">Expiring 90d</TableHead>
                    <TableHead className="text-right">Notice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bedroomRows.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.units}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.starts}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.expiring90}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.notice}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </DataSection>
      </div>
    </AppLayout>
  )
}
