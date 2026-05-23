const API_BASE = 'https://api.api-sport.ru/v2';

export const TARGET_LEAGUES = {
  PRIME: 'Баскетбол. Россия. IPBL. Мужчины. Prime Division. 3x3 (4x12 мин)',
  PRO: 'Баскетбол. Россия. IPBL. Мужчины. Pro Division. 3x3 (4x10 мин)',
};

export const PRIME_TEAMS = ['Скорпионс','Биверс','Барракудас','Хаскис','Беарз','Рейвенс','Пираньяс','Октопус'];

export function getApiKey() {
  return process.env.API_SPORT_KEY || process.env.API_SPORT_RU_KEY || process.env.API_SPORTS_KEY || '';
}

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9. ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function containsAny(text, variants) {
  const normalized = normalizeText(text);
  return variants.some((variant) => normalized.includes(normalizeText(variant)));
}

export function pick(obj, paths, fallback = undefined) {
  for (const path of paths) {
    const value = path.split('.').reduce((acc, key) => acc && acc[key], obj);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function numberOrNaN(value) {
  if (value === undefined || value === null || value === '') return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function parseScoreText(scoreText) {
  const m = String(scoreText || '').match(/(\d+)\s*[:\-]\s*(\d+)/);
  return m ? { home: Number(m[1]), away: Number(m[2]) } : null;
}

export function getLeagueName(match) {
  return [
    match?.league?.name,
    match?.tournament?.name,
    match?.competition?.name,
    match?.leagueName,
    match?.tournamentName,
    match?.competitionName,
    match?.name,
  ].filter(Boolean).join(' ');
}

export function isPrimeLeague(name) {
  const n = normalizeText(name);
  return n.includes('ipbl') && (n.includes('prime') || n.includes('prime division'));
}

export function isProLeague(name) {
  const n = normalizeText(name);
  return n.includes('ipbl') && (n.includes('pro') || n.includes('pro division'));
}

export function isPrimeTargetTeam(teamA, teamB) {
  const joined = `${teamA} ${teamB}`;
  return PRIME_TEAMS.some((team) => containsAny(joined, [team]));
}

export function getTeams(match) {
  return {
    teamA: String(pick(match, ['homeTeam.name','home.name','teams.home.name','teamHome.name','homeTeam','team1.name','participants.0.name','competitors.0.name'], '—')),
    teamB: String(pick(match, ['awayTeam.name','away.name','teams.away.name','teamAway.name','awayTeam','team2.name','participants.1.name','competitors.1.name'], '—')),
  };
}

export function extractQuarterScores(match) {
  const candidates = [
    pick(match, ['quarters'], null),
    pick(match, ['periods'], null),
    pick(match, ['score.periods'], null),
    pick(match, ['scores.periods'], null),
    pick(match, ['periodScores'], null),
  ].filter(Array.isArray);

  for (const arr of candidates) {
    const parsed = arr.map((p, i) => {
      const quarter = numberOrNaN(pick(p, ['quarter','number','period','periodNumber'], i + 1));
      let home = numberOrNaN(pick(p, ['home','homeScore','scoreHome','team1','home_points'], NaN));
      let away = numberOrNaN(pick(p, ['away','awayScore','scoreAway','team2','away_points'], NaN));

      if (!Number.isFinite(home) || !Number.isFinite(away)) {
        const t = parseScoreText(pick(p, ['score','periodScore','result'], ''));
        if (t) { home = t.home; away = t.away; }
      }
      return { quarter, home, away };
    }).filter((q) => [1,2,3].includes(q.quarter) && Number.isFinite(q.home) && Number.isFinite(q.away));

    if (parsed.length) return parsed;
  }

  return [1,2,3].map((quarter) => {
    let home = numberOrNaN(pick(match, [`q${quarter}Home`,`quarter${quarter}Home`,`period${quarter}.home`,`score.q${quarter}.home`,`scores.home.q${quarter}`,`home.q${quarter}`], NaN));
    let away = numberOrNaN(pick(match, [`q${quarter}Away`,`quarter${quarter}Away`,`period${quarter}.away`,`score.q${quarter}.away`,`scores.away.q${quarter}`,`away.q${quarter}`], NaN));
    if (!Number.isFinite(home) || !Number.isFinite(away)) {
      const t = parseScoreText(pick(match, [`q${quarter}`,`quarter${quarter}`,`period${quarter}`], ''));
      if (t) { home = t.home; away = t.away; }
    }
    return { quarter, home, away };
  }).filter((q) => Number.isFinite(q.home) && Number.isFinite(q.away));
}

export function normalizeMatchToRows(match) {
  const leagueName = getLeagueName(match);
  const prime = isPrimeLeague(leagueName);
  const pro = isProLeague(leagueName);
  if (!prime && !pro) return [];

  const { teamA, teamB } = getTeams(match);
  if (prime && !isPrimeTargetTeam(teamA, teamB)) return [];

  const sourceUrl = pick(match, ['sourceUrl','url','link'], 'https://api.api-sport.ru/v2/docs/');
  const time = pick(match, ['time','startTime','date','dateTime','matchTime'], '—');
  const rawOdds = Number(pick(match, ['odds','coefficient','price'], 1.75));
  const odds = Math.min(2, Math.max(1.75, Number.isFinite(rawOdds) ? rawOdds : 1.75));

  return extractQuarterScores(match).map((q) => {
    const qTotal = q.home + q.away;
    const targetLine = prime ? 55 : 38.5;
    return {
      time,
      league: prime ? TARGET_LEAGUES.PRIME : TARGET_LEAGUES.PRO,
      teamA,
      teamB,
      quarter: q.quarter,
      qScore: `${q.home}:${q.away}`,
      qTotal,
      target: prime ? 'ТБ55' : 'ТБ38.5',
      odds,
      passed: qTotal > targetLine,
      sourceUrl,
      apiSource: 'api-sport.ru',
    };
  });
}

async function fetchWithAuthVariants(url, key) {
  const variants = [
    { Authorization: `Bearer ${key}` },
    { Authorization: key },
    { 'X-API-Key': key },
    { 'x-api-key': key },
    { token: key },
  ];

  let last = null;
  for (const authHeaders of variants) {
    const response = await fetch(url, { headers: { Accept: 'application/json', ...authHeaders } });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (response.ok) return { data, authTried: Object.keys(authHeaders)[0] };
    last = { response, data };
    if (![401, 403].includes(response.status)) break;
  }

  const message = last?.data?.message || last?.data?.error || JSON.stringify(last?.data || {}).slice(0, 300);
  throw new Error(`api-sport.ru error: ${last?.response?.status} ${last?.response?.statusText}. ${message}`);
}

export async function apiSportGet(path, params = {}) {
  const key = getApiKey();
  if (!key) throw new Error('API key не задан. В Vercel Environment Variables добавь API_SPORT_KEY или API_SPORT_RU_KEY.');

  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }

  return fetchWithAuthVariants(url.toString(), key);
}

export function extractMatches(data) {
  if (Array.isArray(data)) return data;
  return data.matches || data.events || data.games || data.data || data.response || data.items || [];
}

export async function getBasketballMatches(date) {
  const attempts = [
    ['/basketball/matches', { date }],
    ['/basketball/matches', { date, status: 'finished' }],
    ['/basketball/matches', { date, status: 'completed' }],
  ];

  let lastError = null;
  for (const [path, params] of attempts) {
    try {
      const { data, authTried } = await apiSportGet(path, params);
      const matches = extractMatches(data);
      return { matches, rawShape: Object.keys(data || {}), path, params, authTried };
    } catch (error) {
      lastError = error;
      if (!String(error.message).includes('404')) throw error;
    }
  }
  throw lastError || new Error('Не удалось получить basketball matches');
}
