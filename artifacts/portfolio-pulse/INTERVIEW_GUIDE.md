# Portfolio Pulse — Interview Guide

How to explain, demo and defend Portfolio Pulse in an interview. Numbers below come from the app's seeded demo data. They're the same on every load; only the calendar dates move with today's date.

---

## 1. The 30-second pitch

> "Portfolio Pulse is a case study I built to show how AI-assisted development can automate the tracking work asset managers do by hand. It models an **affordable housing portfolio** — 18 LIHTC and HUD-funded properties, 2,184 units — and runs 23 automated checks across the rent roll, financials and compliance calendar. Instead of someone scanning spreadsheets, it surfaces a ranked action queue: rent-limit violations, overdue certifications, NOI misses and data conflicts, each with a reason and a next step.
>
> It's also honest about its data: it shows N/A instead of guessing, and every number has its definition one tap away."

## 1b. "Why did you build this?" and "How does it help asset managers?"

**Get the framing right.** The dashboard doesn't call an AI model at runtime. AI was the *build tool*; the product is *automated, rules-based tracking*. Say "I used AI-assisted development to build an automated tracking workflow", never "it's an AI-powered dashboard". If asked "where's the AI?", that's your strongest answer, not a weakness (see below).

### "Why did you build this?" (about 45 seconds)

> "I wanted to show, not just say, that I can take a manual, spreadsheet-heavy workflow and turn it into an automated one using AI tools. I picked affordable housing asset management because the tracking burden is real: every unit has an AMI rent limit, every property has a compliance calendar, and investors expect clean quarterly reports. Most of that is still checked by hand across rent rolls, budgets and calendars.
>
> So I built a case study end to end. I defined the problem and the rules, used an AI coding assistant to build it quickly, and spent my effort on the parts that need judgment: which checks matter, how to rank them, and how to handle bad or missing data without fabricating numbers. The result is a working product, with tests, that I can walk you through."

*Personalize the first line with your own background, e.g. "Coming from [property management / analytics / finance], I kept seeing…"*

### "How does this help an asset manager?" (about 60 seconds)

> "It replaces manual checking with automated tracking, and it tells you what to do first. Five concrete examples:"

| Manual work today | What the dashboard automates | Example from the data |
|---|---|---|
| Scanning the rent roll for rents above the AMI limit | Checks all 2,184 units on every load and flags overcharges as High severity | 3 overcharges, all at Riverside Commons |
| Watching the compliance calendar for income certifications and inspections | Sorts events into overdue / due this week / upcoming and queues the overdue ones | 4 overdue, including 2 tenant income certifications |
| Checking that the occupancy sent to investors matches the rent roll | Recomputes occupancy from the rent roll and flags gaps over 2 pts | 7 properties disagree; Maple Grove is off by 4.8 pts |
| Finding stale or broken records before they reach a report | 15 record checks plus a confidence tier on every unit | 367 expired leases still marked occupied; 4 impossible lease dates |
| Building investor reports and variance explanations | One-click PDF investor report; NOI misses over 5% are queued automatically | 6 properties missed NOI budget by more than 5% |

> "Everything lands in one Action Queue — 514 items ranked High, Medium, Low, each with a plain-English reason and a suggested action — and it exports to CSV so it can be handed to a property manager. The point is that the asset manager spends their time deciding, not hunting."

**Don't invent time savings.** If asked "how much time does it save?", answer: "I didn't measure that on real users. What I can say is it checks every unit and every deadline on every load instead of sampling, and it ranks the results. In a real pilot I'd measure hours spent on monthly compliance review before and after."

### "Where's the AI?" / "What did you do versus the AI?"

> "The AI was how I built it, and that's the skill I'm demonstrating: I used an AI coding assistant to go from idea to a tested, working product quickly. My job was the parts AI can't own: picking the problem, defining the 23 rules and their severities from how affordable housing compliance actually works, deciding to show N/A rather than fake listing data, reviewing what was generated, and catching issues — for example the NOI formula subtracting vacancy loss twice. I also kept the logic as plain, tested rules on purpose: for compliance, an asset manager needs to know exactly why something was flagged."

