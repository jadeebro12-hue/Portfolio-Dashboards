import type { ComplianceEvent, Unit } from "@/lib/mock-data"

/**
 * One status vocabulary for the whole app. Every badge, score chip and
 * colored number maps onto one of these tones so "warning" always looks
 * the same, whichever page it appears on.
 */
export type StatusTone = "good" | "warning" | "critical" | "info" | "neutral"

/** Soft chip styling (tinted background + AA-contrast text). */
export const toneChip: Record<StatusTone, string> = {
  good: "bg-success/10 text-success-text border-success/25",
  warning: "bg-warning/15 text-warning-text border-warning/35",
  critical: "bg-destructive/10 text-danger-text border-destructive/25",
  info: "bg-info/10 text-info-text border-info/25",
  neutral: "bg-muted text-muted-foreground border-border",
}

/** Text-only color for numbers and inline labels. */
export const toneText: Record<StatusTone, string> = {
  good: "text-success-text",
  warning: "text-warning-text",
  critical: "text-danger-text",
  info: "text-info-text",
  neutral: "text-muted-foreground",
}

/** Solid fill for bars, dots and progress indicators. */
export const toneFill: Record<StatusTone, string> = {
  good: "bg-success",
  warning: "bg-warning",
  critical: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground/40",
}

// Same thresholds the pages used before; centralized so they can't drift.
export function healthTone(score: number): StatusTone {
  if (score >= 90) return "good"
  if (score >= 80) return "warning"
  return "critical"
}

export function occupancyTone(pct: number): StatusTone {
  return pct < 0.95 ? "warning" : "good"
}

export function varianceTone(isNegativeImpact: boolean): StatusTone {
  return isNegativeImpact ? "critical" : "good"
}

export const complianceStatus: Record<
  ComplianceEvent["status"],
  { tone: StatusTone; label: string }
> = {
  overdue: { tone: "critical", label: "Overdue" },
  "due-this-week": { tone: "warning", label: "Due this week" },
  upcoming: { tone: "info", label: "Upcoming" },
  completed: { tone: "neutral", label: "Completed" },
}

export const occupancyStatus: Record<
  Unit["occupancyStatus"],
  { tone: StatusTone; label: string }
> = {
  occupied: { tone: "good", label: "Occupied" },
  notice: { tone: "warning", label: "On notice" },
  vacant: { tone: "neutral", label: "Vacant" },
}
