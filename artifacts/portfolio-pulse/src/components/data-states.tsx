import * as React from "react"
import { AlertTriangle, Inbox, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataState } from "@/lib/data-state"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Empty + error                                                       */
/* ------------------------------------------------------------------ */

interface StateMessageProps {
  title: string
  description?: React.ReactNode
  icon?: React.ElementType
  action?: React.ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
  compact,
}: StateMessageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-12",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({
  title = "Couldn't load this data",
  description = "Something went wrong while fetching the portfolio. Your data is safe — try again in a moment.",
  onRetry,
  className,
  compact,
}: Partial<StateMessageProps> & { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-12",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-danger-text">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden /> Try again
        </Button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Skeleton presets — shaped like the content they stand in for        */
/* ------------------------------------------------------------------ */

export function ChartSkeleton({ className }: { className?: string }) {
  // Bars of varying height read as "a chart is coming" without a spinner.
  const heights = [45, 60, 52, 70, 58, 75, 66, 80, 72, 85, 78, 90]
  return (
    <div className={cn("flex h-full items-end gap-2 pt-4", className)} aria-hidden>
      {heights.map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export function RowsSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("divide-y", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function KpiSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-36" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DataSection: picks the right treatment for the current data status  */
/* ------------------------------------------------------------------ */

interface DataSectionProps {
  children: React.ReactNode
  /** Rendered while loading. Should match the shape of the real content. */
  skeleton: React.ReactNode
  /** Rendered when the dataset is empty. */
  empty: React.ReactNode
  /** Extra condition that also counts as empty (e.g. a filter with no matches). */
  isEmpty?: boolean
  compact?: boolean
  /** Replaces the default error panel (e.g. a quiet inline message in a KPI tile). */
  error?: React.ReactNode
}

export function DataSection({ children, skeleton, empty, isEmpty, compact, error }: DataSectionProps) {
  const { status, retry } = useDataState()

  if (status === "loading") {
    return (
      <div role="status" aria-live="polite" aria-busy="true" className="h-full">
        <span className="sr-only">Loading…</span>
        {skeleton}
      </div>
    )
  }
  if (status === "error") return error !== undefined ? <>{error}</> : <ErrorState onRetry={retry} compact={compact} />
  if (status === "empty" || isEmpty) return <>{empty}</>
  return <>{children}</>
}
