const SLOT_COLORS = ['#2563eb', '#16a34a', '#d97706', '#9333ea'];
const chartInstances = {};

export function destroyCharts() {
  for (const id of Object.keys(chartInstances)) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
  document.getElementById('charts-grid').innerHTML = '';
  document.getElementById('charts-container').classList.remove('visible');
}

export function renderCharts(countries, kpiDefs, rangeData, fromYear, toYear) {
  destroyCharts();
  if (countries.length === 0) return;

  const container = document.getElementById('charts-container');
  const grid = document.getElementById('charts-grid');
  container.classList.add('visible');

  const years = [];
  for (let y = fromYear; y <= toYear; y++) years.push(y);

  for (const kpi of kpiDefs) {
    const card = document.createElement('div');
    card.className = 'chart-card';
    card.innerHTML = `<h3>${kpi.label} <span style="font-weight:400;color:#6b7280;font-size:0.75rem;">(${kpi.unit})</span></h3><div class="chart-wrap"><canvas id="chart-${kpi.id}"></canvas></div>`;
    grid.appendChild(card);

    const datasets = countries.map((country, i) => {
      const series = rangeData?.[country.code]?.[kpi.id] || [];
      const dataMap = {};
      for (const pt of series) dataMap[pt.year] = pt.value;
      return {
        label: country.name,
        data: years.map(y => dataMap[y] ?? null),
        borderColor: SLOT_COLORS[i],
        backgroundColor: SLOT_COLORS[i] + '22',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        spanGaps: false,
      };
    });

    const ctx = document.getElementById(`chart-${kpi.id}`).getContext('2d');
    chartInstances[kpi.id] = new Chart(ctx, {
      type: 'line',
      data: { labels: years, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: countries.length > 1,
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const v = ctx.parsed.y;
                return v == null ? `${ctx.dataset.label}: —` : `${ctx.dataset.label}: ${kpi.format(v)}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { font: { size: 11 } },
            grid: { color: '#f3f4f6' },
          },
          y: {
            ticks: {
              font: { size: 11 },
              callback: v => kpi.format(v),
            },
            grid: { color: '#f3f4f6' },
          },
        },
      },
    });
  }
}
