import { CATEGORIES } from './kpi.js';

const SLOT_COLORS = ['#2563eb', '#16a34a', '#d97706', '#9333ea'];

export function showTableLoading(countries, kpiDefs) {
  const container = document.getElementById('table-container');
  if (countries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🌍</div>
        <p>Select at least one country above to see the wellness comparison.</p>
      </div>`;
    return;
  }
  const colCount = countries.length + 1;
  let html = `<table class="kpi-table"><thead><tr>
    <th>Indicator</th>
    ${countries.map((c, i) => `<th class="country-th" data-slot="${i}">${c.name}</th>`).join('')}
  </tr></thead><tbody>`;

  for (const cat of CATEGORIES) {
    html += `<tr class="category-row"><td colspan="${colCount}">${cat}</td></tr>`;
    for (const kpi of kpiDefs.filter(k => k.category === cat)) {
      html += `<tr><td class="kpi-label">${kpi.label}</td>`;
      for (let i = 0; i < countries.length; i++) {
        html += `<td><span class="loading-cell"></span></td>`;
      }
      html += `</tr>`;
    }
  }
  html += `</tbody></table>`;
  container.innerHTML = html;
}

export function renderTable(countries, kpiDefs, latestData) {
  const container = document.getElementById('table-container');
  if (countries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🌍</div>
        <p>Select at least one country above to see the wellness comparison.</p>
      </div>`;
    return;
  }
  const colCount = countries.length + 1;
  let html = `<table class="kpi-table"><thead><tr>
    <th>Indicator</th>
    ${countries.map((c, i) => `<th class="country-th" data-slot="${i}">${c.name}</th>`).join('')}
  </tr></thead><tbody>`;

  for (const cat of CATEGORIES) {
    html += `<tr class="category-row"><td colspan="${colCount}">${cat}</td></tr>`;
    for (const kpi of kpiDefs.filter(k => k.category === cat)) {
      html += `<tr><td class="kpi-label">${kpi.label}</td>`;
      for (const country of countries) {
        const dp = latestData?.[country.code]?.[kpi.id];
        if (!dp || dp.value == null) {
          html += `<td class="empty-cell">—</td>`;
        } else {
          const formatted = kpi.format(dp.value);
          const polarity = kpi.polarity ? `<span class="kpi-polarity">${kpi.polarity}</span>` : '';
          const yearNote = `<span class="kpi-year">${dp.year}</span>`;
          html += `<td class="kpi-value">${formatted}${polarity}${yearNote}</td>`;
        }
      }
      html += `</tr>`;
    }
  }
  html += `</tbody></table>`;
  container.innerHTML = html;
}
