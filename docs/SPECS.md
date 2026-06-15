# Country Wellness Check — Specs

## Data Models

### Country
```js
{
  code: string,   // ISO 3166-1 alpha-3, e.g. "GBR"
  name: string    // Display name, e.g. "United Kingdom"
}
```

### KpiDefinition
```js
{
  id:          string,           // Unique slug, e.g. "gdp", "cpi", "hdi"
  label:       string,           // Display name, e.g. "GDP (Current USD)"
  category:    string,           // One of: "Economic" | "Social & Human Development" | "Governance & Stability" | "Environmental & Wellbeing"
  unit:        string,           // E.g. "USD", "score (0–100)", "years"
  wbIndicator: string | null,    // World Bank indicator code, e.g. "NY.GDP.MKTP.CD"; null for static KPIs
  format:      (value: number) => string,  // Formats raw number for table display
  polarity:    string | null,    // Optional note, e.g. "Higher = less corrupt"
  source: {
    name: string,                // Custodian name, e.g. "The World Bank"
    url:  string                 // Official data URL
  }
}
```

### DataPoint
```js
{
  value: number | null,  // null means no data available
  year:  number          // Four-digit year the value was reported
}
```

### TimeSeriesPoint
```js
{
  year:  number,
  value: number | null   // null produces a gap in the chart line
}
```

### AppState (held in app.js, not persisted)
```js
{
  countries:  Country[],           // 0–4 currently selected countries, in slot order
  fromYear:   number | null,
  toYear:     number | null,
  latestData: {                    // Populated after each fetch
    [countryCode: string]: {
      [kpiId: string]: DataPoint | null
    }
  },
  rangeData: {                     // Populated only when fromYear + toYear are valid
    [countryCode: string]: {
      [kpiId: string]: TimeSeriesPoint[]
    }
  }
}
```

---

## Storage Schema

No persistent storage. All state is held in memory for the duration of the browser session. Refreshing the page resets everything.

---

## API Endpoints

### World Bank REST API

Base URL: `https://api.worldbank.org/v2`

All requests use `format=json`. No authentication required. CORS is enabled by the World Bank for browser requests.

#### Fetch latest value
```
GET /country/{iso3code}/indicator/{indicatorCode}?format=json&mrv=1&gapfill=Y
```
| Param | Description |
|-------|-------------|
| `iso3code` | ISO 3166-1 alpha-3 country code (World Bank also accepts alpha-2; we use alpha-3) |
| `indicatorCode` | World Bank indicator code |
| `mrv=1` | Most recent value only |
| `gapfill=Y` | Fill gaps with prior year data where available |

Response shape:
```json
[
  { "page": 1, "pages": 1, "per_page": 1, "total": 1 },
  [
    { "value": 3085169650000, "date": "2023", "country": { "id": "GB", "value": "United Kingdom" } }
  ]
]
```
Null value in `value` field means no data for that country/indicator.

#### Fetch year range
```
GET /country/{iso3code}/indicator/{indicatorCode}?format=json&date={fromYear}:{toYear}&per_page=100
```
| Param | Description |
|-------|-------------|
| `date` | Year range in format `YYYY:YYYY`, e.g. `2010:2023` |
| `per_page=100` | Avoids pagination for ranges up to 100 years |

Response returns array sorted **newest-first**. Client code reverses to oldest-first before rendering.

#### World Bank indicator codes used

| KPI | Indicator Code |
|-----|---------------|
| GDP (current USD) | `NY.GDP.MKTP.CD` |
| GDP per Capita (current USD) | `NY.GDP.PCAP.CD` |
| PPP (current intl $) | `NY.GDP.MKTP.PP.CD` |
| Gini Coefficient | `SI.POV.GINI` |
| Life Expectancy at Birth | `SP.DYN.LE00.IN` |

**Note:** Literacy Rate (`SE.ADT.LITR.ZS`) is available on World Bank but has very poor coverage for high-income countries. It is served from the embedded static dataset instead.

---

## Algorithms

