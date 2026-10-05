import * as React from "react"
import { Link, useLocation } from "wouter"
import {
  LayoutDashboard,
  Building2,
  ShieldAlert,
  UsersRound,
  AlertTriangle,
  DatabaseZap,
  Activity,
  Stethoscope,
  ListChecks,
  BookOpen,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { getPortfolioModel } from "@/lib/analytics/model"
import { dataModeLabels, useDataState, type DataMode } from "@/lib/data-state"
import {
  getNegativeNOIProperties,
  getOverRentUnits,
  getOverdueCompliance,
} from "@/lib/mock-data"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Analyze",
    items: [
      { icon: LayoutDashboard, label: "Portfolio Health", href: "/" },
      { icon: DatabaseZap, label: "Inventory & Data Trust", href: "/data-trust" },
      { icon: Activity, label: "Leasing & Listings", href: "/activity" },
      { icon: Stethoscope, label: "Property Diagnosis", href: "/diagnosis" },
      { icon: ListChecks, label: "Action Queue", href: "/actions" },
    ],
  },
  {
    label: "Operate",
    items: [
      { icon: Building2, label: "Properties", href: "/properties" },
      { icon: ShieldAlert, label: "Compliance", href: "/compliance" },
      { icon: UsersRound, label: "Investors", href: "/investors" },
      { icon: AlertTriangle, label: "Alerts", href: "/alerts" },
    ],
  },
  {
    label: "Reference",
    items: [{ icon: BookOpen, label: "Definitions & Methodology", href: "/methodology" }],
  },
]

// Same sum the Alerts page shows as "items requiring intervention".
const ALERT_COUNT =
  getOverRentUnits().length + getOverdueCompliance().length + getNegativeNOIProperties().length

const HIGH_SEVERITY_COUNT = getPortfolioModel().exceptions.filter((e) => e.severity === "high").length
const BADGES: Record<string, { count: number; label: string }> = {
  "/alerts": { count: ALERT_COUNT, label: "alerts" },
  "/actions": { count: HIGH_SEVERITY_COUNT, label: "high-severity exceptions" },
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <Building2 className="size-4" aria-hidden />
      </div>
      <span>Portfolio Pulse</span>
    </div>
  )
}

function SidebarItem({ icon: Icon, label, href, badge }: NavItem & { badge?: { count: number; label: string } }) {
  const [location] = useLocation()
  const isActive = location === href || (href !== "/" && location.startsWith(href))

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors lg:h-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="flex-1">{label}</span>
      {badge && badge.count > 0 ? (
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold tabular-nums text-white"
          aria-label={`${badge.count} ${badge.label}`}
        >
          {badge.count}
        </span>
      ) : null}
    </Link>
  )
}

function DataModeControl() {
  const { mode, setMode } = useDataState()
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-sidebar-foreground/70">Demo data state</span>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as DataMode)}
        className="h-11 w-full rounded-md border border-sidebar-accent bg-sidebar-accent/40 px-3 text-sm text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        {(Object.keys(dataModeLabels) as DataMode[]).map((m) => (
          <option key={m} value={m} className="text-foreground">
            {dataModeLabels[m]}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Data date + load time. The data is a mock snapshot; nothing here is real-time. */
export function DataAsOf({ className }: { className?: string }) {
  const { asOf, loadedAt } = getPortfolioModel()
  return (
    <p className={cn("text-xs leading-relaxed text-sidebar-foreground/70", className)}>
      Data as of {asOf.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      <br />
      Last refreshed {loadedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} (app load)
      <br />
      Demo snapshot · all data is mocked
    </p>
  )
}

/** Nav list + footer, shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav() {
  const { status } = useDataState()
  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Main" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/55">{group.label}</p>
            <ul className="grid gap-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarItem {...item} badge={status === "ready" ? BADGES[item.href] : undefined} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="space-y-3 border-t border-sidebar-border p-4">
        <DataModeControl />
        <DataAsOf />
      </div>
    </div>
  )
}

/** Desktop sidebar (≥1024px). Sticky, so it spans the viewport on long pages. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <BrandMark />
      </div>
      <SidebarNav />
    </aside>
  )
}
