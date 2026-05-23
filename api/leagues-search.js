import { apiSportGet } from './_lib.js';

export default async function handler(req, res) {
  try {
    const q = String(req.query.q || 'ipbl').trim();
    const { data, authTried } = await apiSportGet('/basketball/matches', { search: q });
    const items = Array.isArray(data) ? data : data.matches || data.events || data.data || data.response || [];
    res.status(200).json({ ok: true, query: q, count: items.length, authTried, leagues: items.slice(0, 50) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
