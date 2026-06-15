import { filterCountries } from './countries.js';
import { KPI_DEFINITIONS } from './kpi.js';
import { fetchLatest, fetchRange } from './worldbank.js';
import { getLatestStatic, getRangeStatic } from './staticData.js';
import { renderTable, showTableLoading } from './table.js';
import { renderCharts, destroyCharts } from './charts.js';

const SLOT_COUNT = 4;
const selectors = [];
let loadDataTimer = null;

// ── CountrySelector ─────────────────────────────────────────────────────────

class CountrySelector {
  constructor(slotIndex, containerEl) {
    this.slotIndex = slotIndex;
    this.selected = null;

    containerEl.dataset.slot = slotIndex;
    containerEl.innerHTML = `
      <label>Country ${slotIndex + 1}</label>
      <div class="selector-input-wrap">
        <input type="text" class="selector-input" placeholder="Type to search…" autocomplete="off" />
        <button class="clear-btn" title="Clear">&times;</button>
      </div>
      <div class="slot-color-bar"></div>
      <div class="dropdown"></div>`;

    this.input    = containerEl.querySelector('.selector-input');
    this.clearBtn = containerEl.querySelector('.clear-btn');
    this.colorBar = containerEl.querySelector('.slot-color-bar');
    this.dropdown = containerEl.querySelector('.dropdown');

    this.input.addEventListener('input', () => this._onInput());
    this.input.addEventListener('keydown', e => { if (e.key === 'Escape') this._closeDropdown(); });
    this.clearBtn.addEventListener('click', () => this.reset());

    document.addEventListener('click', e => {
      if (!containerEl.contains(e.target)) this._closeDropdown();
    });
  }

  getSelected() { return this.selected; }

  reset() {
    this.selected = null;
    this.input.value = '';
    this.input.classList.remove('has-value');
    this.clearBtn.classList.remove('visible');
    this.colorBar.classList.remove('active');
    this._closeDropdown();
    this._emit();
  }

  _getExcluded() {
    return selectors
      .filter((s, i) => i !== this.slotIndex && s.selected)
      .map(s => s.selected.code);
  }

  _onInput() {
    const q = this.input.value;
    if (this.selected) {
      this.selected = null;
      this.input.classList.remove('has-value');
      this.clearBtn.classList.remove('visible');
      this.colorBar.classList.remove('active');
      this._emit();
    }
    const matches = filterCountries(q, this._getExcluded());
    this._renderDropdown(matches, q);
  }

  _renderDropdown(matches, query) {
    if (!query || query.length < 3) {
      this._closeDropdown();
      return;
    }
    this.dropdown.innerHTML = matches.length === 0
      ? `<div class="dropdown-empty">No results for "${query}"</div>`
      : matches.map(c => `<div class="dropdown-item" data-code="${c.code}">${c.name}</div>`).join('');

    this.dropdown.querySelectorAll('.dropdown-item').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        this._select({ code: el.dataset.code, name: el.textContent });
      });
    });
    this.dropdown.classList.add('open');
  }

  _select(country) {
    this.selected = country;
    this.input.value = country.name;
    this.input.classList.add('has-value');
    this.clearBtn.classList.add('visible');
    this.colorBar.classList.add('active');
    this._closeDropdown();
    this._emit();
  }

  _closeDropdown() {
    this.dropdown.classList.remove('open');
    this.dropdown.innerHTML = '';
  }

  _emit() {
    document.dispatchEvent(new CustomEvent('countrychange'));
  }
}

// ── Sources table ────────────────────────────────────────────────────────────

function renderSources() {
  const tbody = document.getElementById('sources-tbody');
  tbody.innerHTML = KPI_DEFINITIONS.map(kpi => `
    <tr>
      <td>${kpi.label}</td>
      <td><span class="cat-badge">${kpi.category}</span></td>
      <td>${kpi.source.name}</td>
      <td><a href="${kpi.source.url}" target="_blank" rel="noopener noreferrer">${kpi.source.url}</a></td>
    </tr>`).join('');
}

// ── Year range validation ────────────────────────────────────────────────────

