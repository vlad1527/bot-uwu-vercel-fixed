import { getBasketballMatches, normalizeMatchToRows } from './_lib.js';

export default async function handler(req, res) {
  try {
    const date = String(req.query.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ ok: false, error: 'Передайте дату в формате YYYY-MM-DD' });
    }

    const { matches, path, params, rawShape, authTried } = await getBasketballMatches(date);
    const results = matches.flatMap(normalizeMatchToRows);

    res.status(200).json({
      ok: true,
      date,
      source: 'api-sport.ru',
      providerEndpoint: path,
      providerParams: params,
      rawShape,
      authTried,
      totalMatchesFromApi: matches.length,
      count: results.length,
      results,
      note: results.length
        ? 'Найдены подходящие строки по IPBL Prime/Pro.'
        : `API ответил, но подходящих IPBL Prime/Pro строк с четвертями не найдено. Проверь /api/debug-basketball?date=${date}`,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
