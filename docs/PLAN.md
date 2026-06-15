# Country Wellness Check — Plan

## What We're Building

A single-page web app that puts up to four countries side by side across 11 wellness KPIs. Users pick countries from a searchable dropdown (3-char typeahead), see the latest values in a clean comparison table, and optionally enter a year range to get a trend line chart for each KPI.

---

## Feature Set

### F1 — Country Selection (up to 4)
Dropdowns at the top of the page. Each supports typeahead from 3 characters. Countries chosen appear as column headers in the table. Any country can be cleared and replaced.

### F2 — KPI Comparison Table
Rows = KPIs. Columns = selected countries. Groups KPIs by category (Economic / Social & Human Development / Governance & Stability / Environmental & Wellbeing). Shows latest available value per cell. Empty cell with a dash if no data exists.

**KPIs tracked (11 total):**

| # | Category | KPI | Source |
|---|----------|-----|--------|
| 1 | Economic | GDP (current USD) | World Bank API |
| 2 | Economic | GDP per Capita (current USD) | World Bank API |
| 3 | Economic | PPP (current intl $) | World Bank API |
| 4 | Economic | Gini Coefficient | World Bank API |
| 5 | Social | Human Development Index (HDI) | UNDP (static) |
| 6 | Social | Life Expectancy at Birth | World Bank API |
| 7 | Social | Literacy Rate (adults, %) | UNESCO (static) |
| 8 | Governance | Corruption Perceptions Index (CPI) | Transparency Intl (static) |
| 9 | Governance | Global Peace Index (GPI) | IEP (static) |
| 10 | Environment | Environmental Performance Index (EPI) | Yale (static) |
| 11 | Environment | World Happiness Score | SDSN (static) |

### F3 — Sources Section
At the bottom of every page load, a collapsible table listing each KPI, its custodian, and a link to the original data source.

### F4 — Year-Range Trend Charts
Optional start year and end year inputs above the table. When both are supplied and valid, a line chart appears below the table for each KPI, showing one line per selected country over the year range. World Bank KPIs are fetched live; static-data KPIs use embedded time-series rows. Chart uses Chart.js (CDN, no build step).

---

## Out of Scope (v1)

- User accounts / saved comparisons
- Data download / export
- Mobile-optimised layout (desktop-first for v1)
- Real-time data for CPI, GPI, EPI, WHR (static datasets embedded in JS)
- More than 4 countries

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Markup | HTML5 | No framework overhead needed for this scale |
| Styling | CSS3 (custom, no framework) | Full control, no dependency |
| Logic | Vanilla JS (ES modules) | No build step; fast to load and debug |
| Charts | Chart.js v4 (CDN) | Mature, lightweight, line chart support |
| Live data | World Bank REST API | Free, no auth, comprehensive coverage |
| Static data | Embedded JS objects in `src/staticData.js` | CPI, GPI, EPI, WHR, HDI, Literacy have no suitable free API |
| Hosting | Firebase Hosting | Consistent with other projects; fast CDN |
| CI/CD | GitHub Actions + FirebaseExtended/action-hosting-deploy | No manual deploy steps required |

---

## Delivery Strategy

All five doc stages below require explicit approval before the next stage starts. No code is written until Stage 4 (TASKS) is approved.

| Stage | Deliverable | Gate |
|-------|-------------|------|
| 1 | REQUIREMENTS.md | User approval |
| 2 | DESIGN.md | User approval |
| 3 | SPECS.md | User approval |
| 4 | TASKS.md | User approval |
| 5 | Implementation (task by task) | Each commit verified via CI |

---

## Key Constraints

- World Bank API has a rate limit of ~1 req/sec per IP; fetch in parallel but don't hammer it
- CPI scores run 0–100 (100 = cleanest); GPI runs 1–5 (1 = most peaceful) — display polarity clearly
- Some World Bank indicators have data gaps by country; the UI must handle missing cells gracefully
- No API keys or secrets needed in v1

---

## Approval-Gate Workflow

```
PLAN approved
  → REQUIREMENTS approved
    → DESIGN approved
      → SPECS approved
        → TASKS approved
          → Implementation begins
            → Each task committed and CI verified before next task starts
              → Docs updated in same commit as code
                → Deployment confirmed green
```

---

## Immediate Next Actions

1. Await user approval of this PLAN.md
2. On approval: write and present REQUIREMENTS.md
