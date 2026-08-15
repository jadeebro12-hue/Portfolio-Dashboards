import { useRef } from "react";
import { format, subMonths } from "date-fns";
import { Download, X, Building2, TrendingUp, TrendingDown, Shield, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Investor,
  properties,
  financials,
  complianceEvents,
  units,
} from "@/lib/mock-data";

interface ReportModalProps {
  investor: Investor | null;
  open: boolean;
  onClose: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function ReportModal({ investor, open, onClose }: ReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!investor) return null;

  const investorProps = properties.filter((p) => investor.properties.includes(p.id));
  const today = new Date();
  const lastMonth = format(subMonths(today, 1), "yyyy-MM");
  const twoMonthsAgo = format(subMonths(today, 2), "yyyy-MM");

  // Occupancy summary
  const avgOccupancy =
    investorProps.reduce((sum, p) => sum + p.currentOccupancyPct, 0) / investorProps.length;
  const totalUnitsCount = investorProps.reduce((sum, p) => sum + p.totalUnits, 0);

  // Financial summary — last month vs budget
  const propFinancials = financials.filter(
    (f) => investor.properties.includes(f.propertyId) && f.month === lastMonth
  );
  const totalNOIActual = propFinancials.reduce((sum, f) => {
    const income = f.rentalIncome.actual + f.otherIncome.actual - f.vacancyLoss.actual;
    return sum + income - f.operatingExpenses.actual;
  }, 0);
  const totalNOIBudget = propFinancials.reduce((sum, f) => {
    const income = f.rentalIncome.budget + f.otherIncome.budget - f.vacancyLoss.budget;
    return sum + income - f.operatingExpenses.budget;
  }, 0);
  const noiVariance = totalNOIActual - totalNOIBudget;
  const noiVariancePct = totalNOIBudget !== 0 ? noiVariance / Math.abs(totalNOIBudget) : 0;

  const totalRentActual = propFinancials.reduce((sum, f) => sum + f.rentalIncome.actual, 0);
  const totalRentBudget = propFinancials.reduce((sum, f) => sum + f.rentalIncome.budget, 0);
  const totalExpActual = propFinancials.reduce((sum, f) => sum + f.operatingExpenses.actual, 0);
  const totalExpBudget = propFinancials.reduce((sum, f) => sum + f.operatingExpenses.budget, 0);

  // Compliance events for investor's properties
  const investorCompliance = complianceEvents.filter((e) =>
    investor.properties.includes(e.propertyId)
  );
  const overdueEvents = investorCompliance.filter((e) => e.status === "overdue");
  const dueThisWeek = investorCompliance.filter((e) => e.status === "due-this-week");
  const upcomingEvents = investorCompliance.filter((e) => e.status === "upcoming").slice(0, 5);
  const completedEvents = investorCompliance.filter((e) => e.status === "completed");

  // Notable items: rent-restriction violations
  const investorUnits = units.filter((u) => investor.properties.includes(u.propertyId));
  const violations = investorUnits.filter((u) => u.currentRent > u.maxAllowableRent);

