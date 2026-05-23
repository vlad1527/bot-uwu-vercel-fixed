import { apiSportGet, getApiKey } from './_lib.js';

export default async function handler(req, res) {
  try {
    let apiCheckOk = false;
    let apiError = null;
    let authTried = null;

    if (getApiKey()) {
      try {
        const result = await apiSportGet('/sport');
        apiCheckOk = true;
        authTried = result.authTried;
      } catch (error) {
        apiError = error.message;
      }
    }

    res.status(200).json({
      ok: true,
      server: 'Bot UWU 3.0 api-sport.ru',
      provider: 'api-sport.ru',
      resultsFeedConnected: Boolean(getApiKey()),
      apiCheckOk,
      apiError,
      authTried,
      envNamesAccepted: ['API_SPORT_KEY', 'API_SPORT_RU_KEY', 'API_SPORTS_KEY'],
      endpoints: ['/api/results-scan?date=YYYY-MM-DD', '/api/leagues-search?q=ipbl', '/api/debug-basketball?date=YYYY-MM-DD'],
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
