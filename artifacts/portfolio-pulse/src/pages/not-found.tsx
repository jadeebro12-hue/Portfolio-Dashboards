import { Link } from "wouter"
import { MapPinOff } from "lucide-react"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/data-states"

export default function NotFound() {
  return (
    <AppLayout>
      <Card className="mx-auto max-w-lg">
        <EmptyState
          icon={MapPinOff}
          title="Page not found"
          description="The page you're looking for doesn't exist or has been moved."
          action={
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:h-10"
            >
              Return to dashboard
            </Link>
          }
        />
      </Card>
    </AppLayout>
  )
}
