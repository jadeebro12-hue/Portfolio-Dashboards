import { AlertCircle, AlertTriangle, CheckCircle2, CircleHelp, Info, type LucideIcon } from "lucide-react"

import { CONFIDENCE_TIER_DEFS } from "@/lib/analytics/definitions"
import type { ConfidenceTier } from "@/lib/analytics/inventory"
import type { Severity } from "@/lib/analytics/exceptions"
import { cn } from "@/lib/utils"

const TIER_STYLE: Record<ConfidenceTier, { icon: LucideIcon; chip: string; fill: string }> = {
  high: { icon: CheckCircle2, chip: "bg-success/10 text-success-text border-success/25", fill: "bg-success" },
  medium: { icon: AlertTriangle, chip: "bg-warning/15 text-warning-text border-warning/35", fill: "bg-warning" },
  low: { icon: AlertCircle, chip: "bg-destructive/10 text-danger-text border-destructive/25", fill: "bg-destructive" },
  // Unresolved = unknown, not "bad": a dark neutral with a question icon.
  unresolved: { icon: CircleHelp, chip: "bg-foreground/[0.06] text-foreground border-foreground/25", fill: "bg-foreground/60" },
}

export const confidenceFill = (tier: ConfidenceTier) => TIER_STYLE[tier].fill

export function ConfidenceBadge({ tier, className }: { tier: ConfidenceTier; className?: string }) {
  const { icon: Icon, chip } = TIER_STYLE[tier]
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium leading-5", chip, className)}>
      <Icon className="size-3.5" aria-hidden />
      {CONFIDENCE_TIER_DEFS[tier].label}
    </span>
  )
}

export function ConfidenceLegend({ className }: { className?: string }) {
  return (
    <dl className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {(Object.keys(CONFIDENCE_TIER_DEFS) as ConfidenceTier[]).map((tier) => (
        <div key={tier} className="flex items-start gap-2.5">
          <dt className="shrink-0">
            <ConfidenceBadge tier={tier} />
          </dt>
          <dd className="text-xs leading-5 text-muted-foreground">{CONFIDENCE_TIER_DEFS[tier].meaning}</dd>
        </div>
      ))}
    </dl>
  )
}

const SEVERITY_STYLE: Record<Severity, { label: string; icon: LucideIcon; chip: string }> = {
  high: { label: "High", icon: AlertCircle, chip: "bg-destructive/10 text-danger-text border-destructive/25" },
  medium: { label: "Medium", icon: AlertTriangle, chip: "bg-warning/15 text-warning-text border-warning/35" },
  low: { label: "Low", icon: Info, chip: "bg-muted text-muted-foreground border-border" },
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const { label, icon: Icon, chip } = SEVERITY_STYLE[severity]
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium leading-5", chip, className)}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  )
}
