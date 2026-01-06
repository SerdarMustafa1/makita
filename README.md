# Makita discounts monitor

Lightweight Node.js + Playwright monitoring bot that scans several Estonian e-stores for Makita discounts and posts Telegram alerts.

Setup

1. Install dependencies:

```bash
npm install
# Playwright browsers (optional interactive):
npx playwright install --with-deps
```

2. Create `.env` in project root with:

```
TELEGRAM_BOT_TOKEN=123:ABC
TELEGRAM_CHAT_ID=987654321
```

3. Initialize DB schema:

```bash
npm run setup
```

Run

```bash
npm run run
```

Cron examples

# Run every 30 minutes
*/30 * * * * cd /path/to/makita && /usr/bin/env node src/run.js >> /path/to/makita/logs/cron.log 2>&1

# Run hourly
0 * * * * cd /path/to/makita && /usr/bin/env node src/run.js >> /path/to/makita/logs/cron.log 2>&1

Notes

- DB: `data/makita.db` (SQLite, WAL)
- Logs: `logs/runs.log` (one JSON line per run)
- Sources are in `src/config/sources.json`.
- Add more URLs per store to `sources.json` (prefer brand or campaign pages).
# makita
