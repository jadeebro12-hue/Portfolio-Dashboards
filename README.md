# React Dashboard Portfolio

Three production-quality dashboard applications built to demonstrate real-world React development skills across different industries. All dashboards are frontend-only with comprehensive realistic mock data — no backend required.

**Built with:** React · TypeScript · Tailwind CSS · shadcn/ui · Recharts · Wouter · Vite

---

## Dashboards

### 1. Portfolio Pulse — Affordable Housing Asset Management

> A compliance and financial management dashboard for LIHTC (Low-Income Housing Tax Credit) and HUD-regulated affordable housing portfolios.

Designed for institutional asset managers overseeing 15–25 affordable housing properties. Answers three questions at a glance: Is the portfolio financially healthy? Is it in compliance? What needs attention this week?

**Key features:**
- Portfolio Overview with occupancy trend chart and budget vs. actual NOI
- Compliance Tracker with overdue/due-this-week/upcoming grouping — modeled after how TIC recertifications and REAC inspections are actually tracked
- Rent Roll with rent-restriction violation flagging (units where current rent exceeds the AMI-restricted maximum)
- Investor Reporting with PDF export — generates a formatted compliance and financial summary per investor
- Alerts surface rent violations, overdue compliance, and negative NOI properties

**Domain logic:** AMI rent restriction enforcement, compliance period tracking, HUD/LIHTC funding source classification

---

### 2. CapitalOps — Finance Operations Dashboard

> Spend analytics, transaction management, invoice approvals, and vendor onboarding for a finance operations team.

**Key features:**
- Spend analytics with budget variance charts by category and department
- Transaction table with status badges, filtering, and detail view with approval history timeline
- Invoice approval queue with multi-step approval workflow
- 5-step vendor onboarding workflow with compliance fields and spend controls
- Audit trail with chronological activity logs

---

### 3. MetricFlow — SaaS Operations Dashboard

> Customer analytics, account management, and onboarding automation for a SaaS company.

**Key features:**
- MRR, churn rate, active accounts, and revenue trend charts
- Cohort retention analysis and funnel conversion charts
- Account list with health scores, status badges, search and filter
- Account detail view with usage charts, activity timeline, and contacts
- 5-step customer onboarding wizard with per-step validation and review screen
- Notifications feed and Settings

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Radix UI |
| Charts | Recharts |
| Routing | Wouter |
| State | TanStack React Query |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
artifacts/
├── portfolio-pulse/     # Affordable housing dashboard
├── capitalops/          # Finance operations dashboard
└── metricflow/          # SaaS operations dashboard
lib/
├── api-client-react/    # Generated React Query hooks
├── api-spec/            # OpenAPI specification
└── db/                  # Drizzle ORM schema
```

---

## Live Demos

- **Portfolio Pulse:** *(add your published URL here)*
- **CapitalOps:** *(add your published URL here)*
- **MetricFlow:** *(add your published URL here)*

---

## Running Locally

```bash
# Install dependencies
pnpm install

# Run all dashboards
pnpm --filter @workspace/portfolio-pulse run dev
pnpm --filter @workspace/capitalops run dev
pnpm --filter @workspace/metricflow run dev
```

Requires Node.js 20+ and pnpm.