### Typeahead Filter
```
function filterCountries(query, excludedCodes):
  if query.length < 3: return []
  q = query.toLowerCase().trim()
  return ALL_COUNTRIES
    .filter(c => !excludedCodes.includes(c.code))
    .filter(c => c.name.toLowerCase().includes(q))
    .slice(0, 10)   // Cap dropdown at 10 results
```

### Load Data (triggered on any country or year-range change)
```
async function loadData(state):
  show loading indicators in all cells

  // Build fetch jobs
  latestJobs = []
  for each country in state.countries:
    for each kpi in KPI_DEFINITIONS:
      if kpi.wbIndicator != null:
        latestJobs.push(fetchLatest(country.code, kpi.wbIndicator))
      else:
        latestJobs.push(getLatestStatic(kpi.id, country.code))

  results = await Promise.allSettled(latestJobs)
  map results back into state.latestData[countryCode][kpiId]

  renderTable(state.countries, KPI_DEFINITIONS, state.latestData)

  if state.fromYear != null AND state.toYear != null AND state.toYear >= state.fromYear:
    rangeJobs = []
    for each country in state.countries:
      for each kpi in KPI_DEFINITIONS:
        if kpi.wbIndicator != null:
          rangeJobs.push(fetchRange(country.code, kpi.wbIndicator, state.fromYear, state.toYear))
        else:
          rangeJobs.push(getRangeStatic(kpi.id, country.code, state.fromYear, state.toYear))

    rangeResults = await Promise.allSettled(rangeJobs)
    map results back into state.rangeData[countryCode][kpiId]
    renderCharts(state.countries, KPI_DEFINITIONS, state.rangeData, state.fromYear, state.toYear)
  else:
    clearCharts()
```

### fetchLatest (worldbank.js)
```
async function fetchLatest(countryCode, indicatorCode):
  url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorCode}?format=json&mrv=1&gapfill=Y`
  try:
    response = await fetch(url)
    [meta, data] = await response.json()
    if !data or data.length == 0: return null
    entry = data[0]
    if entry.value == null: return null
    return { value: entry.value, year: parseInt(entry.date) }
  catch:
    return null
```

### fetchRange (worldbank.js)
```
async function fetchRange(countryCode, indicatorCode, fromYear, toYear):
  url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorCode}?format=json&date=${fromYear}:${toYear}&per_page=100`
  try:
    response = await fetch(url)
    [meta, data] = await response.json()
    if !data: return []

    // Build a year → value map from API response (newest-first)
    yearMap = {}
    for entry in data:
      yearMap[parseInt(entry.date)] = entry.value ?? null

    // Return sorted ascending, with null for missing years
    result = []
    for y = fromYear to toYear:
      result.push({ year: y, value: yearMap[y] ?? null })
    return result
  catch:
    return []
```

### Year Range Validation
```
function validateYearRange(fromYear, toYear):
  if fromYear == null OR toYear == null: return { valid: false, reason: null }
  if isNaN(fromYear) OR isNaN(toYear): return { valid: false, reason: "Years must be numbers" }
  if toYear < fromYear: return { valid: false, reason: "End year must be after start year" }
  if fromYear < 1960: return { valid: false, reason: "Start year must be 1960 or later" }
  if toYear > currentYear: return { valid: false, reason: "End year cannot be in the future" }
  return { valid: true, reason: null }
```

---

## Static Dataset Structure (src/staticData.js)

Each KPI that has no suitable live API is stored as a nested object:

```js
const STATIC_DATA = {
  hdi: {
    // UNDP Human Development Index (0–1 scale)
    GBR: { 2015: 0.921, 2016: 0.920, 2017: 0.921, 2018: 0.923, 2019: 0.929, 2020: 0.929, 2021: 0.929, 2022: 0.940, 2023: 0.940 },
    USA: { 2015: 0.920, 2016: 0.921, 2017: 0.924, 2018: 0.926, 2019: 0.926, 2020: 0.921, 2021: 0.921, 2022: 0.927, 2023: 0.930 },
    // ... ~50 major countries
  },
  literacy: {
    // UNESCO adult literacy rate (% age 15+)
    // ...
  },
  cpi: {
    // Transparency International Corruption Perceptions Index (0–100, higher = less corrupt)
    // ...
  },
  gpi: {
    // IEP Global Peace Index (1–5, lower = more peaceful)
    // ...
  },
  epi: {
    // Yale Environmental Performance Index (0–100)
    // Published every 2 years (2016, 2018, 2020, 2022, 2024)
    // ...
  },
  happiness: {
    // World Happiness Report score (0–10)
    // ...
  }
}
```