**Be ready to walk through it.** Know where things live: rules in `src/lib/analytics/exceptions.ts`, record checks and confidence tiers in `src/lib/analytics/inventory.ts`, definitions in `src/lib/analytics/definitions.ts`, and tests in `src/lib/analytics/__tests__/`.

### "Where would you add AI next?"

These are natural next steps. Present them as plans, not features that exist today.
1. **Draft variance commentary for investor reports:** an LLM writes the "why NOI missed budget" paragraph from the numbers the dashboard already computed, and a person approves it.
2. **Read documents into the tracker:** extract income and household data from tenant income certification PDFs and flag mismatches against the rent roll.
3. **Listing-to-unit matching:** use AI-assisted entity resolution for the listing feed. The match-confidence tiers and the review queue for low-confidence matches are already designed for it.
4. **Ask the queue questions:** "Which properties have overdue certifications and an NOI miss?", answered from the exception data, with links to the records.

> Principle to state: "AI drafts and suggests; the rules and a person decide. Compliance flags have to be explainable."

### One-liner (for "tell me about a project")
> "I used AI-assisted development to build an affordable-housing asset-management dashboard that automates compliance and performance tracking — 23 checks across 2,184 units that turn spreadsheets into a ranked action queue."

## 2. Who it's for and what problem it solves

**User:** an asset manager or compliance analyst responsible for 15–25 affordable properties, reporting to tax-credit investors, lenders, HUD and a state housing finance agency.

**Their problem:** affordable housing has two jobs at once. Properties have to **perform financially** (occupancy, NOI) *and* **stay in compliance** with rent and income limits for decades. Today that information is spread across rent rolls, budget spreadsheets, a compliance calendar and investor reports, and nobody knows which numbers to trust.

**What the dashboard does:** puts performance, compliance and data quality on one screen, then walks the user from portfolio totals → the property → the specific unit or record that needs action.

---

## 3. Affordable housing primer (know this cold)

| Term | What it means | Where it shows up in the app |
|---|---|---|
| **LIHTC** | Low-Income Housing Tax Credit (IRC §42). The main federal program for building affordable rental housing. Developers get tax credits and sell them to investors to raise equity. | Funding program on every property; filter on Diagnosis |
| **9% vs 4% LIHTC** | 9% credits are competitive and cover more of the cost. 4% credits are paired with tax-exempt bonds. | 11 properties use 9%, 7 use 4% + bonds |
| **AMI** | Area Median Income. Units are restricted to households earning at or below a % of AMI (30%, 40%, 50%, 60%). | AMI tier on every unit; AMI filter |
| **Set-aside** | The property's regulatory promise, e.g. "40% of units at or below 60% AMI." | Property set-asides; a unit whose tier isn't in its property's set-asides is flagged |
| **Rent limit** | Maximum rent for a restricted unit. Under LIHTC, gross rent (including a utility allowance) can't exceed 30% of the income limit for that AMI tier and unit size. | `maxAllowableRent`; any unit above it is a **rent-restriction violation** |
| **Rent overcharge** | Charging above the limit. It's reportable noncompliance (IRS Form 8823) and can put tax credits at risk. | 3 violations, all at Riverside Commons — High severity |
| **Compliance period / extended use** | 15-year federal compliance period, followed by an extended-use period (at least 15 more years). Investors usually exit after year 15. | 3 properties are past year 15 → "confirm extended-use monitoring" flag |
| **TIC / recertification** | Tenant Income Certification at move-in, then annual income recertification. | Compliance calendar; overdue TICs are High severity |
| **REAC / physical inspection** | HUD's physical inspection program (moving to the NSPIRE standard). | Compliance calendar |
| **HOME / Section 8 / State Trust Fund** | HOME = HUD block-grant funding. Section 8 = project-based rental assistance. State Trust Fund = state gap financing. Each layers on its own rules. | Funding sources on properties |
| **Syndicator** | Buys credits from the developer and sells them to investors; requires quarterly reporting. | Investors page: Crestwood and Meridian are syndicators |
| **Physical vs economic occupancy** | Physical = % of units leased. Economic = % of potential rent actually earned. | Physical from the rent roll; economic from financials |
| **GPR** | Gross potential rent: what you'd collect if every unit were leased at its rent. | Used to reconcile financials to the rent roll |
| **NOI** | Net operating income = revenue − operating expenses (before debt service). | NOI vs budget KPI, NOI exceptions |

