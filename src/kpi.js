function fmtGDP(v) {
  if (v == null) return '—';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  return `$${(v / 1e6).toFixed(0)}M`;
}

function fmtCurrency(v) {
  if (v == null) return '—';
  return '$' + Math.round(v).toLocaleString('en-US');
}

function fmtOneDP(v) {
  if (v == null) return '—';
  return parseFloat(v).toFixed(1);
}

function fmtThreeDP(v) {
  if (v == null) return '—';
  return parseFloat(v).toFixed(3);
}

function fmtTwoDP(v) {
  if (v == null) return '—';
  return parseFloat(v).toFixed(2);
}

function fmtPct(v) {
  if (v == null) return '—';
  return parseFloat(v).toFixed(1) + '%';
}

function fmtCPI(v) {
  if (v == null) return '—';
  return `${Math.round(v)} / 100`;
}

function fmtLifeExp(v) {
  if (v == null) return '—';
  return parseFloat(v).toFixed(1) + ' yrs';
}

export const KPI_DEFINITIONS = [
  {
    id: 'gdp',
    label: 'GDP',
    category: 'Economic',
    unit: 'Current USD',
    wbIndicator: 'NY.GDP.MKTP.CD',
    format: fmtGDP,
    polarity: null,
    source: {
      name: 'The World Bank',
      url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD',
    },
  },
  {
    id: 'gdppc',
    label: 'GDP per Capita',
    category: 'Economic',
    unit: 'Current USD',
    wbIndicator: 'NY.GDP.PCAP.CD',
    format: fmtCurrency,
    polarity: null,
    source: {
      name: 'The World Bank',
      url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD',
    },
  },
  {
    id: 'ppp',
    label: 'GDP, PPP',
    category: 'Economic',
    unit: 'Current intl $',
    wbIndicator: 'NY.GDP.MKTP.PP.CD',
    format: fmtGDP,
    polarity: null,
    source: {
      name: 'World Bank / ICP',
      url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.PP.CD',
    },
  },
  {
    id: 'gini',
    label: 'Gini Coefficient',
    category: 'Economic',
    unit: 'Index (0–100)',
    wbIndicator: 'SI.POV.GINI',
    format: fmtOneDP,
    polarity: 'Lower = more equal',
    source: {
      name: 'The World Bank',
      url: 'https://data.worldbank.org/indicator/SI.POV.GINI',
    },
  },
  {
    id: 'hdi',
    label: 'Human Development Index',
    category: 'Social & Human Development',
    unit: 'Score (0–1)',
    wbIndicator: null,
    format: fmtThreeDP,
    polarity: 'Higher = more developed',
    source: {
      name: 'UNDP',
      url: 'https://hdr.undp.org/data-center',
    },
  },
  {
    id: 'lifeexp',
    label: 'Life Expectancy at Birth',
    category: 'Social & Human Development',
    unit: 'Years',
    wbIndicator: 'SP.DYN.LE00.IN',
    format: fmtLifeExp,
    polarity: null,
    source: {
      name: 'The World Bank / UN Population Division',
      url: 'https://data.worldbank.org/indicator/SP.DYN.LE00.IN',
    },
  },
  {
    id: 'literacy',
    label: 'Literacy Rate (Adults)',
    category: 'Social & Human Development',
    unit: '% age 15+',
    wbIndicator: null,
    format: fmtPct,
    polarity: null,
    source: {
      name: 'UNESCO Institute for Statistics',
      url: 'http://uis.unesco.org/',
    },
  },
  {
    id: 'cpi',
    label: 'Corruption Perceptions Index',
    category: 'Governance & Stability',
    unit: 'Score (0–100)',
    wbIndicator: null,
    format: fmtCPI,
    polarity: 'Higher = less corrupt',
    source: {
      name: 'Transparency International',
      url: 'https://www.transparency.org/en/cpi',
    },
  },
  {
    id: 'gpi',
    label: 'Global Peace Index',
    category: 'Governance & Stability',
    unit: 'Score (1–5)',
    wbIndicator: null,
    format: fmtTwoDP,
    polarity: 'Lower = more peaceful',
    source: {
      name: 'Institute for Economics and Peace',
      url: 'https://www.visionofhumanity.org/',
    },
  },
  {
    id: 'epi',
    label: 'Environmental Performance Index',
    category: 'Environmental & Wellbeing',
    unit: 'Score (0–100)',
    wbIndicator: null,
    format: fmtOneDP,
    polarity: 'Higher = better performance',
    source: {
      name: 'Yale University / Columbia University',
      url: 'https://epi.yale.edu/',
    },
  },
  {
    id: 'happiness',
    label: 'World Happiness Score',
    category: 'Environmental & Wellbeing',
    unit: 'Score (0–10)',
    wbIndicator: null,
    format: fmtTwoDP,
    polarity: 'Higher = happier',
    source: {
      name: 'Sustainable Development Solutions Network',
      url: 'https://worldhappiness.report/',
    },
  },
];

export const CATEGORIES = [
  'Economic',
  'Social & Human Development',
  'Governance & Stability',
  'Environmental & Wellbeing',
];
