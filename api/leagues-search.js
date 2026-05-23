const { apiSportsGet } = require('./_shared');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const q = String(req.query.q || 'ipbl').trim();
    const leagues = await apiSportsGet('/leagues', { search: q });
    res.status(200).json({ ok: true, query: q, count: leagues.length, leagues });
  } catch (error) {
    res.status(error.statusCode || 500).json({ ok: false, error: error.message });
  }
};
