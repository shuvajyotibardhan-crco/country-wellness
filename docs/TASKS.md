# Country Wellness Check — Tasks

Tasks are ordered by dependency. Each maps to one atomic commit. Mark `[x]` immediately on completion.

---

## T1 — Project scaffold + docs commit
- [ ] Commit all root files (CLAUDE.md, progress.md, .gitignore, .env.example, README.md)
- [ ] Commit all approved docs (PLAN, REQUIREMENTS, DESIGN, SPECS, TASKS, architecture.drawio)
- [ ] Create GitHub repo `country-wellness` and push

**Commit message:** `chore: project scaffold, docs, and architecture diagram`

---

## T2 — Firebase project + deploy workflow
- [ ] Create `firebase.json` with hosting config (public: `.`, SPA rewrite to index.html, CSP header)
- [ ] Create `.firebaserc` with project ID placeholder
- [ ] Create `.github/workflows/deploy.yml` (push-to-main triggers Firebase Hosting deploy)
- [ ] Commit and push; verify CI run passes

**Commit message:** `chore: Firebase Hosting config and GitHub Actions deploy workflow`

**Manual steps (user):**
1. Create Firebase project at console.firebase.google.com
2. Enable Firebase Hosting
3. Add `FIREBASE_SERVICE_ACCOUNT` GitHub Secret (Project Settings → Service Accounts → Generate new private key)
4. Update `.firebaserc` with real project ID and push

---

## T3 — `src/countries.js` — full ISO country list
- [ ] Write `src/countries.js` exporting `ALL_COUNTRIES` array (195+ `{ code, name }` objects, alpha-3 codes)
- [ ] Export `filterCountries(query, excludedCodes)` function (3-char min, case-insensitive partial match, max 10 results)

**Commit message:** `feat: country list and typeahead filter (T3)`

---

## T4 — `src/kpi.js` — KPI definitions
- [ ] Write `src/kpi.js` exporting `KPI_DEFINITIONS` array — all 11 KPIs
- [ ] Each entry: `id`, `label`, `category`, `unit`, `wbIndicator` (or null), `format`, `polarity`, `source { name, url }`
- [ ] Implement all format functions (GDP T/B, GDP per capita with commas, PPP T/B, Gini 1dp, HDI 3dp, Life Expectancy 1dp + "yrs", Literacy %, CPI "N / 100", GPI 2dp, EPI 1dp, Happiness 2dp)

**Commit message:** `feat: KPI definitions with format functions (T4)`

---

## T5 — `src/staticData.js` — embedded datasets
- [ ] Write `STATIC_DATA` object covering all 6 static KPIs: `hdi`, `literacy`, `cpi`, `gpi`, `epi`, `happiness`
- [ ] Include ~50 major countries per KPI, years 2015–2024 where available
- [ ] Export `getLatestStatic(kpiId, countryCode)` → `{ value, year } | null`
- [ ] Export `getRangeStatic(kpiId, countryCode, fromYear, toYear)` → `[{ year, value }]` with null for missing years

**Commit message:** `feat: static datasets for HDI, CPI, GPI, EPI, WHR, Literacy (T5)`

---

