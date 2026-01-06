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

GitHub Actions (scheduled)

You can host the scheduled job for free via GitHub Actions. I added a workflow at `.github/workflows/schedule.yml` that runs `npm run run` on a cron schedule (every 8 hours by default, ~3×/day).

Required repository secrets

- `TELEGRAM_BOT_TOKEN` — your Telegram bot token (if you use Telegram notifications)
- `TELEGRAM_CHAT_ID` — target chat id for alerts
- Any other environment variables you keep in `.env` should be added under Settings → Secrets and variables → Actions.

To change the schedule

- Edit `.github/workflows/schedule.yml` and adjust the `cron` entry. Examples:
	- 3×/day (every 8 hours): `0 */8 * * *`
	- 2×/day (every 12 hours): `0 */12 * * *`
	- Twice daily at 02:00 and 14:00: `0 2,14 * * *`

Notes

- The workflow installs Node and project dependencies, then runs `npx playwright install --with-deps` to ensure Playwright browsers are available. If you don't use Playwright in scheduled runs, you can remove that step to speed up jobs.
- After pushing these changes, the workflow will run according to the schedule. Confirm Secrets are set in the repository settings so the job can access needed credentials.

Notes

- DB: `data/makita.db` (SQLite, WAL)
- Logs: `logs/runs.log` (one JSON line per run)
- Sources are in `src/config/sources.json`.
- Add more URLs per store to `sources.json` (prefer brand or campaign pages).
# makita
