import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { investors, properties } from "@/lib/mock-data"
import { Building2, Calendar, FileText, Download, Mail } from "lucide-react"

export default function InvestorsList() {
  
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Investor Reporting</h1>
            <p className="text-muted-foreground mt-1">Manage partner relations and compliance reporting.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {investors.map(investor => {
            const isDueSoon = new Date(investor.nextReportDueDate).getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 14; // within 14 days

            return (
              <Card key={investor.id} className="flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-muted/50 text-[10px] uppercase tracking-wider">
                      {investor.entityType}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight">{investor.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 text-sm space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{investor.properties.length} Properties Funded</span>
                  </div>
                  
                  <div className="p-3 bg-muted/30 rounded-md border text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="font-medium">{investor.reportingFrequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Sent:</span>
                      <span>{investor.lastReportDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Due:</span>
                      <span className={isDueSoon ? "text-warning-foreground font-bold" : "font-medium"}>
                        {investor.nextReportDueDate}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex gap-2">
                  <Button className="w-full gap-2" variant={isDueSoon ? "default" : "outline"}>
                    <FileText className="h-4 w-4" /> Generate
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

      </div>
    </AppLayout>
  )
}
