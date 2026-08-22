import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "lucide-react";
import { ChartSkeleton, DataEmptyState, DataErrorState } from "@/components/data-states";
import { getDataState, retryDataState } from "@/lib/data-state";
import { metricFlowDesignTokens } from "@/styles/design-tokens";
import { DesignNote } from "@/components/design-notes";

const conversionData = [
  { stage: 'Website visits', count: 12500 },
  { stage: 'Signups', count: 4200 },
  { stage: 'Trials started', count: 1800 },
  { stage: 'Paid conversions', count: 450 },
  { stage: 'Expansions', count: 120 },
];

const cohortData = [
  { cohort: "Jan 2024", accounts: 45, retention: [98, 92, 88, 85, 82, 80] },
  { cohort: "Feb 2024", accounts: 52, retention: [96, 90, 84, 81, 78, null] },
  { cohort: "Mar 2024", accounts: 38, retention: [99, 95, 92, 88, null, null] },
];

function retentionFill(value: number) {
  const heatmap = metricFlowDesignTokens.color.chart.heatmap;
  const index = Math.max(0, Math.min(heatmap.length - 1, Math.round(((value - 70) / 30) * (heatmap.length - 1))));
  return heatmap[index];
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("6m");
  const [activeFunnelStage, setActiveFunnelStage] = useState<string | null>(null);
  const [activeRetentionCell, setActiveRetentionCell] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const planState = getDataState("plan");
  const funnelState = getDataState("funnel");
  const retentionState = getDataState("retention");

  const planDistribution = [
    { name: 'Enterprise Plus', value: 15 },
    { name: 'Enterprise', value: 45 },
    { name: 'Growth', value: 85 },
    { name: 'Starter', value: 70 },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const funnelStages = conversionData.map((stage, index) => {
    const first = conversionData[0].count;
    const previous = conversionData[index - 1]?.count;
    return {
      ...stage,
      portfolioConversion: (stage.count / first) * 100,
      stageConversion: previous ? (stage.count / previous) * 100 : 100,
      dropOff: previous ? previous - stage.count : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">Deep dive into your customer metrics and retention data.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary p-1 rounded-md">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px] border-none bg-transparent shadow-none focus:ring-0">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Accounts breakdown by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            {planState === "loading" ? <ChartSkeleton kind="donut" /> : planState === "error" ? (
              <DataErrorState
                title="Couldn't load plan distribution"
                description="Check the subscription connection, then retry to restore account plan data."
                onRetry={() => retryDataState("plan")}
              />
            ) : planState === "empty" ? (
              <DataEmptyState
                icon={Activity}
                title="No plan data yet"
                description="Add an account with a subscription plan to compare your account mix."
                action={{ label: "Add Account", onClick: () => setLocation("/onboarding") }}
              />
            ) : <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="relative">
            <CardTitle>Funnel Conversion</CardTitle>
            <CardDescription>Acquisition is healthy; the largest absolute drop happens before signup.</CardDescription>
            <DesignNote
              number={4}
              title="Make drop-off actionable"
              rationale="I made the funnel proportional and surfaced the largest loss in plain language so the team can move from conversion data to a focused improvement opportunity."
              className="right-5 top-5"
              side="left"
            />
          </CardHeader>
          <CardContent>
            {funnelState === "loading" ? <ChartSkeleton kind="funnel" /> : funnelState === "error" ? (
              <DataErrorState
                title="Couldn't load conversion funnel"
                description="Check the acquisition connection, then retry to restore stage conversion data."
                onRetry={() => retryDataState("funnel")}
              />
            ) : funnelState === "empty" ? (
              <DataEmptyState
                icon={Activity}
                title="No conversion data yet"
                description="MetricFlow will build this funnel after website visits and signups start flowing in."
                action={{ label: "Go to Accounts", onClick: () => setLocation("/accounts") }}
              />
            ) : <>
            <div className="mb-5 rounded-md border border-primary/20 bg-primary/10 px-3 py-2">
              <p className="text-xs font-semibold text-primary">0.96% VISITOR → EXPANSION</p>
              <p className="mt-0.5 text-xs text-muted-foreground">8,300 visitors drop before signup — the clearest conversion opportunity.</p>
            </div>
            <div className="space-y-2">
              {funnelStages.map((stage, index) => (
                <div
                  key={stage.stage}
                  className="relative grid grid-cols-[110px_minmax(0,1fr)_98px] items-center gap-3 rounded-sm outline-none"
                  tabIndex={0}
                  onPointerEnter={() => setActiveFunnelStage(stage.stage)}
                  onPointerLeave={() => setActiveFunnelStage(null)}
                  onFocus={() => setActiveFunnelStage(stage.stage)}
                  onBlur={() => setActiveFunnelStage(null)}
                  aria-describedby={`funnel-tooltip-${index}`}
                >
                  <div>
                    <p className="text-xs font-medium leading-tight">{stage.stage}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{stage.count.toLocaleString()} people</p>
                  </div>
                  <div className="flex h-9 items-center justify-center rounded-sm bg-secondary/35 px-1">
                    <div
                      className="h-6 rounded-sm bg-primary transition-[filter] hover:brightness-125"
                      style={{ width: `${Math.max(stage.portfolioConversion, 1)}%` }}
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold tabular-nums">{stage.portfolioConversion.toFixed(index === 0 ? 0 : 1)}%</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                      {index === 0 ? "baseline" : `−${stage.dropOff.toLocaleString()} · ${(100 - stage.stageConversion).toFixed(0)}% loss`}
                    </p>
                  </div>
                  {activeFunnelStage === stage.stage && (
                    <div id={`funnel-tooltip-${index}`} role="tooltip" className="pointer-events-none absolute left-28 top-full z-20 mt-2 w-56 rounded-md border border-border bg-popover p-2.5 text-left shadow-md">
                      <p className="text-xs font-semibold">{stage.count.toLocaleString()} people reached {stage.stage.toLowerCase()}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {index === 0
                          ? "Baseline for this conversion funnel."
                          : `${stage.stageConversion.toFixed(1)}% advanced from the prior stage; ${stage.dropOff.toLocaleString()} dropped off.`}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            </>
            }
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="relative">
          <CardTitle>Cohort Retention</CardTitle>
          <CardDescription>Retention remains strongest in the March cohort; darker cells indicate higher retained share.</CardDescription>
          <DesignNote
            number={5}
            title="Compare cohorts at a glance"
            rationale="I use one teal intensity scale rather than multiple competing colors, so a manager can compare retention strength across months before reading individual percentages."
            className="right-5 top-5"
            side="left"
          />
        </CardHeader>
        <CardContent>
          {retentionState === "loading" ? <ChartSkeleton kind="cohort" /> : retentionState === "error" ? (
            <DataErrorState
              title="Couldn't load cohort retention"
              description="Check the account activity connection, then retry to restore retention data."
              onRetry={() => retryDataState("retention")}
            />
          ) : retentionState === "empty" ? (
            <DataEmptyState
              icon={Activity}
              title="No cohort data yet"
              description="MetricFlow will show retention cohorts after accounts have activity across multiple months."
              action={{ label: "Go to Accounts", onClick: () => setLocation("/accounts") }}
            />
          ) : <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-chart-2/20 bg-chart-2/10 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-chart-2">88% RETAINED AT MONTH 3</p>
              <p className="mt-0.5 text-xs text-muted-foreground">The March cohort is 4 points ahead of February at the same point.</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>Lower</span>
              <div className="h-2 w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${metricFlowDesignTokens.color.chart.heatmap[0]}, ${metricFlowDesignTokens.color.chart.heatmap[5]})` }} />
              <span>Higher</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b">
                <tr>
                  <th className="px-4 py-3 rounded-tl-md">Cohort</th>
                  <th className="px-4 py-3">Accounts</th>
                  <th className="px-4 py-3">M1</th>
                  <th className="px-4 py-3">M2</th>
                  <th className="px-4 py-3">M3</th>
                  <th className="px-4 py-3">M4</th>
                  <th className="px-4 py-3">M5</th>
                  <th className="px-4 py-3 rounded-tr-md">M6</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.map((cohort) => (
                  <tr key={cohort.cohort} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{cohort.cohort}</td>
                    <td className="px-4 py-3 tabular-nums">{cohort.accounts}</td>
                    {cohort.retention.map((retention, index) => (
                      <td key={`${cohort.cohort}-${index}`} className="p-1.5">
                        {retention === null ? (
                          <div className="py-2 text-center text-muted-foreground">—</div>
                        ) : (
                          <div
                            className={`relative flex h-10 cursor-default items-center justify-center rounded-sm font-semibold tabular-nums shadow-sm outline-none ${retention >= 88 ? "text-background" : "text-foreground"}`}
                            style={{ backgroundColor: retentionFill(retention) }}
                            tabIndex={0}
                            onPointerEnter={() => setActiveRetentionCell(`${cohort.cohort}-${index}`)}
                            onPointerLeave={() => setActiveRetentionCell(null)}
                            onFocus={() => setActiveRetentionCell(`${cohort.cohort}-${index}`)}
                            onBlur={() => setActiveRetentionCell(null)}
                            aria-describedby={`retention-tooltip-${cohort.cohort}-${index}`}
                          >
                            {retention}%
                            {activeRetentionCell === `${cohort.cohort}-${index}` && (
                              <div id={`retention-tooltip-${cohort.cohort}-${index}`} role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-44 -translate-x-1/2 rounded-md border border-border bg-popover p-2.5 text-left shadow-md">
                                <p className="text-xs font-semibold">{cohort.cohort} · Month {index + 1}</p>
                                <p className="mt-1 text-xs text-muted-foreground"><span className="font-semibold text-foreground tabular-nums">{retention}%</span> of the original {cohort.accounts} accounts remain active.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>}
        </CardContent>
      </Card>
    </div>
  );
}