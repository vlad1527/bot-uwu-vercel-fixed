import { apiSportsGet } from './_common.js';

export default async function handler(req, res) {
  try {
    const q = String(req.query.q || 'ipbl').trim();
    const leagues = await apiSportsGet('/leagues', { search: q });
    res.status(200).json({ ok: true, query: q, count: leagues.length, leagues });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
