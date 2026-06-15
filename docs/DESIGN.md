# Country Wellness Check — Design

## High-Level Overview

Country Wellness Check is a zero-dependency static web app. The browser does all the work: it fetches live data from the World Bank REST API for six KPIs, reads embedded static datasets for the remaining five, and renders both a comparison table and optional Chart.js line charts — all without a server, a build step, or any login. The design philosophy is deliberately minimal: no framework, no bundler, no backend. This keeps the app fast to load, easy to audit, and trivially hostable anywhere.

---

## Architecture Diagram

![Architecture Diagram](architecture.drawio)

---

## Module Design

### `index.html`
The app shell. Holds the page skeleton: four country-selector slots, year-range inputs, the table container, the charts container, and the sources section. Imports all ES modules via `<script type="module" src="src/app.js">`. Contains all CSS in a `<style>` block (no external stylesheet dependency).

### `src/countries.js`
Exports a single array of `{ code, name }` objects — one per ISO 3166-1 country (195+ entries). Used by the typeahead logic. Also exports a `filterCountries(query, excluded)` function that returns case-insensitive partial matches, excluding already-selected country codes.

### `src/kpi.js`
Exports the `KPI_DEFINITIONS` array — one object per KPI. Each object carries:
- `id` — unique slug (e.g. `"gdp"`)
- `label` — display name
- `category` — one of four category strings
- `unit` — display unit string
- `source` — `{ name, url }` for the sources table
- `wbIndicator` — World Bank indicator code, or `null` for static-data KPIs
- `format` — a function that takes a raw number and returns a formatted string
- `polarity` — optional note (e.g. `"Higher = less corrupt"`)

### `src/worldbank.js`
Exports two async functions:
- `fetchLatest(countryCode, indicatorCode)` — fetches the most recent non-null value for one country/indicator pair. Returns `{ value, year }` or `null`.
- `fetchRange(countryCode, indicatorCode, fromYear, toYear)` — fetches annual values across a year range. Returns an array of `{ year, value }` sorted ascending by year. Null values in the response are retained as `null` entries (so charts show gaps, not interpolated lines).

Both functions call `https://api.worldbank.org/v2/country/{code}/indicator/{indicator}?format=json&mrv=1` (for latest) or with `date={from}:{to}` (for range). Errors are caught and returned as `null`/empty array to keep the UI resilient.

### `src/staticData.js`
Exports a `STATIC_DATA` map keyed by KPI id. Each entry is an object keyed by ISO 3166-1 alpha-3 country code, whose value is an object keyed by year. Example:

```js
STATIC_DATA.cpi["GBR"] = { 2018: 80, 2019: 77, 2020: 77, 2021: 78, 2022: 73, 2023: 71 }
```

Exports two helper functions:
- `getLatestStatic(kpiId, countryCode)` — returns the value from the most recent year available.
- `getRangeStatic(kpiId, countryCode, fromYear, toYear)` — returns `[{ year, value }]` for each year in range; `value` is `null` for missing years.

Data is curated from official reports (UNDP HDR, Transparency International, IEP, Yale EPI, World Happiness Report, UNESCO UIS) and covers 2015–2024 where available.

### `src/table.js`
Exports `renderTable(countries, kpiDefinitions, data)`. Receives the current country list and a pre-fetched data map `{ [countryCode]: { [kpiId]: { value, year } } }`. Builds the table DOM: category header rows, KPI label cells, one value cell per country. Applies the KPI `format` function to each value. Renders "—" for null. Writes directly into the `#table-container` element.

### `src/charts.js`
Exports `renderCharts(countries, kpiDefinitions, rangeData, fromYear, toYear)`. Receives time-series data as `{ [countryCode]: { [kpiId]: [{ year, value }] } }`. For each KPI, creates a `<canvas>` element and initialises a Chart.js line chart with `spanGaps: false` (preserves gaps for missing years). Destroys any previously rendered charts before re-rendering. Writes into `#charts-container`.

Country colours are drawn from a fixed palette of four distinct colours, assigned by slot position (not by country name), so the colour is consistent between the table header and the chart lines.