> Be upfront: rent limits in the demo data are **illustrative** (a simple formula by bedroom count and AMI tier), not actual HUD-published limits for a real county.

---

## 4. The numbers (cheat sheet)

**Portfolio**
- **18 properties** in 17 states (two are in Portland, OR); **2,184 physical units**
- Funding: 9% LIHTC ×11 · 4% LIHTC + bonds ×7 · HOME ×4 · HUD Section 8 ×4 · State Trust Fund ×3
- Units by AMI tier: 60% → 1,102 · 50% → 721 · 30% → 243 · 40% → 118
- Unit mix is balanced: about 25% each studio / 1 BR / 2 BR / 3 BR

**Occupancy and rent**
- **Physical occupancy 94.7%**: 2,069 occupied (including 114 on notice); **115 vacant**
- **Economic occupancy ≈ 95%** each month (94.6%–95.7% over 12 months; budget is 95.0%)
- Average in-place rent runs at about **97–98% of the AMI limit**, so there's very little rent headroom
- Studios have the highest vacancy rate (6.4%)

**Compliance (the affordable housing story)**
- **3 rent-limit violations**, all at **Riverside Commons** (units 102, 203, 303); the largest is $1,544 against a $1,400 limit
- Compliance calendar: **4 overdue**, 6 due this week, 20 upcoming, 7 completed
- Overdue: 2 TICs (Oak Hill Senior Living, Riverside Commons), 1 HUD REAC (Cedarwood Terrace), 1 physical inspection (Maple Grove Estates)
- **3 properties past the 15-year compliance period**: Horizon View Towers (2023), Elm Street Family Housing and Liberty Heights (2025)

**Financial**
- **NOI −$39,284 vs budget** last month, portfolio-wide
- 6 properties missed NOI budget by more than 5%; the worst is Riverside Commons (−14.8%), then Pinecrest (−13.4%)

**Investors:** 6 reporting relationships: 2 LIHTC syndicators (quarterly), HUD (annual), 2 lenders, 1 state HFA. Reports export to PDF.

**Data trust**
- **83% of unit records pass all 15 checks** (1,813 High · 367 Medium · 4 Low · 0 Unresolved)
- **367 occupied units have an expired lease date**: renewals or month-to-month status not recorded
- **4 leases end before they start** (data-entry errors)
- **7 properties' reported occupancy disagrees with the rent roll** by more than 2 pts (the largest is Maple Grove Estates at −4.8 pts)
- **Action Queue: 514 exceptions**: 7 High · 23 Medium · 484 Low
- **The NOI finding:** in all 216 property-months, rental income + vacancy loss = rent-roll GPR. So rental income is already *net* of vacancy, yet the NOI formula subtracts vacancy loss again. NOI may be understated by about **$113K for last month**. Flagged, not silently "fixed."

---

## 5. Page-by-page tour

The sidebar follows the story: **Analyze** (the new decision flow) → **Operate** (day-to-day tools) → **Reference**.

### Analyze
1. **Portfolio Health**: 7 KPIs (properties, physical units, physical occupancy, vacant units, active listings, record confidence, NOI vs budget). Each has an ⓘ button with its definition, formula and source. Also an economic-occupancy trend, "Attention Needed", and three "Where to look next" cards that lead into the flow.
2. **Inventory & Data Trust**: the centerpiece.
   - Physical units vs listing activity side by side; each number is tagged *units* or *listings*.
   - An occupancy funnel that includes an "Unable to classify" stage.
   - Record confidence tiers with a legend and a pass/fail table for all 15 checks.
   - Reported-vs-rent-roll occupancy by property, and the NOI field-meaning finding.
