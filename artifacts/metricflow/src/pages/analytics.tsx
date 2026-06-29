import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockRevenueData } from "@/lib/mock-data";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("6m");

  const planDistribution = [
    { name: 'Enterprise Plus', value: 15 },
    { name: 'Enterprise', value: 45 },
    { name: 'Growth', value: 85 },
    { name: 'Starter', value: 70 },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const conversionData = [
    { stage: 'Website Visit', count: 12500 },
    { stage: 'Signup', count: 4200 },
    { stage: 'Trial Started', count: 1800 },
    { stage: 'Paid Conversion', count: 450 },
    { stage: 'Expansion', count: 120 },
  ];

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
            <div className="h-[300px] w-full">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funnel Conversion</CardTitle>
            <CardDescription>User journey from visit to expansion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="stage" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    cursor={{fill: 'hsl(var(--secondary))'}}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cohort Retention (Mock)</CardTitle>
          <CardDescription>Percentage of accounts active after X months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
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
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium">Jan 2024</td>
                  <td className="px-4 py-3">45</td>
                  <td className="px-4 py-3 bg-emerald-500/90 text-white font-medium rounded-sm m-1 block text-center">98%</td>
                  <td className="px-4 py-3 bg-emerald-500/80 text-white font-medium rounded-sm m-1 block text-center">92%</td>
                  <td className="px-4 py-3 bg-emerald-500/70 text-white font-medium rounded-sm m-1 block text-center">88%</td>
                  <td className="px-4 py-3 bg-emerald-500/60 text-white font-medium rounded-sm m-1 block text-center">85%</td>
                  <td className="px-4 py-3 bg-emerald-500/50 text-white font-medium rounded-sm m-1 block text-center">82%</td>
                  <td className="px-4 py-3 bg-emerald-500/40 text-foreground font-medium rounded-sm m-1 block text-center">80%</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium">Feb 2024</td>
                  <td className="px-4 py-3">52</td>
                  <td className="px-4 py-3 bg-emerald-500/90 text-white font-medium rounded-sm m-1 block text-center">96%</td>
                  <td className="px-4 py-3 bg-emerald-500/80 text-white font-medium rounded-sm m-1 block text-center">90%</td>
                  <td className="px-4 py-3 bg-emerald-500/60 text-white font-medium rounded-sm m-1 block text-center">84%</td>
                  <td className="px-4 py-3 bg-emerald-500/50 text-white font-medium rounded-sm m-1 block text-center">81%</td>
                  <td className="px-4 py-3 bg-emerald-500/40 text-foreground font-medium rounded-sm m-1 block text-center">78%</td>
                  <td className="px-4 py-3 text-muted-foreground text-center">-</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Mar 2024</td>
                  <td className="px-4 py-3">38</td>
                  <td className="px-4 py-3 bg-emerald-500/90 text-white font-medium rounded-sm m-1 block text-center">99%</td>
                  <td className="px-4 py-3 bg-emerald-500/80 text-white font-medium rounded-sm m-1 block text-center">95%</td>
                  <td className="px-4 py-3 bg-emerald-500/70 text-white font-medium rounded-sm m-1 block text-center">92%</td>
                  <td className="px-4 py-3 bg-emerald-500/60 text-white font-medium rounded-sm m-1 block text-center">88%</td>
                  <td className="px-4 py-3 text-muted-foreground text-center">-</td>
                  <td className="px-4 py-3 text-muted-foreground text-center">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}