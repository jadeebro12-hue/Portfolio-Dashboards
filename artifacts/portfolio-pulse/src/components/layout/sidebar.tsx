import * as React from "react"
import { Link, useLocation } from "wouter"
import { 
  LayoutDashboard, 
  Building2, 
  ShieldAlert, 
  UsersRound, 
  AlertTriangle 
} from "lucide-react"

import { cn } from "@/lib/utils"

interface SidebarItemProps {
  icon: React.ElementType
  label: string
  href: string
}

function SidebarItem({ icon: Icon, label, href }: SidebarItemProps) {
  const [location] = useLocation()
  const isActive = location === href || (href !== '/' && location.startsWith(href))

  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      isActive 
        ? "bg-sidebar-accent text-sidebar-accent-foreground" 
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
    )}>
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  )
}

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex size-7 items-center justify-center rounded bg-primary">
            <Building2 className="size-4 text-primary-foreground" />
          </div>
          Portfolio Pulse
        </div>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-3">
          <SidebarItem icon={LayoutDashboard} label="Overview" href="/" />
          <SidebarItem icon={Building2} label="Properties" href="/properties" />
          <SidebarItem icon={ShieldAlert} label="Compliance" href="/compliance" />
          <SidebarItem icon={UsersRound} label="Investors" href="/investors" />
          <SidebarItem icon={AlertTriangle} label="Alerts" href="/alerts" />
        </nav>
      </div>
      <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/50">
        Demo environment.<br/>All data is mocked.
      </div>
    </div>
  )
}