3. **Leasing & Listings**: lease starts (with a prior-period comparison), the lease expiration schedule (631 leases expire in the next 90 days), and turnover by property and unit type. Listing metrics show N/A with the fields they need.
4. **Property Diagnosis**: a sortable property table (occupancy, gap vs reported, vacancy, rent-to-limit, % High-confidence records, exceptions) and a unit-mix table. Clicking a property's exceptions opens the Action Queue filtered to it.
5. **Action Queue**: every exception with severity, a plain-English reason, a suggested action and a key date. Filter, sort, paginate, export to CSV. A "Checks run / couldn't run" panel shows coverage.

### Operate (the original affordable housing tools)
- **Properties** → **Property detail**:
  - The rent roll flags every unit over its AMI limit in red.
  - The Financials tab shows 12-month NOI vs budget and a line-item variance table.
  - Plus the property's compliance events.
- **Compliance**: overdue / due this week / upcoming, like a compliance calendar for TIC recerts, REAC and agency monitoring.
- **Investors**: one card per investor with reporting frequency and due dates; **Generate Report** builds a one-page investor summary and exports it to PDF.
- **Alerts**: rent violations, overdue compliance and NOI misses in one list.

### Reference
- **Definitions & Methodology**: sources, refresh behavior, every metric's formula, thresholds, known limitations, the fields that would improve accuracy, and the design decisions.

---

## 6. Demo scripts

### 2-minute demo (the one to rehearse)
1. **Portfolio Health:** "18 properties, 2,184 units, 94.7% physically occupied, NOI about $39K under budget. Active listings say N/A, and that's on purpose: there's no listing feed, and a vacant unit isn't necessarily an advertised one."
2. **Click ⓘ on a KPI:** "Every metric shows its definition, formula and source."
3. **Inventory & Data Trust:** "Physical units on the left, listings on the right, each number labeled. 83% of records pass all fifteen checks. Seven properties report occupancy that disagrees with their own rent roll, so I'd check before quoting it to an investor. I also found that rental income already nets out vacancy, which means NOI is probably understated. I flagged that instead of quietly changing the formula."
4. **Property Diagnosis → Riverside Commons → exceptions:** "Riverside has three units charging above the AMI limit, an overdue income certification, and the worst NOI miss in the portfolio."
5. **Action Queue:** "Every row has a severity, a reason and a suggested action, and you can export it to CSV. The panel at the bottom lists the checks that couldn't run, so an empty queue never looks like clean data."
6. **Close:** "The principle: trustworthy, explainable metrics over artificially complete ones."

### Three stories to tell if they want depth
- **Riverside Commons, compliance risk:** 3 rent overcharges + overdue TIC + NOI −14.8%. In LIHTC, overcharges are reportable noncompliance, so this is the first call of the week. *(Properties → Riverside Commons → Rent Roll: red rows.)*
- **Horizon View Towers, a property in transition:** past its 15-year compliance period since 2023, the lowest health score (72), 88% occupancy with 30 vacant units, and NOI −7.1%. That's an asset-strategy question: extended-use obligations, investor exit, recapitalization.
- **Maple Grove Estates, conflicting data:** reported occupancy is 94% but the rent roll says 98.8%. Which do you send to the investor? The dashboard surfaces the gap instead of picking one.

---

## 7. Key design decisions (and why)

1. **Physical units and listings are modeled separately.** A unit is stable inventory; listings get duplicated, go stale, or stay up after leasing. Treating active listings as vacancy would overstate availability in some places and miss it in others.
2. **Missing data shows as N/A, with the fields it needs.** The listing logic (mapping coverage, duplicates, days on market, stale listings) is fully built and unit-tested on test records, but the app shows N/A until a real feed exists. No fake numbers.
3. **Problem records are surfaced, not dropped.** Every rent-roll record runs 15 checks and gets a tier (High / Medium / Low / Unresolved). Problems appear in the Action Queue with a reason; dropping them would make metrics look cleaner and hide the problem.
4. **Two occupancy sources are both shown.** Reported occupancy (property record) vs computed occupancy (rent roll), with gaps over 2 pts flagged.
5. **Existing calculations weren't silently changed.** When the NOI formula looked wrong, I documented the evidence and left the formula for the data owner to confirm.
6. **One definition source.** The ⓘ popovers and the Methodology page read the same definitions file, so they can't drift apart.

