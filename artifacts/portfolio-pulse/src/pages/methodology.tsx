import * as React from "react"

import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfidenceLegend } from "@/components/analytics/confidence"
import { getPortfolioModel } from "@/lib/analytics/model"
import { CONCEPTS, METRICS, type Availability } from "@/lib/analytics/definitions"
import { INVENTORY_RULES } from "@/lib/analytics/inventory"
import { LISTING_RULES, REQUIRED_LISTING_FIELDS } from "@/lib/analytics/listings"
import { formatCount, formatPct } from "@/lib/analytics/format"
import { investors } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const AVAIL: Record<Availability, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-success/10 text-success-text border-success/25" },
  derived: { label: "Derived", className: "bg-info/10 text-info-text border-info/25" },
  "source-field": { label: "As reported", className: "bg-muted text-muted-foreground border-border" },
  unavailable: { label: "Unavailable", className: "bg-warning/15 text-warning-text border-warning/35" },
}

const SECTIONS = [
  ["why", "Why this dashboard exists"],
  ["sources", "Source data & refresh"],
  ["concepts", "Concepts"],
  ["metrics", "Metric definitions"],
  ["confidence", "Record checks & confidence"],
  ["limitations", "Known limitations"],
  ["required-fields", "Fields needed"],
  ["decisions", "Key design decisions"],
] as const

function Section({ id, title, children, description }: { id: string; title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card id={id} className="min-w-0 scroll-mt-20 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children}
    </Card>
  )
}

