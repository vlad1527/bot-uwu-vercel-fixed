const { apiSportsGet, gameToRows } = require('./_shared');

async function scanResultsFromApiSports(date) {
  const games = await apiSportsGet('/games', { date });
  return games.flatMap(gameToRows);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const date = String(req.query.date || '').trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        ok: false,
        error: 'Передайте дату в формате YYYY-MM-DD: /api/results-scan?date=2026-05-23',
      });
    }

    const results = await scanResultsFromApiSports(date);

    res.status(200).json({
      ok: true,
      date,
      source: 'API-SPORTS Basketball',
      count: results.length,
      results,
      note: results.length
        ? 'Найдены подходящие строки по лигам/командам.'
        : 'API ответил, но подходящих IPBL Prime/Pro матчей по этой дате не найдено. Проверьте /api/leagues-search?q=ipbl.',
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, error: error.message });
  }
};
