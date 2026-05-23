import { apiSportsGet, containsAny } from './_common.js';

const TARGET_LEAGUES = {
  PRIME: 'Баскетбол. Россия. IPBL. Мужчины. Prime Division. 3x3 (4x12 мин)',
  PRO: 'Баскетбол. Россия. IPBL. Мужчины. Pro Division. 3x3 (4x10 мин)'
};
const PRIME_TEAMS = ['Скорпионс','Биверс','Барракудас','Хаскис','Беарз','Рейвенс','Пираньяс','Октопус'];

function isPrimeLeagueName(name) { return containsAny(name, ['ipbl', 'prime division', 'prime']); }
function isProLeagueName(name) { return containsAny(name, ['ipbl', 'pro division', 'pro']); }
function isPrimeTargetTeam(teamA, teamB) { return PRIME_TEAMS.some((team) => containsAny(`${teamA} ${teamB}`, [team])); }

function getQuarterScore(game, n) {
  const homeScores = game?.scores?.home || {};
  const awayScores = game?.scores?.away || {};
  const home = Number(homeScores[`quarter_${n}`] ?? homeScores[`q${n}`] ?? homeScores[n]);
  const away = Number(awayScores[`quarter_${n}`] ?? awayScores[`q${n}`] ?? awayScores[n]);
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
    rows.push({
      time: game?.date || game?.time || '—',
      league: prime ? TARGET_LEAGUES.PRIME : TARGET_LEAGUES.PRO,
      teamA, teamB, quarter,
      qScore: `${score.home}:${score.away}`,
      qTotal: score.total,
      target: prime ? 'ТБ55' : 'ТБ38.5',
      odds: 1.75,
      passed: score.total > targetLine,
      sourceUrl: 'https://dashboard.api-football.com/',
      apiSource: 'API-SPORTS Basketball'
    });
  }
  return rows;
}

export default async function handler(req, res) {
  try {
    const date = String(req.query.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ ok: false, error: 'Передайте дату в формате YYYY-MM-DD.' });
    }
    const games = await apiSportsGet('/games', { date });
    const results = games.flatMap(gameToRows);
    res.status(200).json({
      ok: true,
      date,
      source: 'API-SPORTS Basketball',
      count: results.length,
      results,
      note: results.length ? 'Найдены подходящие строки.' : 'API ответил, но подходящих IPBL Prime/Pro матчей по этой дате не найдено. Проверь /api/leagues-search?q=ipbl.'
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