export default function Methodology() {
  const model = getPortfolioModel()
  const asOf = model.asOf.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })

  const sources = [
    { name: "Property records", rows: `${formatCount(model.properties.length)} properties`, fields: "name, address, city, state, totalUnits, fundingSources, placedInServiceDate, compliancePeriodEndDate, affordabilitySetAsides, currentOccupancyPct, statusHealthScore" },
    { name: "Rent roll (physical units)", rows: `${formatCount(model.units.length)} units`, fields: "unitNumber, bedrooms, amiTier, currentRent, maxAllowableRent, occupancyStatus, tenantName, leaseStartDate, leaseEndDate" },
    { name: "Monthly financials", rows: `${formatCount(model.financials.length)} property-months`, fields: "rentalIncome, vacancyLoss, otherIncome, operatingExpenses, debtService, reserveDeposit (actual & budget)" },
    { name: "Compliance calendar", rows: `${formatCount(model.complianceEvents.length)} events`, fields: "eventType, dueDate, status" },
    { name: "Investor schedule", rows: `${formatCount(investors.length)} investors`, fields: "entityType, properties, reportingFrequency, next/last report dates" },
    { name: "Listing feed", rows: "Not connected", fields: "—" },
  ]

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Definitions & Methodology"
          description="How every number is defined, where it comes from, and what the data can't tell you yet."
        />

        <blockquote className="rounded-lg border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm sm:px-5">
          <p className="font-semibold">Data product design principle</p>
          <p className="mt-1 text-foreground/85">The dashboard prioritizes trustworthy, explainable metrics over artificially complete metrics.</p>
        </blockquote>

        <nav aria-label="On this page" className="flex flex-wrap gap-2">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="inline-flex min-h-9 items-center rounded-full border bg-card px-3 text-sm hover:border-primary/40 hover:text-primary max-sm:min-h-11">
              {label}
            </a>
          ))}
        </nav>

        <Section id="why" title="Why this dashboard exists">
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>
              Portfolio Pulse helps affordable multifamily operators move from high-level portfolio metrics to the records that explain them.
              It separates stable physical-unit inventory from changing listing activity, surfaces data coverage and uncertainty, and
              prioritizes exceptions that require operational or data-quality follow-up.
            </p>
            <p className="text-muted-foreground">
              It answers three increasingly specific questions: <strong className="text-foreground">Portfolio health</strong> — what's happening across the portfolio?
              <strong className="text-foreground"> Property diagnosis</strong> — which properties and unit types explain it? <strong className="text-foreground">Action queue</strong> — what should someone investigate next?
            </p>
          </CardContent>
        </Section>

        <Section id="sources" title="Source data & refresh" description={`Data as of ${asOf}. Mock data is generated relative to the moment the app loads; “Last refreshed” is that load time. Nothing is real-time.`}>
          <Table className="min-w-[640px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Records</TableHead>
                <TableHead>Fields used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="whitespace-nowrap font-medium">{s.name}</TableCell>
                  <TableCell className={cn("whitespace-nowrap text-right tabular-nums", s.rows === "Not connected" && "font-medium text-warning-text")}>{s.rows}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.fields}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section id="concepts" title="Concepts" description="Physical units and listing events are different things, and the dashboard never treats one as the other.">
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              {CONCEPTS.map((c) => (
                <div key={c.term}>
                  <dt className="text-sm font-semibold">{c.term}</dt>
                  <dd className="mt-0.5 text-sm text-muted-foreground">{c.meaning}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 rounded-md bg-muted/50 p-3 text-sm">
              <strong>Why listings differ from inventory:</strong> one vacant unit can be posted on several sites; a listing can stay up after the unit leases;
              a unit can be pre-leased while still occupied; and some vacant units are never marketed (down units, model units, renovations).
              Counting active listings as vacant units would overstate availability in some places and miss it in others.
            </p>
          </CardContent>
        </Section>

        <Section id="metrics" title="Metric definitions" description="The same text appears in each metric's info button.">
          <Table className="[&_td]:px-2 [&_th]:px-2 min-w-[620px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead>Metric</TableHead>
                <TableHead>Definition</TableHead>
                <TableHead>Formula</TableHead>
                <TableHead className="hidden xl:table-cell">Source</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(METRICS).map(([id, m]) => (
                <TableRow key={id} className="align-top">
                  <TableCell className="whitespace-nowrap font-medium">{m.label}</TableCell>
                  <TableCell className="min-w-52 text-sm text-muted-foreground">
                    {m.definition}
                    <span className="mt-1 block text-xs xl:hidden">Source: {m.source}</span>
                  </TableCell>
                  <TableCell className="min-w-36"><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{m.formula}</code></TableCell>
                  <TableCell className="hidden min-w-40 text-xs text-muted-foreground xl:table-cell">{m.source}</TableCell>
                  <TableCell><span className={cn("whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", AVAIL[m.availability].className)}>{AVAIL[m.availability].label}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section id="confidence" title="Record checks & confidence">
          <CardContent className="space-y-4 text-sm">
            <p>
              Every rent-roll record runs through the checks listed on the Data Trust page. A record's tier is the <em>worst</em> tier among the checks it fails.
              This is a rule-based proxy for record trust — not a vendor match score — and it's separate from listing→unit match confidence, which needs a listing feed.
            </p>
            <ConfidenceLegend />
            <div className="rounded-md border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Configurable thresholds</p>
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                <li>Implausibly low rent: below <strong>{formatPct(INVENTORY_RULES.lowRentRatio, 0)}</strong> of the AMI limit</li>
                <li>Occupancy gap flag: more than <strong>{INVENTORY_RULES.occupancyGapThreshold * 100} pts</strong></li>
                <li>Valid bedrooms: 0–{INVENTORY_RULES.maxBedrooms}</li>
                <li>NOI shortfall: more than 5% below budget (existing rule)</li>
                <li>Stale listing (when connected): not seen in <strong>{LISTING_RULES.staleDays} days</strong></li>
                <li>Match tiers (when connected): High ≥ {LISTING_RULES.highMatch}, Medium ≥ {LISTING_RULES.mediumMatch}</li>
              </ul>
            </div>
          </CardContent>
        </Section>

        <Section id="limitations" title="Known limitations & exclusions">
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li><strong>No listing feed.</strong> Active and new listings, delistings, days on market, time to lease, advertised rent and mapping coverage all show N/A. None are estimated from vacancy.</li>
              <li><strong>Status is a snapshot.</strong> Unit status has no history, so physical occupancy and vacancy can't be trended or compared period-over-period.</li>
              <li><strong>Current leases only.</strong> Lease starts count residents still in place; earlier months undercount move-ins. The latest month may also be incomplete if leases post with a lag.</li>
              <li><strong>Field meaning to confirm.</strong> Rental income reconciles to gross potential rent <em>net</em> of vacancy for {formatPct(model.gpr.matchRate, 0)} of property-months, yet the existing NOI formula subtracts vacancy loss again. NOI is shown unchanged pending confirmation.</li>
              <li><strong>Two occupancy sources.</strong> Property records carry a reported occupancy that can disagree with the rent roll; both are shown, and gaps above {INVENTORY_RULES.occupancyGapThreshold * 100} pts are flagged.</li>
              <li><strong>Health score is opaque.</strong> It's a source field with no documented method, displayed as reported and not used in derived metrics.</li>
              <li><strong>Dimension substitutes.</strong> Market = city + state (no submarket field). Funding program stands in for asset class, which isn't in the data. Unit type = bedrooms (no bathrooms or floor plans).</li>
              <li><strong>Exclusions.</strong> Records with unparseable, future-dated or misordered lease dates are excluded from date-based activity metrics and flagged in the Action Queue instead.</li>
            </ul>
          </CardContent>
        </Section>

        <Section id="required-fields" title="Fields needed to improve accuracy">
          <CardContent className="grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
            <div>
              <p className="mb-2 font-semibold">Listing feed</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {REQUIRED_LISTING_FIELDS.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">Rent roll & property data</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Daily unit-status snapshots (status history) — for occupancy trends and sudden-change alerts</li>
                <li>vacated_at / available_at and make-ready status — for vacant-days and time to lease</li>
                <li>Prior leases (lease history) — for unbiased move-in and renewal rates</li>
                <li>bathrooms and floor_plan — for full unit-type analysis</li>
                <li>submarket and asset_class — for market segmentation</li>
                <li>Documented definition of statusHealthScore</li>
                <li>Confirmed definition of rentalIncome (gross vs net of vacancy)</li>
              </ul>
            </div>
          </CardContent>
        </Section>

        <Section id="decisions" title="Key design decisions">
          <CardContent>
            <dl className="space-y-4 text-sm">
              {[
                ["Physical units and listings are modeled separately", "Units are stable inventory; listings are noisy marketing events. Keeping them apart stops duplicate or stale listings from inflating availability, and makes the gap between “vacant” and “marketed” visible instead of assumed."],
                ["Incomplete records are surfaced, not silently dropped", "A record that fails a check stays in the counts it can support and appears in the Action Queue with a reason. Dropping it would make metrics look cleaner while hiding the problem."],
                ["Confidence and coverage travel with the metric", "KPIs show their coverage or confidence context, and the Data Trust page quantifies how many records sit below High. Users can decide how hard to lean on a number."],
                ["Unavailable means N/A, with the missing fields named", "The listing model, metrics and exception rules are built and unit-tested, but the app shows N/A until a real feed exists, rather than a synthetic placeholder."],
                ["Productionizing would need", "Data contracts with each source (types, null rules, freshness SLAs); source monitoring and alerting on row counts and check failures; incremental refreshes with daily snapshots for trends; entity-resolution QA with a labeled sample for listing→unit matching; and role-based access so investor-facing views exclude resident PII."],
              ].map(([t, d]) => (
                <div key={t}>
                  <dt className="font-semibold">{t}</dt>
                  <dd className="mt-0.5 text-muted-foreground">{d}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Section>
      </div>
    </AppLayout>
  )
}
