export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    server: 'Bot UWU 3.0 Vercel',
    provider: 'API-SPORTS Basketball',
    resultsFeedConnected: Boolean(process.env.API_SPORTS_KEY),
    endpoints: ['/api/results-scan?date=YYYY-MM-DD', '/api/leagues-search?q=ipbl']
  });
}
