# Country Wellness Check — Project Context

## What It Is
A single-page web app for comparing up to four countries across 11 wellness KPIs across four categories: Economic, Social & Human Development, Governance & Stability, and Environmental & Wellbeing.

## Tech Stack
- **Frontend:** Vanilla HTML5 + CSS3 + JavaScript (ES modules, no build step)
- **Charts:** Chart.js via CDN
- **Live data:** World Bank REST API (`api.worldbank.org/v2/`) — no auth required
- **Static data:** Embedded JS datasets for HDI, Literacy Rate, CPI, GPI, EPI, World Happiness Score
- **Deployment:** Firebase Hosting via GitHub Actions (no manual `firebase deploy`)

## Architecture
- `index.html` — app shell, layout, styles
- `src/countries.js` — full ISO 3166-1 alpha-3 country list with names for typeahead
- `src/kpi.js` — KPI metadata: label, category, source, unit, World Bank indicator code (or static flag)
- `src/worldbank.js` — World Bank API fetch helper (single country/indicator/year-range)
- `src/staticData.js` — embedded datasets for non-API KPIs (HDI, CPI, GPI, EPI, WHR, Literacy)
- `src/table.js` — renders the comparison table
- `src/charts.js` — renders Chart.js line charts for year-range view
- `src/app.js` — orchestrator: country selection, mode switching, data fetch dispatch

## Key Rules & Gotchas
- Max 4 countries at a time (columns); KPIs are rows
- Typeahead activates after 3 characters typed
- Year range is optional; if omitted, only the latest available value is shown
- World Bank API returns data newest-first; code reverses to oldest-first for charts
- Some KPIs (CPI, GPI, EPI, WHR) are not on World Bank — served from embedded static data in `src/staticData.js`
- All ACs must use "shall" or "must" only — no other modal verbs

## Global Rules Reference
See `/Users/shuvajyotibardhan/Projects/.claude_rules.md` for:
- Project Kickoff — Folder Structure (mandatory first step)
- Token Savings Rules
- Documentation Rules (create/update REQUIREMENTS, DESIGN, SPECS, TASKS per feature)
- AC Language Rule — "shall" or "must" only in every Acceptance Criterion
- Feature Delivery Workflow (Stages 1–4 approved before any code)
- Global Task Completion Rule (mark [x] immediately on completion)
- Global Deployment Verification Rule (watch CI run after every push)

## GitHub Repo
TBD — to be created at first push

## Firebase Project
TBD — to be configured at deployment stage
