import * as React from "react"
import { Link } from "wouter"
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, ChevronLeft, ChevronRight, CircleSlash, Download, ListChecks } from "lucide-react"

import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DataSection, EmptyState, RowsSkeleton } from "@/components/data-states"
import { FilterBar } from "@/components/analytics/filter-bar"
import { ConfidenceBadge, SeverityBadge } from "@/components/analytics/confidence"
import { SourceTag } from "@/components/analytics/metric-info"
import { useFilteredModel } from "@/lib/analytics/use-analytics"
import { useDataState } from "@/lib/data-state"
import {
  DATA_SOURCE_LABEL,
  RULES,
  SEVERITY_RANK,
  exceptionsToCsv,
  type ExceptionRow,
  type RuleId,
  type Severity,
} from "@/lib/analytics/exceptions"
import { toISODate } from "@/lib/analytics/dates"
import { formatCount } from "@/lib/analytics/format"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 25
type SortKey = "severity" | "property" | "type" | "observed"

const SORTS: Record<SortKey, (a: ExceptionRow, b: ExceptionRow) => number> = {
  severity: (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  property: (a, b) => a.propertyName.localeCompare(b.propertyName),
  type: (a, b) => RULES[a.rule].label.localeCompare(RULES[b.rule].label),
  observed: (a, b) => (a.observedAt?.getTime() ?? 0) - (b.observedAt?.getTime() ?? 0),
}

function downloadCsv(rows: readonly ExceptionRow[], asOf: Date) {
  const blob = new Blob([exceptionsToCsv(rows)], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `portfolio-pulse-action-queue-${toISODate(asOf)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ActionQueue() {
  const { model, exceptions: allExceptions } = useFilteredModel()
  const { status } = useDataState()
  const ready = status === "ready"
  // Nothing data-derived is shown while loading, empty or errored.
  const exceptions = React.useMemo(() => (ready ? allExceptions : []), [ready, allExceptions])
  const [rule, setRule] = React.useState<RuleId | "all">("all")
  const [severity, setSeverity] = React.useState<Severity | "all">("all")
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "severity", dir: "asc" })
  const [page, setPage] = React.useState(0)
  const [expanded, setExpanded] = React.useState<string | null>(null)

  const counts = React.useMemo(() => {
    const c: Record<Severity, number> = { high: 0, medium: 0, low: 0 }
    for (const e of exceptions) c[e.severity]++
    return c
  }, [exceptions])

  const ruleOptions = React.useMemo(() => {
    const m = new Map<RuleId, number>()
    for (const e of exceptions) m.set(e.rule, (m.get(e.rule) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => SEVERITY_RANK[RULES[a[0]].severity] - SEVERITY_RANK[RULES[b[0]].severity] || b[1] - a[1])
  }, [exceptions])

  const rows = React.useMemo(() => {
    const filtered = exceptions.filter((e) => (rule === "all" || e.rule === rule) && (severity === "all" || e.severity === severity))
    const cmp = SORTS[sort.key]
    return [...filtered].sort((a, b) => {
      const r = cmp(a, b)
      const primary = sort.dir === "asc" ? r : -r
      return primary || SORTS.severity(a, b) || a.propertyName.localeCompare(b.propertyName)
    })
  }, [exceptions, rule, severity, sort])

  React.useEffect(() => setPage(0), [rule, severity, sort, exceptions])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const visible = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "observed" ? "desc" : "asc" }))

  const sortHead = (label: string, key: SortKey, className?: string) => {
    const active = sort.key === key
    const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown
    return (
      <TableHead className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
        <button onClick={() => onSort(key)} className={cn("inline-flex min-h-8 items-center gap-1 uppercase tracking-wide hover:text-foreground", active && "text-foreground")}>
          {label} <Icon className="size-3" aria-hidden />
        </button>
      </TableHead>
    )
  }

  const ruleSummary = model.ruleSummary
  const evaluated = ruleSummary.filter((r) => r.notEvaluatedReason == null)
  const notEvaluated = ruleSummary.filter((r) => r.notEvaluatedReason != null)
  const passing = evaluated.filter((r) => r.count === 0)

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Action Queue"
          description="What to investigate next: compliance, data-quality and financial exceptions ranked by severity."
          actions={
            <Button variant="outline" onClick={() => downloadCsv(rows, model.asOf)} disabled={!ready || rows.length === 0} className="w-full sm:w-auto">
              <Download aria-hidden /> Export CSV{ready && ` (${formatCount(rows.length)})`}
            </Button>
          }
        />

        <FilterBar />

        {/* Severity summary doubles as a filter */}
        <section aria-label="Exceptions by severity" className="grid grid-cols-3 gap-3 sm:gap-4">
          {(["high", "medium", "low"] as Severity[]).map((s) => (
            <button
              key={s}
              onClick={() => setSeverity((cur) => (cur === s ? "all" : s))}
              aria-pressed={severity === s}
              className={cn(
                "flex min-h-11 flex-col items-start gap-1 rounded-lg border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 sm:p-4",
                severity === s && "border-primary ring-2 ring-primary/20",
              )}
            >
              <SeverityBadge severity={s} />
              <span className="text-2xl font-semibold tabular-nums">{ready ? formatCount(counts[s]) : "—"}</span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {s === "high" ? "Compliance or identity risk — act now" : s === "medium" ? "Verify this week" : "Housekeeping & early warnings"}
              </span>
            </button>
          ))}
        </section>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <CardTitle>
                {ready ? (
                  <>
                    {formatCount(rows.length)} {rows.length === 1 ? "exception" : "exceptions"}
                    {severity !== "all" && ` · ${severity} severity`}
                  </>
                ) : (
                  "Exceptions"
                )}
              </CardTitle>
              <CardDescription>Default order: severity, then property. Select a row to see the suggested action. All records were last observed in the snapshot dated {toISODate(model.asOf)}; “Key date” is the due date, lease end or statement month.</CardDescription>
            </div>
            <label className="flex min-w-0 flex-col gap-1 sm:w-72">
              <span className="text-xs font-medium text-muted-foreground">Exception type</span>
              <select
                value={rule}
                onChange={(e) => setRule(e.target.value as RuleId | "all")}
                className="h-11 w-full rounded-md border border-input bg-card px-2.5 text-sm sm:h-9"
              >
                <option value="all">All types</option>
                {ruleOptions.map(([id, n]) => (
                  <option key={id} value={id}>
                    {RULES[id].label} ({n})
                  </option>
                ))}
              </select>
            </label>
          </CardHeader>

          <DataSection
            skeleton={<RowsSkeleton rows={8} />}
            isEmpty={rows.length === 0}
            empty={
              <EmptyState
                icon={CheckCircle2}
                title="No exceptions match these filters"
                description="Nothing to act on for this selection. Checks that couldn't run are listed below — an empty queue isn't proof of clean data."
              />
            }
          >
            {/* Phone: cards */}
            <ul className="divide-y border-t md:hidden">
              {visible.map((e) => (
                <li key={e.id} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={e.severity} />
                    <span className="text-sm font-semibold">{RULES[e.rule].label}</span>
                  </div>
                  <p className="text-sm">
                    {e.propertyId ? <Link href={`/properties/${e.propertyId}`} className="inline-flex min-h-11 items-center font-medium text-primary hover:underline">{e.propertyName}</Link> : e.propertyName}
                    <span className="text-muted-foreground"> · {e.record}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{e.reason}</p>
                  <p className="text-xs text-muted-foreground">{e.context}{e.observedAt && ` · key date ${toISODate(e.observedAt)}`}</p>
                  {e.confidence && <ConfidenceBadge tier={e.confidence} />}
                  <details className="text-xs">
                    <summary className="flex min-h-11 cursor-pointer items-center font-medium text-primary">Suggested action</summary>
                    <p className="rounded-md bg-muted/50 p-2">{RULES[e.rule].action}</p>
                  </details>
                </li>
              ))}
            </ul>

            {/* Tablet & desktop: table */}
            <div className="hidden md:block">
              <Table className="[&_td]:px-2 [&_th]:px-2 min-w-[680px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    {sortHead("Severity", "severity")}
                    {sortHead("Exception", "type")}
                    {sortHead("Property", "property")}
                    <TableHead>Record</TableHead>
                    <TableHead>Reason</TableHead>
                    {sortHead("Key date", "observed", "hidden text-right xl:table-cell")}
                    <TableHead className="hidden xl:table-cell">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((e) => {
                    const open = expanded === e.id
                    return (
                      <React.Fragment key={e.id}>
                        <TableRow
                          className={cn("cursor-pointer", open && "bg-muted/40")}
                          onClick={() => setExpanded(open ? null : e.id)}
                        >
                          <TableCell><SeverityBadge severity={e.severity} /></TableCell>
                          <TableCell className="font-medium">
                            <button
                              className="text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={(ev) => { ev.stopPropagation(); setExpanded(open ? null : e.id) }}
                              aria-expanded={open}
                            >
                              {RULES[e.rule].label}
                            </button>
                          </TableCell>
                          <TableCell className="min-w-32">
                            {e.propertyId ? <Link href={`/properties/${e.propertyId}`} onClick={(ev) => ev.stopPropagation()} className="hover:underline">{e.propertyName}</Link> : e.propertyName}
                          </TableCell>
                          <TableCell>
                            <div className="min-w-28">{e.record}</div>
                            <div className="text-xs text-muted-foreground">{e.context}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground xl:hidden">
                              {e.observedAt && <span className="tabular-nums">{toISODate(e.observedAt)}</span>}
                              {e.confidence && <ConfidenceBadge tier={e.confidence} />}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-48 max-w-80 text-sm">{e.reason}</TableCell>
                          <TableCell className="hidden whitespace-nowrap text-right tabular-nums text-muted-foreground xl:table-cell">{e.observedAt ? toISODate(e.observedAt) : "—"}</TableCell>
                          <TableCell className="hidden xl:table-cell">{e.confidence ? <ConfidenceBadge tier={e.confidence} /> : <span className="text-xs text-muted-foreground">n/a</span>}</TableCell>
                        </TableRow>
                        {open && (
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableCell colSpan={7} className="pt-0">
                              <div className="flex flex-col gap-1 rounded-md border bg-card p-3 text-sm">
                                <span><span className="font-medium">Suggested action: </span>{RULES[e.rule].action}</span>
                                <span className="text-xs text-muted-foreground">Source: {DATA_SOURCE_LABEL[RULES[e.rule].source]}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {pageCount > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-6">
                <p className="text-sm text-muted-foreground tabular-nums">
                  {page * PAGE_SIZE + 1}–{Math.min(rows.length, (page + 1) * PAGE_SIZE)} of {formatCount(rows.length)}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous page">
                    <ChevronLeft aria-hidden />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1} aria-label="Next page">
                    <ChevronRight aria-hidden />
                  </Button>
                </div>
              </nav>
            )}
          </DataSection>
        </Card>

        {/* Rule coverage: what was checked, what passed, what couldn't run */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <SourceTag kind="derived" />
            </div>
            <CardTitle className="pt-1">
              {ready ? `${evaluated.length} checks ran (${passing.length} found nothing); ${notEvaluated.length} couldn't run` : "Rule coverage"}
            </CardTitle>
            <CardDescription>Portfolio-wide counts. A check that can't run is listed, never silently treated as passing.</CardDescription>
          </CardHeader>
          <DataSection skeleton={<RowsSkeleton rows={4} />} empty={<EmptyState compact title="No checks to show" description="Rule results appear once data loads." />}>
          <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><ListChecks className="size-4" aria-hidden /> Evaluated</h3>
              <ul className="divide-y rounded-md border text-sm">
                {evaluated.map((r) => (
                  <li key={r.rule.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <SeverityBadge severity={r.rule.severity} className="hidden sm:inline-flex" />
                      <span className="truncate">{r.rule.label}</span>
                    </span>
                    <span className={cn("shrink-0 tabular-nums", r.count ? "font-semibold" : "text-muted-foreground")}>
                      {r.count ? formatCount(r.count) : "0 · pass"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><CircleSlash className="size-4" aria-hidden /> Not evaluated</h3>
              <ul className="divide-y rounded-md border border-dashed text-sm">
                {notEvaluated.map((r) => (
                  <li key={r.rule.id} className="px-3 py-2">
                    <p>{r.rule.label}</p>
                    <p className="text-xs text-muted-foreground">{r.notEvaluatedReason}</p>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
          </DataSection>
        </Card>
      </div>
    </AppLayout>
  )
}
