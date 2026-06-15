const WB_BASE = 'https://api.worldbank.org/v2';

export async function fetchLatest(countryCode, indicatorCode) {
  try {
    const url = `${WB_BASE}/country/${countryCode}/indicator/${indicatorCode}?format=json&mrv=1&gapfill=Y`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const [, data] = await res.json();
    if (!data || data.length === 0) return null;
    const entry = data[0];
    if (entry.value == null) return null;
    return { value: entry.value, year: parseInt(entry.date, 10) };
  } catch {
    return null;
  }
}

export async function fetchRange(countryCode, indicatorCode, fromYear, toYear) {
  try {
    const url = `${WB_BASE}/country/${countryCode}/indicator/${indicatorCode}?format=json&date=${fromYear}:${toYear}&per_page=100`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const [, data] = await res.json();
    if (!data) return [];

    const yearMap = {};
    for (const entry of data) {
      yearMap[parseInt(entry.date, 10)] = entry.value ?? null;
    }

    const result = [];
    for (let y = fromYear; y <= toYear; y++) {
      result.push({ year: y, value: yearMap[y] ?? null });
    }
    return result;
  } catch {
    return [];
  }
}
