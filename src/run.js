import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import db from './core/db.js';
import notifier from './core/notifier.js';
const sources = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'config', 'sources.json'), 'utf8'));
import * as util from './core/util.js';
import { detectDiscountFromCard } from './core/rules.js';

dotenv.config();

const ROOT = path.resolve('.');
const LOG_DIR = path.join(ROOT, 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const RUNS_LOG = path.join(LOG_DIR, 'runs.log');

const ADAPTERS = {};

const RETENTION_DAYS = 183;

async function runOnce() {
  // initialize notifier (validate token/chat)
  try { await notifier.init(); } catch(e){ console.warn('notifier init error', e.message); }
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const summary = { timestamp: Date.now(), stores: [], scanned: 0, alerts: 0 };
  const storeStats = {};

  for (const [store, urls] of Object.entries(sources)) {
    summary.stores.push(store);
    storeStats[store] = { scanned: 0, discounted: 0 };
    if (!ADAPTERS[store]) {
      try {
        ADAPTERS[store] = (await import(`./adapters/${store}.js`)).default;
      } catch (e) {
        // try alternative file name mapping
        const mapping = { 'k-rauta': 'krRauta', 'tooriistamaailm': 'tooriistamaailm' };
        const alt = mapping[store] || store;
        try { ADAPTERS[store] = (await import(`./adapters/${alt}.js`)).default; } catch (e2) { ADAPTERS[store]=null; }
      }
    }
    const adapter = ADAPTERS[store];
    if (!adapter) { console.warn('No adapter for', store); continue; }
    for (const url of urls) {
      try {
        // small delay between stores
        await page.waitForTimeout(1000 + Math.random()*800);
        const items = await adapter(page, url);
        summary.scanned += items.length;

        for (const it of items) {
          storeStats[store].scanned += 1;
          const now = Math.floor(Date.now()/1000);
          const obs = {
            product_id: it.product_id,
            store: it.store,
            name: it.name,
            url: it.url,
            now_price: it.now_price,
            was_price: it.was_price,
            discount_pct: it.discount_pct,
            in_stock: it.in_stock,
            scraped_at: it.scraped_at || now
          };
          db.insertObservation(obs);

          const prev = db.getLatest(it.product_id);
          const rules = detectDiscountFromCard({ raw: it.raw, now_price: it.now_price, was_price: it.was_price, discount_pct: it.discount_pct, badges: [] });
          if (rules.discounted) storeStats[store].discounted += 1;
          // determine alert type
          let alertType = null;
          if (!prev && rules.discounted) alertType = 'NEW_DISCOUNT';
          if (prev && rules.discounted && prev.now_price != null && it.now_price != null && it.now_price < prev.now_price) alertType = 'DEEPER_DISCOUNT';
          if (prev && (prev.in_stock === 0 || prev.in_stock == null) && it.in_stock === 1 && rules.discounted) alertType = 'RESTOCKED';

          // compose fingerprint
          if (alertType) {
            const fingerprint = util.sha1(it.store + '|' + it.product_id + '|' + alertType + '|' + (it.now_price||'') + '|' + (it.was_price||'') + '|' + (it.in_stock==null? 'n': it.in_stock));
            if (!db.alertExists(fingerprint)) {
              const message = buildMessage(alertType, obs);
              const ok = await notifier.sendTelegramHTML(message).catch(e=>{console.warn('notify err', e); return false});
              db.recordAlert(fingerprint, { product_id: it.product_id, store: it.store, alert_type: alertType, now_price: it.now_price, was_price: it.was_price, in_stock: it.in_stock, sent_at: Math.floor(Date.now()/1000) });
              summary.alerts += ok ? 1 : 0;
            }
          }

          db.upsertLatestRow(obs);
        }
      } catch (e) {
        console.warn('Error scanning', store, url, e.message);
      }
    }
  }

  await browser.close();

  // retention
  db.cleanupOlderThan(RETENTION_DAYS);

  // log summary
  summary.store_stats = storeStats;
  fs.appendFileSync(RUNS_LOG, JSON.stringify(summary) + '\n');
  console.log('Run summary', summary);
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function buildMessage(type, obs) {
  const title = esc(obs.name || 'Product');
  const store = esc(obs.store);
  const now = obs.now_price != null ? `${obs.now_price.toFixed(2)} €` : '—';
  const was = obs.was_price != null ? `${obs.was_price.toFixed(2)} €` : '—';
  const pct = obs.discount_pct != null ? `${obs.discount_pct}%` : '—';
  const stock = obs.in_stock === 1 ? 'In stock' : (obs.in_stock === 0 ? 'Out of stock' : 'Unknown');
  const link = esc(obs.url || '');
  return `<b>${type}</b>\n${title}\nStore: ${store}\nNow: ${now}  Was: ${was}\nDiscount: ${pct}\nStock: ${stock}\n<a href="${link}">View product</a>`;
}

// Run
runOnce().catch(err=>{ console.error(err); process.exit(1); });
