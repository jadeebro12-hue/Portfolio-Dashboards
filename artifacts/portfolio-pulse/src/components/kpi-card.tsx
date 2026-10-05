import * as React from "react"

import { Card } from "@/components/ui/card"
import { DataSection, KpiSkeleton } from "@/components/data-states"
import { cn } from "@/lib/utils"
import { toneText, type StatusTone } from "@/lib/status"

interface KpiCardProps {
  label: string
  value: React.ReactNode
  /** Supporting line under the value. */
  detail?: React.ReactNode
  icon?: React.ElementType
  /** Colors the value; leave unset for neutral numbers. */
  tone?: StatusTone
  /** Tints the card border/background for cards that are themselves an alert. */
  emphasis?: StatusTone
  className?: string
}

const emphasisCard: Partial<Record<StatusTone, string>> = {
  warning: "border-warning/40 bg-warning/5",
  critical: "border-destructive/30 bg-destructive/5",
}

function KpiPlaceholder({ label, note }: { label: string; note: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-muted-foreground">—</p>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

export function KpiCard({ label, value, detail, icon: Icon, tone, emphasis, className }: KpiCardProps) {
  return (
    <Card className={cn("p-4 sm:p-5", emphasis && emphasisCard[emphasis], className)}>
      <DataSection
        compact
        skeleton={<KpiSkeleton />}
        empty={<KpiPlaceholder label={label} note="No data for this period" />}
        error={<KpiPlaceholder label={label} note="Unavailable — couldn't load" />}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <Icon
              className={cn("size-4 shrink-0", emphasis ? toneText[emphasis] : "text-muted-foreground")}
              aria-hidden
            />
          )}
        </div>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tracking-tight tabular-nums",
            tone ? toneText[tone] : "text-foreground",
          )}
        >
          {value}
        </p>
        {detail && <div className="mt-1 text-xs text-muted-foreground">{detail}</div>}
      </DataSection>
    </Card>
  )
}
