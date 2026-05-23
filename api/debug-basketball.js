import { getBasketballMatches } from './_lib.js';

export default async function handler(req, res) {
  try {
    const date = String(req.query.date || new Date().toISOString().slice(0, 10));
    const result = await getBasketballMatches(date);
    res.status(200).json({ ok: true, date, count: result.matches.length, ...result, sample: result.matches.slice(0, 3) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
