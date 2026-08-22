import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockAccounts, mockRevenueData, mockChurnData, mockActivityFeed, getStatusColor } from "@/lib/mock-data";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Users, CreditCard, Activity, ArrowDownRight, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useLocation } from "wouter";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ChartSkeleton, DataEmptyState, DataErrorState } from "@/components/data-states";
import { getDataState, retryDataState } from "@/lib/data-state";
import { DesignNote } from "@/components/design-notes";

const dashboardContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.02,
      staggerChildren: 0.03,
    },
  },
};

const dashboardItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

type ChartPoint = {
  month: string;
  mrr?: number;
  target?: number;
  churn?: number;
};

function MrrTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
  if (!active || !payload?.[0]?.payload) return null;
  const point = payload[0].payload;
  const index = mockRevenueData.findIndex((item) => item.month === point.month);
  const previous = mockRevenueData[index - 1];
  const delta = previous ? point.mrr! - previous.mrr : 0;

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2.5 shadow-md">
      <p className="text-xs font-medium text-muted-foreground">{point.month} MRR</p>
      <p className="mt-0.5 font-semibold tabular-nums">${point.mrr!.toLocaleString()}</p>
      {previous && (
        <p className="mt-1 text-xs text-chart-2 tabular-nums">
          <TrendingUp className="mr-1 inline h-3 w-3" />
          +${delta.toLocaleString()} vs {previous.month}
        </p>
      )}
    </div>
  );
}

function ChurnTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
  if (!active || !payload?.[0]?.payload) return null;
  const point = payload[0].payload;
  const index = mockChurnData.findIndex((item) => item.month === point.month);
  const previous = mockChurnData[index - 1];
  const delta = previous ? point.churn! - previous.churn : 0;

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2.5 shadow-md">
      <p className="text-xs font-medium text-muted-foreground">{point.month} gross churn</p>
      <p className="mt-0.5 font-semibold tabular-nums">{point.churn!.toFixed(1)}%</p>
      {previous && (
        <p className="mt-1 text-xs text-chart-3 tabular-nums">
          <TrendingDown className="mr-1 inline h-3 w-3" />
          {delta < 0 ? "−" : "+"}{Math.abs(delta).toFixed(1)} pts vs {previous.month}
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const topAccounts = [...mockAccounts].sort((a, b) => b.arr - a.arr).slice(0, 5);
  const shouldReduceMotion = useReducedMotion();
  const [, setLocation] = useLocation();
  const mrrState = getDataState("mrr");
  const churnState = getDataState("churn");

  return (
    <motion.div
      className="space-y-6"
      variants={dashboardContainerVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
    >
      <motion.div variants={dashboardItemVariants}>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Here's what's happening with your accounts today.</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={dashboardItemVariants}>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$182,000</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-success flex items-center"><ArrowUpRight className="h-3 w-3 mr-1"/> 8.3%</span> from last month
            </p>
          </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={dashboardItemVariants}>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+215</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-success flex items-center"><ArrowUpRight className="h-3 w-3 mr-1"/> 12.1%</span> from last month
            </p>
          </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={dashboardItemVariants}>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-warning flex items-center"><ArrowDownRight className="h-3 w-3 mr-1"/> 2.4%</span> from last month
            </p>
          </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={dashboardItemVariants}>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-success flex items-center"><ArrowDownRight className="h-3 w-3 mr-1"/> 0.4%</span> from last month
            </p>
          </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <motion.div variants={dashboardItemVariants} className="col-span-4">
          <Card>
          <CardHeader className="relative">
            <CardTitle>MRR Trend</CardTitle>
            <CardDescription>Recurring revenue is outpacing plan for a fourth consecutive month.</CardDescription>
            <DesignNote
              number={1}
              title="Insight over axis-reading"
              rationale="I placed the month-over-month callout inside the chart so a manager can see the headline revenue signal without first interpreting every axis and data point."
              className="right-5 top-5"
              side="left"
            />
          </CardHeader>
          <CardContent className="pl-2">
            {mrrState === "loading" ? <ChartSkeleton /> : mrrState === "error" ? (
              <DataErrorState
                title="Couldn't load MRR trend"
                description="Check the revenue connection, then retry to restore the monthly recurring revenue trend."
                onRetry={() => retryDataState("mrr")}
              />
            ) : mrrState === "empty" ? (
              <DataEmptyState
                icon={TrendingUp}
                title="No MRR data yet"
                description="Add an account with a subscription to start tracking recurring revenue against plan."
                action={{ label: "Add Account", onClick: () => setLocation("/onboarding") }}
              />
            ) : <div className="relative h-[300px] w-full">
              <div className="pointer-events-none absolute right-4 top-1 z-10 rounded-md border border-chart-2/20 bg-chart-2/10 px-3 py-2">
                <div className="flex items-center gap-1 text-xs font-semibold text-chart-2">
                  <TrendingUp className="h-3.5 w-3.5" /> UP 8.3% MOM
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">$7k above June target</p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockRevenueData} margin={{ top: 58, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.32}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <Tooltip cursor={{ stroke: "hsl(var(--chart-2))", strokeDasharray: "3 3" }} content={<MrrTooltip />} />
                  <Area type="monotone" dataKey="mrr" stroke="hsl(var(--chart-2))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMrr)" isAnimationActive={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))", className: "metricflow-chart-active-dot" }} />
                  <Area type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" fill="none" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            }
          </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={dashboardItemVariants} className="col-span-3">
          <Card>
          <CardHeader className="relative">
            <CardTitle>Churn Trend</CardTitle>
            <CardDescription>Gross churn has fallen below the 1.5% operating threshold.</CardDescription>
            <DesignNote
              number={2}
              title="Warning without alarm"
              rationale="I use amber for churn because it asks for attention without implying failure; the trend and threshold provide the context needed to decide whether to act."
              className="right-5 top-5"
              side="left"
            />
          </CardHeader>
          <CardContent className="pl-2">
            {churnState === "loading" ? <ChartSkeleton /> : churnState === "error" ? (
              <DataErrorState
                title="Couldn't load churn trend"
                description="Check the account health connection, then retry to restore gross churn data."
                onRetry={() => retryDataState("churn")}
              />
            ) : churnState === "empty" ? (
              <DataEmptyState
                icon={TrendingDown}
                title="No churn data yet"
                description="MetricFlow will show churn after the first account status changes are recorded."
                action={{ label: "Go to Accounts", onClick: () => setLocation("/accounts") }}
              />
            ) : <div className="relative h-[300px] w-full">
              <div className="pointer-events-none absolute left-4 top-1 z-10 rounded-md border border-chart-3/20 bg-chart-3/10 px-3 py-2">
                <div className="flex items-center gap-1 text-xs font-semibold text-chart-3">
                  <TrendingDown className="h-3.5 w-3.5" /> DOWN 0.4 PTS MOM
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">Best churn rate in 6 months</p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChurnData} margin={{ top: 58, right: 20, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 3]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <Tooltip cursor={{ stroke: "hsl(var(--chart-3))", strokeDasharray: "3 3" }} content={<ChurnTooltip />} />
                  <Line type="monotone" dataKey="churn" stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={false} isAnimationActive={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))", className: "metricflow-chart-active-dot" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            }
          </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={dashboardItemVariants}>
        <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions across your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {mockActivityFeed.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-xs font-medium text-primary">{activity.user.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.user} <span className="font-normal text-muted-foreground">{activity.action}</span> <span className="font-semibold">{activity.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={dashboardItemVariants}>
        <Card>
        <CardHeader>
          <CardTitle>Top Accounts by ARR</CardTitle>
          <CardDescription>Your most valuable active subscriptions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>CSM</TableHead>
                <TableHead className="text-right">ARR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    <Link href={`/accounts/${account.id}`} className="hover:underline">{account.name}</Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${getStatusColor(account.status)}`}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-secondary rounded-full h-2 max-w-[60px]">
                        <div 
                          className={`h-2 rounded-full ${account.health > 80 ? 'bg-success' : account.health > 50 ? 'bg-warning' : 'bg-destructive'}`} 
                          style={{ width: `${account.health}%` }}
                        />
                      </div>
                      <span className="text-sm">{account.health}</span>
                    </div>
                  </TableCell>
                  <TableCell>{account.csm}</TableCell>
                  <TableCell className="text-right">${account.arr.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}