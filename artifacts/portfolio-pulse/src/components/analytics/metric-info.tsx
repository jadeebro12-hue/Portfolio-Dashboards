import * as React from "react"
import { Link } from "wouter"
import { Info } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { METRICS, type Availability, type MetricId } from "@/lib/analytics/definitions"
import { cn } from "@/lib/utils"

const AVAILABILITY_LABEL: Record<Availability, { label: string; className: string }> = {
  available: { label: "From source data", className: "bg-success/10 text-success-text border-success/25" },
  derived: { label: "Derived", className: "bg-info/10 text-info-text border-info/25" },
  "source-field": { label: "Source field, as reported", className: "bg-muted text-muted-foreground border-border" },
  unavailable: { label: "Unavailable", className: "bg-warning/15 text-warning-text border-warning/35" },
}

/**
 * Info button that explains a metric: definition, formula, source and, for
 * unavailable metrics, the fields required. Uses a popover (tap/click) rather
 * than a hover tooltip so it works on touch screens.
 */
export function MetricInfo({ metric, className }: { metric: MetricId; className?: string }) {
  const def = METRICS[metric]
  const avail = AVAILABILITY_LABEL[def.availability]
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          // 44px hit area on phones without enlarging the visible icon.
          "-m-2.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:-m-3 max-sm:size-11",
          className,
        )}
        aria-label={`About ${def.label}`}
      >
        <Info className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] space-y-3 text-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold">{def.label}</p>
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium", avail.className)}>{avail.label}</span>
        </div>
        <p className="text-muted-foreground">{def.definition}</p>
        <dl className="space-y-2 text-xs">
          <div>
            <dt className="font-medium text-muted-foreground">Formula</dt>
            <dd className="mt-0.5 rounded bg-muted px-2 py-1 font-mono text-[11px] leading-relaxed text-foreground">{def.formula}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">Source</dt>
            <dd className="mt-0.5">{def.source}</dd>
          </div>
          {"requiredFields" in def && def.requiredFields && (
            <div>
              <dt className="font-medium text-muted-foreground">Fields needed</dt>
              <dd className="mt-0.5">{def.requiredFields.join(", ")}</dd>
            </div>
          )}
        </dl>
        <Link href="/methodology" className="inline-block text-xs font-medium text-primary hover:underline">
          Definitions & methodology →
        </Link>
      </PopoverContent>
    </Popover>
  )
}

/** Inline "N/A" with the reason, for metrics the data can't support. */
export function Unavailable({ reason = "No listing feed connected", className }: { reason?: string; className?: string }) {
  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span className="font-semibold text-muted-foreground">N/A</span>
      <span className="text-xs font-normal text-muted-foreground">{reason}</span>
    </span>
  )
}

export type SourceKind = "units" | "listings" | "financials" | "property" | "compliance" | "derived"

const SOURCE: Record<SourceKind, { label: string; className: string }> = {
  units: { label: "Physical units · rent roll", className: "border-primary/25 bg-primary/5 text-primary" },
  listings: { label: "Listing events · not connected", className: "border-dashed border-warning/50 bg-warning/10 text-warning-text" },
  financials: { label: "Monthly financials", className: "border-border bg-muted text-muted-foreground" },
  property: { label: "Property records", className: "border-border bg-muted text-muted-foreground" },
  compliance: { label: "Compliance calendar", className: "border-border bg-muted text-muted-foreground" },
  derived: { label: "Derived checks", className: "border-info/25 bg-info/10 text-info-text" },
}

/** Small chip saying which dataset a visual is built from. */
export function SourceTag({ kind, children, className }: { kind: SourceKind; children?: React.ReactNode; className?: string }) {
  const s = SOURCE[kind]
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4", s.className, className)}>
      {children ?? s.label}
    </span>
  )
}