function validateYearRange(from, to) {
  if (from === '' || to === '') return { valid: false, reason: null };
  const f = parseInt(from, 10);
  const t = parseInt(to, 10);
  if (isNaN(f) || isNaN(t))       return { valid: false, reason: 'Years must be numbers.' };
  if (f < 1960)                    return { valid: false, reason: 'Start year must be 1960 or later.' };
  if (t > new Date().getFullYear()) return { valid: false, reason: 'End year cannot be in the future.' };
  if (t < f)                       return { valid: false, reason: 'End year must be after start year.' };
  return { valid: true, from: f, to: t };
}

// ── Main data load ───────────────────────────────────────────────────────────

async function loadData() {
  const countries = selectors.map(s => s.getSelected()).filter(Boolean);
  const fromVal = document.getElementById('from-year').value.trim();
  const toVal   = document.getElementById('to-year').value.trim();
  const yearResult = validateYearRange(fromVal, toVal);

  // Show loading state
  showTableLoading(countries, KPI_DEFINITIONS);
  destroyCharts();

  if (countries.length === 0) return;

  // Fetch latest values for table
  const latestJobs = [];
  const latestKeys = [];

  for (const country of countries) {
    for (const kpi of KPI_DEFINITIONS) {
      latestKeys.push({ countryCode: country.code, kpiId: kpi.id });
      if (kpi.wbIndicator) {
        latestJobs.push(fetchLatest(country.code, kpi.wbIndicator));
      } else {
        latestJobs.push(Promise.resolve(getLatestStatic(kpi.id, country.code)));
      }
    }
  }

  const latestResults = await Promise.allSettled(latestJobs);
  const latestData = {};

  latestResults.forEach((result, idx) => {
    const { countryCode, kpiId } = latestKeys[idx];
    if (!latestData[countryCode]) latestData[countryCode] = {};
    latestData[countryCode][kpiId] = result.status === 'fulfilled' ? result.value : null;
  });

  renderTable(countries, KPI_DEFINITIONS, latestData);

  // Fetch range data if year range is valid
  if (!yearResult.valid) return;

  const { from, to } = yearResult;
  const rangeJobs = [];
  const rangeKeys = [];

  for (const country of countries) {
    for (const kpi of KPI_DEFINITIONS) {
      rangeKeys.push({ countryCode: country.code, kpiId: kpi.id });
      if (kpi.wbIndicator) {
        rangeJobs.push(fetchRange(country.code, kpi.wbIndicator, from, to));
      } else {
        rangeJobs.push(Promise.resolve(getRangeStatic(kpi.id, country.code, from, to)));
      }
    }
  }

  const rangeResults = await Promise.allSettled(rangeJobs);
  const rangeData = {};

  rangeResults.forEach((result, idx) => {
    const { countryCode, kpiId } = rangeKeys[idx];
    if (!rangeData[countryCode]) rangeData[countryCode] = {};
    rangeData[countryCode][kpiId] = result.status === 'fulfilled' ? (result.value || []) : [];
  });

  renderCharts(countries, KPI_DEFINITIONS, rangeData, from, to);
}

// Debounce so rapid year-input changes don't fire dozens of fetches
function scheduleLoad() {
  clearTimeout(loadDataTimer);
  loadDataTimer = setTimeout(loadData, 300);
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const row = document.getElementById('selectors-row');
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slot = document.createElement('div');
    slot.className = 'selector-slot';
    row.appendChild(slot);
    selectors.push(new CountrySelector(i, slot));
  }

  document.addEventListener('countrychange', scheduleLoad);

  const fromInput = document.getElementById('from-year');
  const toInput   = document.getElementById('to-year');
  const yearError = document.getElementById('year-error');
  const yearHint  = document.getElementById('year-hint');

  function onYearChange() {
    const from = fromInput.value.trim();
    const to   = toInput.value.trim();
    if (from === '' && to === '') {
      yearError.textContent = '';
      yearError.classList.remove('visible');
      yearHint.style.display = '';
    } else {
      const result = validateYearRange(from, to);
      if (!result.valid && result.reason) {
        yearError.textContent = result.reason;
        yearError.classList.add('visible');
        yearHint.style.display = 'none';
      } else {
        yearError.textContent = '';
        yearError.classList.remove('visible');
        yearHint.style.display = 'none';
      }
    }
    scheduleLoad();
  }

  fromInput.addEventListener('input', onYearChange);
  toInput.addEventListener('input', onYearChange);

  renderSources();
  showTableLoading([], KPI_DEFINITIONS);
});
