import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MOCK_DEPARTMENTS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

const MOCK_TRENDS = [
  { month: 'Jan', 'Engineering': 40, 'Sales': 24, 'Marketing': 24 },
  { month: 'Feb', 'Engineering': 30, 'Sales': 13, 'Marketing': 22 },
  { month: 'Mar', 'Engineering': 20, 'Sales': 58, 'Marketing': 22 },
  { month: 'Apr', 'Engineering': 27, 'Sales': 39, 'Marketing': 20 },
  { month: 'May', 'Engineering': 18, 'Sales': 48, 'Marketing': 21 },
  { month: 'Jun', 'Engineering': 23, 'Sales': 38, 'Marketing': 25 },
  { month: 'Jul', 'Engineering': 34, 'Sales': 43, 'Marketing': 21 },
];

export function Analytics() {
  const [timeRange, setTimeRange] = useState("ytd");

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Spend Analytics</h2>
          <p className="text-sm text-muted-foreground">Detailed breakdown of organizational spend vs budget.</p>
        </div>
        <div className="flex bg-card border rounded-md overflow-hidden p-1 shadow-sm">
          {['mtd', 'qtd', 'ytd'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-xs font-medium rounded uppercase transition-colors ${timeRange === range ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Department Budget vs Spend</CardTitle>
            <CardDescription>Current utilization across all departments</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_DEPARTMENTS} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  formatter={(val: number) => formatCurrency(val)}
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="spend" name="Actual Spend" fill="#1e293b" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="budget" name="Allocated Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>Percentage of allocated budget consumed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {MOCK_DEPARTMENTS.map((dept) => {
              const percentage = Math.round((dept.spend / dept.budget) * 100);
              const isOver = percentage > 100;
              const isWarning = percentage > 85 && percentage <= 100;
              
              return (
                <div key={dept.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dept.name}</span>
                    <span className="text-muted-foreground">{percentage}% ({formatCurrency(dept.spend)} of {formatCurrency(dept.budget)})</span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={`h-2 ${isOver ? 'bg-red-100 dark:bg-red-950' : ''}`} 
                    indicatorClassName={isOver ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary'}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Trends</CardTitle>
            <CardDescription>Month over month spend by top departments</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="Engineering" stroke="#1e293b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Sales" stroke="#64748b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Marketing" stroke="#94a3b8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
