export const API_SPORTS_BASE = 'https://v1.basketball.api-sports.io';

export function normalizeText(value) {
  return String(value || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9. ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function containsAny(text, variants) {
  const normalized = normalizeText(text);
  return variants.some((variant) => normalized.includes(normalizeText(variant)));
}

export async function apiSportsGet(path, params = {}) {
  const key = process.env.API_SPORTS_KEY;
  if (!key) throw new Error('API_SPORTS_KEY не задан в Vercel Environment Variables.');
  const url = new URL(`${API_SPORTS_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  const response = await fetch(url.toString(), { headers: { 'x-apisports-key': key } });
  if (!response.ok) throw new Error(`API-SPORTS error: ${response.status} ${response.statusText}`);
  const data = await response.json();
  if (data.errors && Object.keys(data.errors).length) throw new Error(`API-SPORTS response error: ${JSON.stringify(data.errors)}`);
  return data.response || [];
}