### `src/app.js`
The orchestrator. Responsibilities:
1. Initialises four `CountrySelector` instances on page load.
2. Listens for country add/remove events; updates the active country list.
3. Listens for year-range input changes; validates them.
4. On any change (country list or year range), calls `loadData()`.
5. `loadData()` dispatches parallel fetches for all active countries × all KPIs, collects results, then calls `renderTable()` and (if year range valid) `renderCharts()`.

The `CountrySelector` class (defined in `app.js`) manages one slot: the text input, the dropdown, selected state, and the "clear" button. It fires a custom `countrychange` event on the document when its selection changes.

---

## Design Considerations

### Why no framework?
The data model is simple: a flat list of country selections and a 2D map of fetched values. React/Vue would add bundle size and complexity with no material benefit for this scale. Vanilla JS with ES modules gives full control and loads faster.

### Why embed static data instead of scraping or proxying?
CPI, GPI, EPI, WHR, HDI, and Literacy Rate have no free public REST APIs with CORS support. Scraping their source sites client-side is blocked by CORS. A proxy server would add infrastructure and hosting cost. The data changes once per year at most, so embedding a curated annual snapshot in JS is accurate, zero-latency, and maintenance-free between releases.

### Why World Bank API for the other six?
The World Bank API is free, no-auth, CORS-enabled, and covers GDP, GDP per Capita, PPP, Gini, Life Expectancy, and Literacy Rate with annual data going back to the 1960s. It's the natural choice for any time-series requirement on these indicators.

### Why parallel fetches?
Each World Bank API call is independent. Sequential fetches with 4 countries × 6 live KPIs would mean up to 24 round-trips in series. Parallel via `Promise.allSettled` brings that to one concurrent batch, keeping table load time under ~2 seconds on a normal connection.

### Why `spanGaps: false` in Chart.js?
Many countries have missing years in World Bank data (the Gini index in particular). Interpolating across gaps would misrepresent the data. Showing a visual break is more honest.

### Why Firebase Hosting?
Consistent with the user's other projects. Firebase Hosting provides a fast global CDN for static assets and deploys cleanly from GitHub Actions with no manual steps required.

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Markup | HTML5 | No abstraction needed at this scale |
| Styling | CSS3 (inline in index.html) | Zero extra HTTP requests; easy to maintain |
| Logic | Vanilla JS (ES modules) | No build step; fast cold start; debuggable |
| Charts | Chart.js v4 (CDN) | Best-in-class line charts; no bundler needed |
| Live data | World Bank REST API | Free, CORS-enabled, no auth, time-series |
| Static data | `src/staticData.js` | For KPIs with no suitable public API |
| Country list | `src/countries.js` | ISO 3166-1 alpha-3 list, embedded |
| Hosting | Firebase Hosting | Fast CDN; GitHub Actions deploy |
| CI/CD | GitHub Actions + FirebaseExtended/action-hosting-deploy | No manual deploys |

---

## Deployment

1. Code is pushed to `main` on GitHub.
2. GitHub Actions workflow (`.github/workflows/deploy.yml`) triggers automatically.
3. Workflow copies static files to `dist/` (or serves from root), then deploys to Firebase Hosting via `FirebaseExtended/action-hosting-deploy@v0`.
4. No build step is required — the workflow copies files as-is.
5. Firebase Hosting serves `index.html` as the entry point with a SPA rewrite rule.

---

## Constraints & Known Limitations

| Constraint | Detail |
|-----------|--------|
| Static data freshness | CPI, GPI, EPI, WHR, HDI, Literacy data is updated manually; it won't auto-refresh when organisations publish new reports |
| World Bank data lag | Most WB indicators lag 1–2 years; "latest available" may be 2022 or 2023 for 2024/2025 queries |
| Gini data gaps | World Bank Gini data is survey-based and irregular; many countries have 5–10 year gaps |
| CORS on non-WB sources | No workaround available client-side; static data is the only viable option |
| 4-country maximum | Hard limit in v1 — layout designed for 4 columns |
| Desktop-first | No mobile breakpoints in v1; usable on tablet but not optimised for phones |
| No data export | Users must screenshot or copy-paste table values manually |
