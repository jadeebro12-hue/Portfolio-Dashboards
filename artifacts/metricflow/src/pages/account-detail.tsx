import { useParams, Link, useLocation } from "wouter";
import { mockAccounts, getStatusColor } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building, Mail, Phone, MapPin, CreditCard, Activity, Users, FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AccountDetailSkeleton, ChartSkeleton, DataEmptyState, DataErrorState } from "@/components/data-states";
import { getDataState, retryDataState } from "@/lib/data-state";

export default function AccountDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const accountState = getDataState("account");
  const usageState = getDataState("usage");
  const account = mockAccounts.find(a => a.id === params.id);

  const usageData = [
    { date: 'Mon', api: 1200, web: 4500 },
    { date: 'Tue', api: 1350, web: 5100 },
    { date: 'Wed', api: 1800, web: 4800 },
    { date: 'Thu', api: 1500, web: 5600 },
    { date: 'Fri', api: 2100, web: 6200 },
    { date: 'Sat', api: 800, web: 2100 },
    { date: 'Sun', api: 950, web: 2400 },
  ];

  if (accountState === "loading") {
    return <AccountDetailSkeleton />;
  }

  if (accountState === "error") {
    return (
      <div className="space-y-6">
        <Link href="/accounts" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Accounts</Link>
        <DataErrorState
          title="Couldn't load this account"
          description="Check the account connection, then retry to restore account health, activity, and usage."
          onRetry={() => retryDataState("account")}
        />
      </div>
    );
  }

  if (!account || accountState === "empty") {
    return (
      <div className="space-y-6">
        <Link href="/accounts" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Accounts</Link>
        <DataEmptyState
          icon={Building}
          title="This account isn't available"
          description="Return to Accounts and choose another account to review its health, usage, and activity."
          action={{ label: "Back to Accounts", onClick: () => setLocation("/accounts") }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link href="/accounts" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Accounts
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
            {account.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {account.name}
              <Badge variant="outline" className={`capitalize ${getStatusColor(account.status)} text-xs ml-2`}>
                {account.status}
              </Badge>
            </h2>
            <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
              <Building className="h-3 w-3" /> Tech Industry • Since Oct 2022
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Account</Button>
          <Button>Log Activity</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">ARR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${account.arr.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{account.health}</div>
              <div className="w-full bg-secondary rounded-full h-1.5 ml-2">
                <div 
                  className={`h-1.5 rounded-full ${account.health > 80 ? 'bg-success' : account.health > 50 ? 'bg-warning' : 'bg-destructive'}`} 
                  style={{ width: `${account.health}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{account.plan}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">CSM Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{account.csm}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Overview</TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Usage</TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Tickets</TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="mt-0.5"><CheckCircle2 className="h-5 w-5 text-success" /></div>
                    <div>
                      <p className="text-sm font-medium">QBR Completed successfully</p>
                      <p className="text-xs text-muted-foreground mt-1">By {account.csm} • 2 weeks ago</p>
                      <p className="text-sm mt-2 text-muted-foreground">Discussed upcoming feature rollouts and expansion opportunities for Q3.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-0.5"><AlertCircle className="h-5 w-5 text-warning" /></div>
                    <div>
                      <p className="text-sm font-medium">Usage drop detected</p>
                      <p className="text-xs text-muted-foreground mt-1">System • 3 weeks ago</p>
                      <p className="text-sm mt-2 text-muted-foreground">API requests dropped by 15% WoW. Created follow-up task for CSM.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-0.5"><Users className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="text-sm font-medium">Added 15 new seats</p>
                      <p className="text-xs text-muted-foreground mt-1">System • 1 month ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Contacts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">JD</div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium">Jane Doe</p>
                      <p className="text-xs text-muted-foreground truncate">Admin • jane@example.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">RS</div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium">Robert Smith</p>
                      <p className="text-xs text-muted-foreground truncate">Billing • rob@example.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>San Francisco, CA</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>billing@{account.name.toLowerCase().replace(/\s/g, '')}.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>Visa ending in 4242</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="usage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Usage (7 Days)</CardTitle>
              <CardDescription>Daily active users and API requests</CardDescription>
            </CardHeader>
            <CardContent>
              {usageState === "loading" ? <ChartSkeleton /> : usageState === "error" ? (
                <DataErrorState
                  title="Couldn't load usage data"
                  description="Check the usage connection, then retry to restore web actions and API requests."
                  onRetry={() => retryDataState("usage")}
                />
              ) : usageState === "empty" ? (
                <DataEmptyState
                  icon={Activity}
                  title="No usage activity yet"
                  description="Connect an integration to start tracking web actions and API requests for this account."
                  action={{ label: "Go to Settings", onClick: () => setLocation("/settings") }}
                />
              ) : <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWeb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorApi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="web" name="Web Actions" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorWeb)" />
                    <Area type="monotone" dataKey="api" name="API Requests" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorApi)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tickets" className="mt-6">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Activity className="h-10 w-10 mb-4 opacity-20" />
              <p>No open tickets at this time.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <FileText className="h-10 w-10 mb-4 opacity-20" />
              <p>No notes found. Add a note to get started.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}