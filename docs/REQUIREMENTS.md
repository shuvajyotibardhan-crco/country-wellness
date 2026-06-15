# Country Wellness Check — Requirements

## Overview

Country Wellness Check is a single-page web app for researchers, students, and curious readers who want to compare national well-being across countries. It puts up to four countries side by side across 11 KPIs, shows the latest available data in a table, and optionally plots multi-year trends as line charts.

## Scope

**In scope:**
- Country selection via searchable dropdown (up to 4 countries)
- KPI comparison table (11 KPIs, grouped by category)
- Optional year-range trend charts (Chart.js line charts)
- Source citations section at page bottom
- Desktop-first layout

**Out of scope (v1):**
- User accounts or saved comparisons
- Data export or download
- Mobile-optimised layout
- More than 4 countries simultaneously
- Real-time data for CPI, GPI, EPI, WHR, HDI, Literacy (these use embedded static datasets)

---

## Feature 1 — Country Selection

**User story:** As a user, I want to search for and select up to four countries so that I can compare their wellness data side by side.

### Acceptance Criteria

1. The page **shall** display four country selector slots arranged horizontally at the top.
2. Each slot **shall** contain a text input and a dropdown list of countries.
3. The dropdown **shall** only appear after the user has typed at least 3 characters.
4. The dropdown **shall** filter the full list of UN-recognised countries by matching any part of the country name (case-insensitive).
5. Selecting a country from the dropdown **shall** populate the slot and close the dropdown.
6. A selected country **shall** be displayed as a column header in the KPI table.
7. The user **shall** be able to clear any slot, which **shall** remove that country's column from the table.
8. The same country **must not** be selectable in more than one slot at the same time.
9. Slots 2, 3, and 4 **shall** be usable independently — the user **must not** be forced to fill slots in order.
10. The country list **must** include all ISO 3166-1 countries (at minimum the 195 UN member and observer states).

### Test Plan

| Step | Expected Result |
|------|----------------|
| Type 2 characters into a slot | Dropdown does not appear |
| Type 3 characters (e.g. "Uni") | Dropdown appears with matching countries (United Kingdom, United States, United Arab Emirates, etc.) |
| Click "United Kingdom" | Slot shows "United Kingdom"; dropdown closes; table gains a column |
| Type "bra" in slot 2 | "Brazil" appears in dropdown |
| Select "Brazil" | Table now shows two country columns |
| Clear slot 1 | United Kingdom column disappears from table; slot resets to empty |
| Try to select "Brazil" in slot 3 | "Brazil" does not appear in the dropdown (already selected) |
| Fill all 4 slots | Table shows 4 country columns; all 4 slots show selected countries |

---

## Feature 2 — KPI Comparison Table

**User story:** As a user, I want to see a table of wellness KPIs with one column per selected country so that I can compare national performance at a glance.

### Acceptance Criteria

1. The table **shall** display one row per KPI and one column per selected country.
2. KPI rows **shall** be grouped under four category headers: Economic, Social & Human Development, Governance & Stability, Environmental & Wellbeing.
3. The table **shall** include all 11 KPIs listed in the Plan, in the order defined there.
4. Each cell **shall** show the most recent available value for that country and KPI.
5. Where no data exists for a country/KPI combination, the cell **shall** display a dash (—) and **must not** display an error or blank.
6. GDP and PPP values **shall** be formatted with comma separators and a USD/intl$ suffix.
7. Gini, HDI, Literacy Rate, and EPI **shall** be displayed as numeric values with one decimal place.
8. CPI **shall** be displayed as a score out of 100, with a note that higher = less corrupt.
9. GPI **shall** be displayed to two decimal places, with a note that lower = more peaceful.
10. World Happiness Score **shall** be displayed to two decimal places (scale 0–10).
11. Life Expectancy **shall** be displayed in years, rounded to one decimal place.
12. The table **shall** load data for all selected countries simultaneously (parallel fetch), not sequentially.
13. While data is loading, each cell **shall** show a loading indicator.
14. The category group headers **shall** span all country columns visually.

### Test Plan

| Step | Expected Result |
|------|----------------|
| Select one country (e.g. Germany) | Table shows one column with all 11 KPI values populated or "—" |
| Select a second country (e.g. Japan) | Table gains a second column; both columns update simultaneously |
| Select a country with sparse data (e.g. South Sudan) | Some cells show "—" without error |
| Check GDP cell for USA | Value shows in billions/trillions with commas and "USD" suffix |
| Check GPI cell | Shows value like "1.44" with "lower = more peaceful" note visible |
| Check CPI cell | Shows value like "79" with "out of 100" and "higher = less corrupt" note |
| Remove a country | That column disappears; remaining columns remain intact |

---

## Feature 3 — Sources Section

**User story:** As a user, I want to see where each KPI's data comes from so that I can trust the numbers and follow up with primary sources.

### Acceptance Criteria

1. A sources section **shall** appear at the bottom of the page, below the charts (or below the table if no year range is entered).
2. The section **shall** contain a table with three columns: KPI name, custodian/organisation, and a clickable link to the public data source.
3. The sources table **shall** list all 11 KPIs.
4. All source links **shall** open in a new browser tab.
5. The sources section **shall** be visible without any user interaction (not hidden by default).
6. The section **shall** include a heading "Data Sources".

### Test Plan

| Step | Expected Result |
|------|----------------|
| Load the page with no countries selected | Sources section is visible at bottom with all 11 rows |
| Click any source link | Link opens in a new tab pointing to the correct official URL |
| Verify all 11 KPIs are listed | All 11 rows present with custodian name and working link |

---

## Feature 4 — Year-Range Trend Charts

**User story:** As a user, I want to enter a start year and end year so that I can see how each KPI has changed over time for my selected countries.

### Acceptance Criteria

1. The page **shall** include two numeric inputs: "From year" and "To year", positioned above the KPI table.
2. Both inputs **shall** accept four-digit years only.
3. If neither input is filled, the page **shall** show only the table (no charts rendered).
4. Charts **shall** only render when both "From year" and "To year" are provided and the end year is greater than or equal to the start year.
5. When valid years are entered, a line chart **shall** appear for each of the 11 KPIs below the comparison table.
6. Each chart **shall** show one line per selected country.
7. Each line **shall** be a distinct colour, matching the colour used for that country in the table header.
8. The x-axis of each chart **shall** show years from the start year to the end year.
9. The y-axis **shall** show the KPI value with its unit label.
10. If data is missing for a particular year, the chart line **shall** have a gap at that point rather than interpolating.
11. Each chart **shall** display the KPI name as its title.
12. For World Bank KPIs, data **shall** be fetched live for the specified year range.
13. For static-data KPIs, charts **shall** use only the years available in the embedded dataset; years outside the dataset range **shall** produce a gap.
14. An invalid year range (end year before start year) **shall** display an inline validation message and **must not** render any charts.
15. Charts **shall** be responsive in width to the browser viewport.

### Test Plan

| Step | Expected Result |
|------|----------------|
| Enter From: 2010, To: 2023 with 2 countries selected | 11 line charts appear below the table, each with 2 lines |
| Inspect GDP chart | X-axis shows 2010–2023; each country line has distinct colour; gaps where data missing |
| Enter From: 2023, To: 2010 | Inline error "End year must be after start year"; no charts rendered |
| Clear the "To year" field | Charts disappear; only table shown |
| Select a 3rd country with charts already visible | Charts update to show 3 lines each |
| Inspect CPI chart (static data) | Line shows only years available in the embedded dataset |
| Resize browser window | Charts resize proportionally |
