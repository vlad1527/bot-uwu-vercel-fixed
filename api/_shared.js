const API_SPORTS_BASE = 'https://v1.basketball.api-sports.io';

const TARGET_LEAGUES = {
  PRIME: 'Баскетбол. Россия. IPBL. Мужчины. Prime Division. 3x3 (4x12 мин)',
  PRO: 'Баскетбол. Россия. IPBL. Мужчины. Pro Division. 3x3 (4x10 мин)',
};

const PRIME_TEAMS = [
  'Скорпионс',
  'Биверс',
  'Барракудас',
  'Хаскис',
  'Беарз',
  'Рейвенс',
  'Пираньяс',
  'Октопус',
];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9. ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsAny(text, variants) {
  const normalized = normalizeText(text);
  return variants.some((variant) => normalized.includes(normalizeText(variant)));
}

function isPrimeLeagueName(name) {
  const n = normalizeText(name);
  return n.includes('ipbl') && (n.includes('prime') || n.includes('prime division'));
}

function isProLeagueName(name) {
  const n = normalizeText(name);
  return n.includes('ipbl') && (n.includes('pro') || n.includes('pro division'));
}

function isPrimeTargetTeam(teamA, teamB) {
  const joined = `${teamA} ${teamB}`;
  return PRIME_TEAMS.some((team) => containsAny(joined, [team]));
}

function clampOdds(value) {
  const odds = Number(value || 1.75);
  if (!Number.isFinite(odds)) return 1.75;
  return Math.min(2, Math.max(1.75, odds));
}

async function apiSportsGet(path, params = {}) {
  const apiKey = process.env.API_SPORTS_KEY;
  if (!apiKey) {
    const err = new Error('API_SPORTS_KEY не задан в Vercel Environment Variables.');
    err.statusCode = 500;
    throw err;
  }

  const url = new URL(`${API_SPORTS_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-apisports-key': apiKey,
    },
  });

  if (!response.ok) {
    const err = new Error(`API-SPORTS error: ${response.status} ${response.statusText}`);
    err.statusCode = response.status;
    throw err;
  }

  const data = await response.json();
  if (data.errors && Object.keys(data.errors).length) {
    const err = new Error(`API-SPORTS response error: ${JSON.stringify(data.errors)}`);
    err.statusCode = 502;
    throw err;
  }

  return data.response || [];
}

function getQuarterScore(game, quarterNumber) {
  const homeScores = game?.scores?.home || {};
  const awayScores = game?.scores?.away || {};

  const home = Number(
    homeScores[`quarter_${quarterNumber}`] ??
    homeScores[`q${quarterNumber}`] ??
    homeScores[quarterNumber]
  );

  const away = Number(
    awayScores[`quarter_${quarterNumber}`] ??
    awayScores[`q${quarterNumber}`] ??
    awayScores[quarterNumber]
  );

  if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
  return { home, away, total: home + away };
}

function gameToRows(game) {
  const leagueName = game?.league?.name || '';
  const country = game?.country?.name || game?.country || '';
  const fullLeague = `${country} ${leagueName}`;
  const teamA = game?.teams?.home?.name || game?.home?.name || '';
  const teamB = game?.teams?.away?.name || game?.away?.name || '';

  const prime = isPrimeLeagueName(fullLeague);
  const pro = isProLeagueName(fullLeague);

  if (!prime && !pro) return [];
  if (prime && !isPrimeTargetTeam(teamA, teamB)) return [];

  const rows = [];
  for (let quarter = 1; quarter <= 3; quarter += 1) {
    const score = getQuarterScore(game, quarter);
    if (!score) continue;

    const targetLine = prime ? 55 : 38.5;
    const qTotal = score.total;

    rows.push({
      time: game?.date || game?.time || '—',
      league: prime ? TARGET_LEAGUES.PRIME : TARGET_LEAGUES.PRO,
      teamA,
      teamB,
      quarter,
      qScore: `${score.home}:${score.away}`,
      qTotal,
      target: prime ? 'ТБ55' : 'ТБ38.5',
      odds: 1.75,
      passed: qTotal > targetLine,
      sourceUrl: 'https://betcity.ru/',
      apiSource: 'API-SPORTS Basketball',
    });
  }

  return rows;
}

module.exports = {
  apiSportsGet,
  gameToRows,
  clampOdds,
  isPrimeTargetTeam,
};