---

## 8. How it's built (for technical interviewers)

- **Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui + Radix, Recharts, Wouter, TanStack Query, pnpm workspaces.
- **Architecture:** all calculations live in `src/lib/analytics/` as **plain TypeScript with no React**: dates, missing-value handling, deduplication, formatting, inventory checks and confidence, listings, leasing, exceptions, filters, diagnostics, definitions. `model.ts` builds the portfolio model once; pages only render it.
- **Tests:** 26 tests on Node's built-in test runner (`pnpm --filter @workspace/portfolio-pulse test`). They cover date edge cases (impossible dates, time-zone shifts), divide-by-zero, de-duplication, every confidence tier, and the listing metrics on test records.
- **Robustness:** invalid, future or out-of-order dates are excluded from date metrics and flagged; empty inputs return N/A, never 0.
- **UX:** responsive from 390px phones to 1440px desktops (slide-out menu, card layouts on phones, 44px touch targets); one status color system with AA contrast; loading, empty and error states on every data view. Demo them with the sidebar's **Demo data state** control or `?state=loading|empty|error`.

---

## 9. Likely interview questions

**"Why not just use listings to count vacant units?"**
Listings and units aren't one-to-one: one unit can be posted on three sites, a listing can stay up after leasing, a unit can be pre-leased while occupied, and down units are vacant but never marketed. I keep them separate and would reconcile them through a mapping-coverage metric.

**"What's the difference between physical and economic occupancy?"**
Physical counts leased units (94.7%). Economic measures rent earned against potential (about 95%). They diverge with concessions, bad debt, or vacancies concentrated in larger, higher-rent units. In affordable housing they stay close because rents sit near the AMI limit.

**"How did you decide a record's confidence?"**
Fifteen transparent rules. Missing or duplicate identifiers → Unresolved. Fields that contradict each other (leased with no rent, lease end before start) → Low. Stale or incomplete (expired lease still marked occupied) → Medium. The record takes the worst tier among its failed checks. It's a documented proxy, not a black box.

**"What did you find in the data?"**
Four impossible lease dates, 367 expired leases still marked occupied, seven properties whose reported occupancy disagrees with the rent roll, and evidence that NOI double-counts vacancy loss.

**"Why didn't you fix the NOI formula?"**
The evidence is strong (216 of 216 records reconcile), but the meaning of the field belongs to accounting. Changing a headline financial metric without the data owner would break trust with investors. I quantified the impact (about $113K last month) and flagged it.

**"How would you productionize this?"**
- Data contracts for each source (types, null rules, freshness SLAs).
- Monitoring on row counts and check failures.
- Daily snapshots, so occupancy and data quality can be trended.
- Incremental refreshes.
- Entity-resolution QA on a labeled sample for listing→unit matching.
- Role-based access, so investor views never expose resident names.

**"What would you build next?"**
1. Connect a listing feed and turn on the mapping metrics.
2. Store daily status snapshots for trends.
3. Load real HUD income and rent limits by county and year.
4. Make "Mark complete" and the compliance calendar view functional, with an audit trail.

**"Is the data real?"**
No. It's seeded mock data designed to behave like a real portfolio, including realistic data defects. The value is in the modeling, the checks and the product decisions, which would carry over to a real source.

---

## 10. Know the limitations before they ask
- Mock data; rent limits are illustrative, not HUD-published.
- No listing feed → listing metrics are N/A by design.
- Unit status is a single snapshot → no occupancy trend or period-over-period comparison.
- The rent roll only holds current leases → earlier lease-start months are undercounted.
- The health score is a source field with no documented method; it's shown as reported and not used in any calculation.
- "Mark complete" buttons on Compliance aren't wired up yet, and the Calendar view is marked "Soon".

## 11. Run it
```bash
pnpm install
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/portfolio-pulse run dev   # open http://localhost:5173
pnpm --filter @workspace/portfolio-pulse test
```
