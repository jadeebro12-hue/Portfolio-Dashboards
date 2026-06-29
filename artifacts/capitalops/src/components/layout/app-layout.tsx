import React from "react";
import { Link, useLocation } from "wouter";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, LineChart, ReceiptText, FileCheck, ShieldAlert, Settings } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { title: "Overview", icon: LayoutDashboard, href: "/" },
    { title: "Analytics", icon: LineChart, href: "/analytics" },
    { title: "Transactions", icon: ReceiptText, href: "/transactions" },
    { title: "Approvals", icon: FileCheck, href: "/approvals" },
    { title: "Audit Trail", icon: ShieldAlert, href: "/audit" },
    { title: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border bg-sidebar">
            <span className="font-bold text-lg text-sidebar-foreground">CapitalOps</span>
          </SidebarHeader>
          <SidebarContent className="bg-sidebar">
            <SidebarMenu className="px-2 py-4 gap-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.href}
                    className="text-sidebar-foreground/80 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4 mr-2" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-card flex items-center px-6 gap-4 sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="font-semibold text-sm">Dashboard</h1>
          </header>
          <div className="flex-1 p-6 md:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
