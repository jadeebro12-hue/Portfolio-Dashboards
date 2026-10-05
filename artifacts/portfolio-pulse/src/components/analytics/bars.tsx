import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Accessible horizontal bar row: label + value are always text, the bar is
 * decoration (aria-hidden), so nothing relies on color or length alone.
 */
export function BarRow({
  label,
  value,
  share,
  barClassName = "bg-primary",
  description,
  indent,
  dashed,
}: {
  label: React.ReactNode
  value: React.ReactNode
  /** 0–1; null renders an empty dashed track (unavailable). */
  share: number | null
  barClassName?: string
  description?: React.ReactNode
  indent?: boolean
  dashed?: boolean
}) {
  const pct = share == null ? 0 : Math.max(0, Math.min(1, share)) * 100
  return (
    <div className={cn("space-y-1.5", indent && "pl-4 sm:pl-6")}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 font-medium">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums">{value}</span>
      </div>
      <div
        aria-hidden
        className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", (dashed || share == null) && "border border-dashed border-muted-foreground/40 bg-transparent")}
      >
        {share != null && pct > 0 && <div className={cn("h-full rounded-full", barClassName)} style={{ width: `${Math.max(pct, 0.75)}%` }} />}
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

/** Stacked 100% bar with a text legend underneath. */
export function StackedBar({
  segments,
  label,
}: {
  segments: { key: string; label: React.ReactNode; value: number; className: string }[]
  label: string
}) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  return (
    <div>
      <div role="img" aria-label={label} className="flex h-4 w-full gap-0.5 overflow-hidden rounded-md bg-muted">
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div key={s.key} className={cn("h-full", s.className)} style={{ width: `${(s.value / total) * 100}%`, minWidth: 3 }} />
            ))}
      </div>
    </div>
  )
}
