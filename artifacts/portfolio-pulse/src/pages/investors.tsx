import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, FileText, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { DataSection, EmptyState, KpiSkeleton } from "@/components/data-states";
import { toneText } from "@/lib/status";
import { cn } from "@/lib/utils";
import { investors, Investor } from "@/lib/mock-data";
import { ReportModal } from "@/components/report-modal";

export default function InvestorsList() {
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Investor Reporting"
          description="Manage partner relations and compliance reporting."
        />

        <DataSection
          skeleton={
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4 sm:p-6"><KpiSkeleton /></Card>
              ))}
            </div>
          }
          isEmpty={investors.length === 0}
          empty={<Card><EmptyState icon={UsersRound} title="No investors or funders yet" description="Add a syndicator, lender or agency to start scheduling reports." /></Card>}
        >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {investors.map((investor) => {
            const isDueSoon =
              new Date(investor.nextReportDueDate).getTime() - new Date().getTime() <
              1000 * 60 * 60 * 24 * 14;

            return (
              <Card key={investor.id} className="flex flex-col">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className="rounded-md bg-muted/50 font-medium text-muted-foreground">
                      {investor.entityType}
                    </Badge>
                    {isDueSoon && <StatusBadge tone="warning">Due soon</StatusBadge>}
                  </div>
                  <CardTitle className="text-lg">{investor.name}</CardTitle>
                </CardHeader>

                <CardContent className="flex-1 space-y-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="size-4" aria-hidden />
                    <span><span className="font-medium text-foreground tabular-nums">{investor.properties.length}</span> properties funded</span>
                  </div>

                  <dl className="space-y-2 rounded-md border bg-muted/30 p-3">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Frequency</dt>
                      <dd className="font-medium">{investor.reportingFrequency}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Last sent</dt>
                      <dd className="tabular-nums">{investor.lastReportDate}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Next due</dt>
                      <dd className={cn("tabular-nums", isDueSoon ? cn("font-semibold", toneText.warning) : "font-medium")}>
                        {investor.nextReportDueDate}
                      </dd>
                    </div>
                  </dl>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isDueSoon ? "default" : "outline"}
                    onClick={() => setSelectedInvestor(investor)}
                  >
                    <FileText aria-hidden />
                    Generate Report
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        </DataSection>
      </div>

      <ReportModal
        investor={selectedInvestor}
        open={selectedInvestor !== null}
        onClose={() => setSelectedInvestor(null)}
      />
    </AppLayout>
  );
}
