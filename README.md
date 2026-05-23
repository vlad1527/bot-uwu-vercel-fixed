# Бот UWU 3.0 — Vercel версия

## Что внутри

- `public/index.html` — сайт.
- `api/health.js` — проверка API-ключа.
- `api/results-scan.js` — скан результатов через API-SPORTS Basketball.
- `api/leagues-search.js` — поиск лиг по API-SPORTS, например IPBL.

## Как запустить на Vercel

1. Создай новый проект на Vercel.
2. Загрузи эту папку в GitHub или импортируй через Vercel CLI.
3. В настройках проекта Vercel открой **Settings → Environment Variables**.
4. Добавь переменную:

```text
API_SPORTS_KEY=твой_ключ
```

5. Нажми **Redeploy**.
6. Открой сайт.

## Локальный запуск

```bash
npm install
API_SPORTS_KEY="твой_ключ" npx vercel dev
```

На Windows PowerShell:

```powershell
npm install
$env:API_SPORTS_KEY="твой_ключ"; npx vercel dev
```

## Важно

Ключ API не должен быть в HTML. Он хранится только на сервере/Vercel Environment Variables.
Если API-SPORTS не содержит IPBL Prime/Pro в твоём тарифе, скан вернёт 0 строк. Тогда нажми кнопку «Проверить IPBL в API».