## T6 — `src/worldbank.js` — World Bank API client
- [ ] Write `fetchLatest(countryCode, indicatorCode)` → `{ value, year } | null`
- [ ] Write `fetchRange(countryCode, indicatorCode, fromYear, toYear)` → `[{ year, value }]` sorted ascending
- [ ] Handle null values in WB response (retain as null, don't skip)
- [ ] Catch fetch errors and return null / empty array (never throw to caller)

**Commit message:** `feat: World Bank API client — fetchLatest and fetchRange (T6)`

---

## T7 — `index.html` — app shell and styles
- [ ] Write `index.html` with full page structure:
  - Page header (title + subtitle)
  - Four country selector slots (horizontal row)
  - Year-range inputs (From / To) with inline validation message area
  - `#table-container` div
  - `#charts-container` div
  - `#sources` section with static sources table (all 11 KPIs, links open in new tab)
- [ ] Write all CSS inline in `<style>` block:
  - Clean, professional colour scheme (white background, dark text, blue accents)
  - Four-column table layout with category group headers spanning all columns
  - Responsive chart widths
  - Loading spinner styles
  - Dropdown styles (positioned absolutely below input, max-height with scroll)
  - Clear button on each slot
- [ ] Load Chart.js v4 from CDN
- [ ] `<script type="module" src="src/app.js">`

**Commit message:** `feat: app shell HTML structure and styles (T7)`

---

## T8 — `src/table.js` — comparison table renderer
- [ ] Write `renderTable(countries, kpiDefs, latestData)` that builds and injects table DOM into `#table-container`
- [ ] Render category group header rows spanning all country columns
- [ ] Render one data row per KPI: label cell + one value cell per country
- [ ] Apply KPI `format()` function to each value; show "—" for null
- [ ] Show polarity note (if any) as small subscript under value
- [ ] Assign country colour from 4-slot fixed palette; apply to column header cells
- [ ] Write `showTableLoading(countries, kpiDefs)` to render skeleton with spinner per cell

**Commit message:** `feat: KPI comparison table renderer (T8)`

---

## T9 — `src/charts.js` — Chart.js line chart renderer
- [ ] Write `renderCharts(countries, kpiDefs, rangeData, fromYear, toYear)` that builds 11 charts into `#charts-container`
- [ ] One `<canvas>` per KPI; initialise Chart.js line chart per canvas
- [ ] One dataset per country, using the same colour palette as table headers
- [ ] `spanGaps: false` so missing years show as line breaks
- [ ] X-axis: year labels from fromYear to toYear
- [ ] Y-axis: KPI unit label
- [ ] Chart title: KPI label
- [ ] Write `destroyCharts()` to destroy all Chart.js instances before re-render (prevents canvas reuse errors)

**Commit message:** `feat: Chart.js line chart renderer for year-range view (T9)`

---

## T10 — `src/app.js` — orchestrator + CountrySelector
- [ ] Write `CountrySelector` class:
  - Manages one slot (input, dropdown, selected state, clear button)
  - Shows dropdown after 3 chars typed; hides on select or blur
  - Fires `countrychange` custom event on document when selection changes
  - `getSelected()` returns current `Country | null`
  - `reset()` clears selection and input
- [ ] Initialise 4 `CountrySelector` instances on `DOMContentLoaded`
- [ ] Listen for `countrychange` events; rebuild active country list; pass excluded codes to all selectors
- [ ] Listen for year-range input `change` events; run `validateYearRange()`; show/clear inline error
- [ ] Write `loadData()` implementing the parallel-fetch algorithm from SPECS
- [ ] Call `loadData()` on any country or year-range change

**Commit message:** `feat: app orchestrator, CountrySelector, and loadData (T10)`

---

## T11 — Integration test + polish pass
- [ ] Manual test: select 4 countries, verify table populates with all 11 KPIs
- [ ] Manual test: enter year range 2010–2023, verify 11 charts render with correct lines and gaps
- [ ] Manual test: enter reversed year range, verify inline error and no charts
- [ ] Manual test: select country with sparse data (e.g. South Sudan), verify "—" cells, no errors
- [ ] Manual test: clear a slot mid-session, verify column removed from table and charts
- [ ] Manual test: click all 11 source links — verify they open correct URLs in new tabs
- [ ] Fix any visual or data issues found
- [ ] Verify CI deploy is green on push

**Commit message:** `fix: integration polish and manual test fixes (T11)`

---

## T12 — Final docs update
- [ ] Update `progress.md` to reflect all tasks complete
- [ ] Confirm PLAN, REQUIREMENTS, DESIGN, SPECS all still accurate post-implementation
- [ ] Update CLAUDE.md with final GitHub repo URL and Firebase project ID

**Commit message:** `docs: final project docs update post-implementation (T12)`
