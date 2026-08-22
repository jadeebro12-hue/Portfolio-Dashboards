import type { LucideIcon } from "lucide-react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type StateAction = {
  label: string;
  onClick: () => void;
};

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: StateAction;
  className?: string;
};

export function DataEmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center ${className}`}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <Button className="mt-5" size="sm" onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

type ErrorStateProps = {
  title: string;
  description: string;
  onRetry: () => void;
  className?: string;
};

export function DataErrorState({ title, description, onRetry, className = "" }: ErrorStateProps) {
  return (
    <div className={`flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center ${className}`}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      <Button className="mt-5" size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
      </Button>
    </div>
  );
}

export function AccountListSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[1.7fr_repeat(6,1fr)] gap-4 border-b px-4 py-3">
        {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-3 w-16" />)}
      </div>
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} className="grid grid-cols-[1.7fr_repeat(6,1fr)] items-center gap-4 border-b px-4 py-4 last:border-0">
          <div className="space-y-2"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-2.5 w-20" /></div>
          {Array.from({ length: 6 }).map((__, cell) => <Skeleton key={cell} className={`h-3.5 ${cell === 1 ? "w-16" : "w-12"}`} />)}
        </div>
      ))}
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="mt-4 space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-start gap-4 rounded-md border p-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-4/5" /><Skeleton className="h-3 w-20" /></div>
        </div>
      ))}
    </div>
  );
}

export function AccountDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-4"><Skeleton className="h-16 w-16 rounded-xl" /><div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-36" /></div></div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="rounded-md border p-6"><Skeleton className="h-3 w-16" /><Skeleton className="mt-4 h-7 w-24" /></div>)}
      </div>
      <div className="grid gap-6 md:grid-cols-3"><div className="space-y-4 rounded-md border p-6 md:col-span-2">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div><div className="space-y-4 rounded-md border p-6"><Skeleton className="h-4 w-24" /><Skeleton className="h-28 w-full" /></div></div>
    </div>
  );
}

export function WizardSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      <div className="space-y-2 text-center"><Skeleton className="mx-auto h-7 w-64" /><Skeleton className="mx-auto h-4 w-80" /></div>
      <div className="flex justify-between">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="space-y-2"><Skeleton className="mx-auto h-8 w-8 rounded-full" /><Skeleton className="h-3 w-12" /></div>)}</div>
      <div className="rounded-md border p-6"><Skeleton className="h-6 w-44" /><Skeleton className="mt-3 h-4 w-64" /><div className="mt-8 space-y-5"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div><div className="mt-8 flex justify-end"><Skeleton className="h-9 w-28" /></div></div>
    </div>
  );
}

type ChartKind = "trend" | "donut" | "funnel" | "cohort";

export function ChartSkeleton({ kind = "trend" }: { kind?: ChartKind }) {
  if (kind === "donut") {
    return <div className="flex h-[300px] items-center justify-center"><Skeleton className="h-44 w-44 rounded-full border-[26px] border-background bg-transparent" /></div>;
  }

  if (kind === "funnel") {
    return <div className="space-y-4 py-5">{[100, 72, 48, 28, 14].map((width) => <Skeleton key={width} className="mx-auto h-8" style={{ width: `${width}%` }} />)}</div>;
  }

  if (kind === "cohort") {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, row) => <div key={row} className="grid grid-cols-8 gap-2">{Array.from({ length: 8 }).map((__, cell) => <Skeleton key={cell} className={`h-10 ${cell < 2 ? "bg-primary/10" : ""}`} />)}</div>)}</div>;
  }

  return (
    <div className="relative h-[300px] overflow-hidden rounded-md border border-border/60 bg-secondary/20 p-5">
      <Skeleton className="h-3 w-24" />
      <div className="absolute inset-x-5 bottom-7 top-16 space-y-10">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-px w-full bg-border/60" />)}
      </div>
      <Skeleton className="absolute bottom-12 left-12 h-24 w-4/5 rounded-b-none" />
    </div>
  );
}