Helper functions:
```js
// Returns { value, year } for the most recent year with data, or null
function getLatestStatic(kpiId, countryCode)

// Returns [{ year, value }] for fromYear–toYear; value=null for missing years
function getRangeStatic(kpiId, countryCode, fromYear, toYear)
```

---

## KPI Format Functions

| KPI | Format function output |
|-----|----------------------|
| GDP | `$3.09T` (trillions) or `$450.2B` (billions) |
| GDP per Capita | `$46,125` |
| PPP | `$3.21T` |
| Gini | `33.1` |
| HDI | `0.940` |
| Life Expectancy | `81.3 yrs` |
| Literacy Rate | `99.0%` |
| CPI | `73 / 100` |
| GPI | `1.44` |
| EPI | `75.8` |
| Happiness | `6.94` |

---

## Configuration

No environment variables. No config file. No build step.

The only configurable constant, inline in `src/worldbank.js`:
```js
const WB_BASE = 'https://api.worldbank.org/v2';
```

Chart.js and its locale helper are loaded from CDN in `index.html`:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
```

---

## File Inventory

```
Country Wellness/
├── index.html                        # App shell: layout, styles, script entry point
├── src/
│   ├── app.js                        # Orchestrator; CountrySelector class; loadData()
│   ├── countries.js                  # ISO 3166-1 country list; filterCountries()
│   ├── kpi.js                        # KPI_DEFINITIONS array; format functions
│   ├── worldbank.js                  # fetchLatest(); fetchRange()
│   ├── staticData.js                 # STATIC_DATA map; getLatestStatic(); getRangeStatic()
│   ├── table.js                      # renderTable()
│   └── charts.js                     # renderCharts(); destroyCharts()
├── docs/
│   ├── PLAN.md
│   ├── REQUIREMENTS.md
│   ├── DESIGN.md
│   ├── SPECS.md                      # This file
│   ├── TASKS.md
│   ├── architecture.drawio
│   └── architecture.png
├── .github/
│   └── workflows/
│       └── deploy.yml                # Firebase Hosting deploy on push to main
├── CLAUDE.md
├── README.md
├── progress.md
├── .gitignore
├── .env.example
└── International Metrics Public Sources.md   # Source reference (not shipped)
```

---

## Browser Compatibility

| Feature | Minimum requirement |
|---------|-------------------|
| ES modules (`type="module"`) | Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+ |
| `fetch()` API | Chrome 42+, Firefox 39+, Safari 10.1+, Edge 14+ |
| `Promise.allSettled()` | Chrome 76+, Firefox 71+, Safari 13+, Edge 79+ |
| CSS Grid | Chrome 57+, Firefox 52+, Safari 10.1+, Edge 16+ |
| Chart.js v4 | Requires Canvas API — all modern browsers |

**Minimum supported:** Chrome 76, Firefox 71, Safari 13, Edge 79. IE11 not supported.

---

## Security Notes

- No user authentication, no session tokens, no cookies.
- No data is sent to any server other than the World Bank API (read-only GET requests).
- The World Bank API URL is hardcoded; no user input is ever interpolated into fetch URLs (country codes come from the closed country list, not free text).
- No `eval()`, no `innerHTML` on user-controlled strings — all DOM construction uses `document.createElement` and `textContent`.
- Content Security Policy header can be set in `firebase.json` hosting headers: `default-src 'self'; script-src 'self' cdn.jsdelivr.net; connect-src api.worldbank.org`.
- No secrets, no API keys, no `.env` file required.
