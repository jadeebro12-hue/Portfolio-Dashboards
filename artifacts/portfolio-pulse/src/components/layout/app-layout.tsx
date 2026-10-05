import * as React from "react"
import { Menu } from "lucide-react"
import { useLocation } from "wouter"

import { BrandMark, Sidebar, SidebarNav } from "@/components/layout/sidebar"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

function MobileTopBar() {
  const [open, setOpen] = React.useState(false)
  const [location] = useLocation()

  // Close the drawer after navigating.
  React.useEffect(() => setOpen(false), [location])

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-sidebar-border bg-sidebar px-2 text-sidebar-foreground lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="flex size-11 items-center justify-center rounded-md hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" aria-hidden />
        </SheetTrigger>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="w-72 max-w-[85vw] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground"
        >
          <div className="flex h-14 items-center border-b border-sidebar-border px-4">
            <SheetTitle asChild>
              <div className="text-sidebar-foreground">
                <BrandMark />
              </div>
            </SheetTitle>
          </div>
          <div className="h-[calc(100%-3.5rem)]">
            <SidebarNav />
          </div>
        </SheetContent>
      </Sheet>
      <BrandMark className="text-base" />
    </header>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main id="main" className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
