import { useParams, Link } from "wouter";
import { ArrowLeft, Download, FileText, CheckCircle2, XCircle, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";

export function TransactionDetail() {
  const { id } = useParams();
  
  const transaction = MOCK_TRANSACTIONS.find(t => t.id === id) || MOCK_TRANSACTIONS[0];
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/transactions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">Invoice {transaction.id}</h2>
            <Badge variant="outline" className={`
              ${transaction.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0' : ''}
              ${transaction.status === 'pending' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0' : ''}
              ${transaction.status === 'overdue' ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-0' : ''}
              ${transaction.status === 'approved' ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-0' : ''}
              ${transaction.status === 'flagged' ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-0' : ''}
            `}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{transaction.vendor} • {transaction.date}</p>
        </div>
        <div className="ml-auto flex gap-2">
          {transaction.status === 'pending' && (
            <>
              <Button variant="outline" className="text-destructive hover:bg-destructive/10">Reject</Button>
              <Button>Approve Payment</Button>
            </>
          )}
          <Button variant="secondary" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-6 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Vendor</p>
                  <p className="font-medium">{transaction.vendor}</p>
                  <p className="text-muted-foreground text-xs mt-1">100 Tech Plaza, San Francisco CA</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Department</p>
                  <p className="font-medium">{transaction.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Total Amount</p>
                  <p className="font-medium text-lg">{formatCurrency(transaction.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Due Date</p>
                  <p className="font-medium">{transaction.date}</p>
                </div>
              </div>

              <Separator className="my-6" />

              <h4 className="font-medium mb-4">Line Items</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">Software Subscription - Enterprise</p>
                    <p className="text-xs text-muted-foreground">Annual renewal (Oct 2023 - Oct 2024)</p>
                  </div>
                  <p className="font-medium">{formatCurrency(transaction.amount * 0.9)}</p>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">Premium Support Tier</p>
                    <p className="text-xs text-muted-foreground">24/7 SLA coverage</p>
                  </div>
                  <p className="font-medium">{formatCurrency(transaction.amount * 0.1)}</p>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-medium">
                  <p>Total</p>
                  <p>{formatCurrency(transaction.amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Attached Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center p-3 border rounded-lg bg-muted/30">
                <FileText className="h-8 w-8 text-blue-500 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Invoice_{transaction.id}.pdf</p>
                  <p className="text-xs text-muted-foreground">1.2 MB • Uploaded {transaction.date}</p>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approval Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative bg-background mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm">System Review</div>
                      <time className="text-xs text-muted-foreground">10:00 AM</time>
                    </div>
                    <div className="text-xs text-muted-foreground">Automated compliance checks passed.</div>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative bg-background mx-auto">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm">Dept. Manager</div>
                      <time className="text-xs text-muted-foreground">Pending</time>
                    </div>
                    <div className="text-xs text-muted-foreground">Awaiting approval from {transaction.department} Head.</div>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-muted text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative bg-background mx-auto">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-dashed bg-transparent shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-sm text-muted-foreground">Finance Ops</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Final review step.</div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
