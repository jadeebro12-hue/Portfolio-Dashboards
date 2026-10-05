import * as React from "react"

import { cn } from "@/lib/utils"
import { toneChip, toneFill, type StatusTone } from "@/lib/status"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone
  /** Show a leading dot so status doesn't rely on color alone. */
  dot?: boolean
}

export function StatusBadge({
  tone,
  dot = true,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium leading-5",
        toneChip[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", toneFill[tone])}
        />
      )}
      {children}
    </span>
  )
}

/** Square numeric chip for 0–100 health scores. */
export function ScoreChip({
  score,
  tone,
  className,
}: {
  score: number
  tone: StatusTone
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-9 items-center justify-center rounded-md border px-1.5 text-xs font-semibold tabular-nums",
        toneChip[tone],
        className,
      )}
      aria-label={`Health score ${score} out of 100`}
    >
      {score}
    </span>
  )
}