  const getPropertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? id;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      overdue: "bg-red-100 text-red-800 border-red-200",
      "due-this-week": "bg-amber-100 text-amber-800 border-amber-200",
      upcoming: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
    };
    const label: Record<string, string> = {
      overdue: "Overdue",
      "due-this-week": "Due This Week",
      upcoming: "Upcoming",
      completed: "Completed",
    };
    return (
      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${map[status] ?? ""}`}>
        {label[status] ?? status}
      </span>
    );
  };

  const handlePrint = () => {
    // Build a self-contained HTML document for the print window
    const reportDate = format(today, "MMMM d, yyyy");
    const periodLabel = format(subMonths(today, 1), "MMMM yyyy");

    const propertiesRows = investorProps
      .map((p) => {
        const pFin = financials.find(
          (f) => f.propertyId === p.id && f.month === lastMonth
        );
        const noi = pFin
          ? pFin.rentalIncome.actual +
            pFin.otherIncome.actual -
            pFin.vacancyLoss.actual -
            pFin.operatingExpenses.actual
          : 0;
        const noiBudget = pFin
          ? pFin.rentalIncome.budget +
            pFin.otherIncome.budget -
            pFin.vacancyLoss.budget -
            pFin.operatingExpenses.budget
          : 0;
        const variance = noi - noiBudget;
        const varColor = variance >= 0 ? "#15803d" : "#dc2626";
        return `
          <tr>
            <td>${p.name}</td>
            <td>${p.city}, ${p.state}</td>
            <td>${p.totalUnits}</td>
            <td>${(p.currentOccupancyPct * 100).toFixed(1)}%</td>
            <td>${fmt(noi)}</td>
            <td style="color:${varColor};font-weight:600">${variance >= 0 ? "+" : ""}${fmt(variance)}</td>
          </tr>`;
      })
      .join("");

    const complianceRows = [...overdueEvents, ...dueThisWeek, ...upcomingEvents.slice(0, 3)]
      .map((e) => {
        const statusColors: Record<string, string> = {
          overdue: "#dc2626",
          "due-this-week": "#d97706",
          upcoming: "#2563eb",
        };
        const color = statusColors[e.status] ?? "#374151";
        return `
          <tr>
            <td>${getPropertyName(e.propertyId)}</td>
            <td>${e.eventType}</td>
            <td>${e.dueDate}</td>
            <td style="color:${color};font-weight:600">${e.status === "due-this-week" ? "Due This Week" : e.status.charAt(0).toUpperCase() + e.status.slice(1)}</td>
          </tr>`;
      })
      .join("");

    const violationRows = violations
      .map((u) => {
        const prop = properties.find((p) => p.id === u.propertyId);
        const over = u.currentRent - u.maxAllowableRent;
        return `
          <tr>
            <td>${prop?.name ?? u.propertyId}</td>
            <td>${u.unitNumber}</td>
            <td>${u.amiTier}% AMI</td>
            <td>${fmt(u.currentRent)}</td>
            <td>${fmt(u.maxAllowableRent)}</td>
            <td style="color:#dc2626;font-weight:600">+${fmt(over)}</td>
          </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${investor.name} — Investor Report — ${reportDate}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.5; padding: 40px; }
  .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 24px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
  h1 { font-size: 22px; font-weight: 700; color: #1e3a5f; }
  .meta { color: #64748b; font-size: 10px; margin-top: 4px; }
  .badge { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; border: 1px solid #c7d2fe; background: #e0e7ff; color: #3730a3; margin-top: 6px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
  .kpi-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 4px; }
  .kpi-value { font-size: 20px; font-weight: 700; color: #1e3a5f; }
  .kpi-sub { font-size: 9px; color: #64748b; margin-top: 2px; }
  .positive { color: #15803d !important; }
  .negative { color: #dc2626 !important; }
  section { margin-bottom: 24px; }
  h2 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #1e3a5f; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead tr { background: #f1f5f9; }
  th { text-align: left; padding: 6px 8px; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; }
  .alert-box-title { font-weight: 700; color: #dc2626; font-size: 10px; margin-bottom: 2px; }
  .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div class="header-top">
    <div>
      <div class="brand">Portfolio Pulse</div>
      <h1>${investor.name}</h1>
      <div class="meta">Investor Report &mdash; Period: ${periodLabel} &mdash; Generated: ${reportDate}</div>
      <div class="badge">${investor.entityType} &nbsp;&middot;&nbsp; ${investor.reportingFrequency} Reporting</div>
    </div>
    <div style="text-align:right">
      <div class="kpi-label" style="margin-bottom:2px">Next Report Due</div>
      <div style="font-size:14px;font-weight:700;color:#1e3a5f">${investor.nextReportDueDate}</div>
      <div class="kpi-label" style="margin-top:8px;margin-bottom:2px">Properties Funded</div>
      <div style="font-size:14px;font-weight:700;color:#1e3a5f">${investorProps.length}</div>
    </div>
  </div>
</div>

<div class="kpis">
  <div class="kpi">
    <div class="kpi-label">Total Units</div>
    <div class="kpi-value">${totalUnitsCount.toLocaleString()}</div>
    <div class="kpi-sub">Across ${investorProps.length} properties</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Portfolio Occupancy</div>
    <div class="kpi-value">${(avgOccupancy * 100).toFixed(1)}%</div>
    <div class="kpi-sub">Weighted average</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">NOI vs Budget (${periodLabel})</div>
    <div class="kpi-value ${noiVariance >= 0 ? "positive" : "negative"}">${noiVariance >= 0 ? "+" : ""}${fmt(noiVariance)}</div>
    <div class="kpi-sub">${noiVariancePct >= 0 ? "+" : ""}${(noiVariancePct * 100).toFixed(1)}% vs budget</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Compliance Items</div>
    <div class="kpi-value ${overdueEvents.length > 0 ? "negative" : ""}">${overdueEvents.length} Overdue</div>
    <div class="kpi-sub">${dueThisWeek.length} due this week</div>
  </div>
</div>

${violations.length > 0 ? `
<div class="alert-box">
  <div class="alert-box-title">COMPLIANCE ALERT: ${violations.length} Rent Restriction Violation${violations.length > 1 ? "s" : ""} Detected</div>
  <div style="font-size:10px;color:#7f1d1d">Units where current rent exceeds the AMI-restricted maximum allowable rent. Immediate remediation required.</div>
</div>` : ""}

<section>
  <h2>Property Performance Summary &mdash; ${periodLabel}</h2>
  <table>
    <thead><tr>
      <th>Property</th><th>Location</th><th>Units</th><th>Occupancy</th><th>NOI Actual</th><th>Variance vs Budget</th>
    </tr></thead>
    <tbody>${propertiesRows}</tbody>
  </table>
</section>

<section>
  <h2>Financial Summary</h2>
  <table>
    <thead><tr><th>Line Item</th><th>Actual</th><th>Budget</th><th>Variance</th></tr></thead>
    <tbody>
      <tr><td>Rental Income</td><td>${fmt(totalRentActual)}</td><td>${fmt(totalRentBudget)}</td><td style="color:${totalRentActual >= totalRentBudget ? "#15803d" : "#dc2626"}">${fmt(totalRentActual - totalRentBudget)}</td></tr>
      <tr><td>Operating Expenses</td><td>${fmt(totalExpActual)}</td><td>${fmt(totalExpBudget)}</td><td style="color:${totalExpActual <= totalExpBudget ? "#15803d" : "#dc2626"}">${fmt(totalExpActual - totalExpBudget)}</td></tr>
      <tr style="font-weight:700;background:#f8fafc"><td>Net Operating Income</td><td>${fmt(totalNOIActual)}</td><td>${fmt(totalNOIBudget)}</td><td style="color:${noiVariance >= 0 ? "#15803d" : "#dc2626"};font-weight:700">${noiVariance >= 0 ? "+" : ""}${fmt(noiVariance)}</td></tr>
    </tbody>
  </table>
</section>

${complianceRows ? `
<section>
  <h2>Compliance Events — Active &amp; Upcoming</h2>
  <table>
    <thead><tr><th>Property</th><th>Event Type</th><th>Due Date</th><th>Status</th></tr></thead>
    <tbody>${complianceRows}</tbody>
  </table>
</section>` : ""}

${violations.length > 0 ? `
<section>
  <h2>Rent Restriction Violations</h2>
  <table>
    <thead><tr><th>Property</th><th>Unit</th><th>AMI Tier</th><th>Current Rent</th><th>Max Allowable</th><th>Over by</th></tr></thead>
    <tbody>${violationRows}</tbody>
  </table>
</section>` : ""}

<div class="footer">
  <span>Portfolio Pulse &mdash; Affordable Housing Asset Management &mdash; Demo Environment. All data is mocked.</span>
  <span>Generated ${reportDate}</span>
</div>
</body></html>`;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      alert("Please allow popups to download the PDF report.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  };

  const varColor = noiVariance >= 0 ? "text-green-600" : "text-red-600";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{investor.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {investor.entityType} &middot; {investor.reportingFrequency} Reporting &middot; Next due:{" "}
                <span className="font-medium text-foreground">{investor.nextReportDueDate}</span>
              </p>
            </div>
            <Button onClick={handlePrint} className="gap-2 shrink-0 ml-4">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div ref={reportRef} className="space-y-6 pt-2">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Units", value: totalUnitsCount.toLocaleString(), sub: `${investorProps.length} properties` },
              { label: "Avg Occupancy", value: pct(avgOccupancy), sub: "Portfolio weighted" },
              { label: "NOI vs Budget", value: `${noiVariance >= 0 ? "+" : ""}${fmt(noiVariance)}`, sub: `${noiVariancePct >= 0 ? "+" : ""}${(noiVariancePct * 100).toFixed(1)}% variance`, color: varColor },
              { label: "Compliance", value: `${overdueEvents.length} Overdue`, sub: `${dueThisWeek.length} due this week`, color: overdueEvents.length > 0 ? "text-red-600" : "text-foreground" },
            ].map((k) => (
              <div key={k.label} className="border rounded-md p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</div>
                <div className={`text-xl font-bold mt-1 ${k.color ?? "text-foreground"}`}>{k.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Violation alert */}
          {violations.length > 0 && (
            <div className="flex gap-3 bg-red-50 border border-red-200 rounded-md p-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">
                  {violations.length} Rent Restriction Violation{violations.length > 1 ? "s" : ""} Detected
                </p>
                <p className="text-red-700 text-xs mt-0.5">
                  Units where current rent exceeds AMI-restricted maximum. Immediate remediation required.
                </p>
              </div>
            </div>
          )}

          {/* Property table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" /> Property Performance — {format(subMonths(today, 1), "MMMM yyyy")}
            </h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {["Property", "Location", "Units", "Occupancy", "NOI Actual", "vs Budget"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground border-b">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {investorProps.map((p) => {
                    const pFin = financials.find((f) => f.propertyId === p.id && f.month === lastMonth);
                    const noi = pFin
                      ? pFin.rentalIncome.actual + pFin.otherIncome.actual - pFin.vacancyLoss.actual - pFin.operatingExpenses.actual
                      : 0;
                    const noiBudget = pFin
                      ? pFin.rentalIncome.budget + pFin.otherIncome.budget - pFin.vacancyLoss.budget - pFin.operatingExpenses.budget
                      : 0;
                    const v = noi - noiBudget;
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{p.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{p.city}, {p.state}</td>
                        <td className="px-3 py-2">{p.totalUnits}</td>
                        <td className="px-3 py-2">{(p.currentOccupancyPct * 100).toFixed(1)}%</td>
                        <td className="px-3 py-2 font-medium">{fmt(noi)}</td>
                        <td className={`px-3 py-2 font-semibold ${v >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {v >= 0 ? "+" : ""}{fmt(v)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial summary */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" /> Financial Summary
            </h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {["Line Item", "Actual", "Budget", "Variance"].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground border-b">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-muted/20">
                    <td className="px-3 py-2">Rental Income</td>
                    <td className="px-3 py-2 font-medium">{fmt(totalRentActual)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmt(totalRentBudget)}</td>
                    <td className={`px-3 py-2 font-semibold ${totalRentActual >= totalRentBudget ? "text-green-600" : "text-red-600"}`}>
                      {fmt(totalRentActual - totalRentBudget)}
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-muted/20">
                    <td className="px-3 py-2">Operating Expenses</td>
                    <td className="px-3 py-2 font-medium">{fmt(totalExpActual)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmt(totalExpBudget)}</td>
                    <td className={`px-3 py-2 font-semibold ${totalExpActual <= totalExpBudget ? "text-green-600" : "text-red-600"}`}>
                      {fmt(totalExpActual - totalExpBudget)}
                    </td>
                  </tr>
                  <tr className="bg-muted/30 font-semibold hover:bg-muted/40">
                    <td className="px-3 py-2">Net Operating Income</td>
                    <td className="px-3 py-2">{fmt(totalNOIActual)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmt(totalNOIBudget)}</td>
                    <td className={`px-3 py-2 ${noiVariance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {noiVariance >= 0 ? "+" : ""}{fmt(noiVariance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance */}
          {(overdueEvents.length > 0 || dueThisWeek.length > 0 || upcomingEvents.length > 0) && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> Compliance Events — Active & Upcoming
              </h3>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Property", "Event Type", "Due Date", "Status"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground border-b">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...overdueEvents, ...dueThisWeek, ...upcomingEvents].map((e) => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{getPropertyName(e.propertyId)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{e.eventType}</td>
                        <td className="px-3 py-2">{e.dueDate}</td>
                        <td className="px-3 py-2">{statusBadge(e.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rent violations */}
          {violations.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" /> Rent Restriction Violations
              </h3>
              <div className="border border-red-200 rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-red-50">
                    <tr>
                      {["Property", "Unit", "AMI Tier", "Current Rent", "Max Allowable", "Over by"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-semibold text-[10px] uppercase tracking-wider text-red-700 border-b border-red-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {violations.map((u) => {
                      const prop = properties.find((p) => p.id === u.propertyId);
                      const over = u.currentRent - u.maxAllowableRent;
                      return (
                        <tr key={u.id} className="border-b last:border-0 bg-red-50/40">
                          <td className="px-3 py-2 font-medium">{prop?.name}</td>
                          <td className="px-3 py-2">{u.unitNumber}</td>
                          <td className="px-3 py-2">{u.amiTier}% AMI</td>
                          <td className="px-3 py-2 font-medium">{fmt(u.currentRent)}</td>
                          <td className="px-3 py-2 text-muted-foreground">{fmt(u.maxAllowableRent)}</td>
                          <td className="px-3 py-2 font-semibold text-red-600">+{fmt(over)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center pt-2 border-t">
            Portfolio Pulse &mdash; Demo Environment. All data is mocked. Generated {format(today, "MMMM d, yyyy")}.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
