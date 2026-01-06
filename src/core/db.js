import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, 'makita.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const insertObservationStmt = db.prepare(
  `INSERT INTO observations (product_id, store, name, url, now_price, was_price, discount_pct, in_stock, scraped_at)
   VALUES (@product_id,@store,@name,@url,@now_price,@was_price,@discount_pct,@in_stock,@scraped_at)`
);

const upsertLatest = db.prepare(
  `INSERT INTO latest(product_id,store,name,url,now_price,was_price,discount_pct,in_stock,scraped_at)
   VALUES(@product_id,@store,@name,@url,@now_price,@was_price,@discount_pct,@in_stock,@scraped_at)
   ON CONFLICT(product_id) DO UPDATE SET
     store=excluded.store,
     name=excluded.name,
     url=excluded.url,
     now_price=excluded.now_price,
     was_price=excluded.was_price,
     discount_pct=excluded.discount_pct,
     in_stock=excluded.in_stock,
     scraped_at=excluded.scraped_at
   `
);

const getLatestById = db.prepare('SELECT * FROM latest WHERE product_id = ?');

const insertAlert = db.prepare(
  `INSERT OR IGNORE INTO alerts_sent (fingerprint, product_id, store, alert_type, now_price, was_price, in_stock, sent_at)
   VALUES(@fingerprint,@product_id,@store,@alert_type,@now_price,@was_price,@in_stock,@sent_at)`
);

const hasAlertFingerprint = db.prepare('SELECT 1 FROM alerts_sent WHERE fingerprint = ? LIMIT 1');

function insertObservation(obj) {
  insertObservationStmt.run(obj);
}

function upsertLatestRow(obj) {
  upsertLatest.run(obj);
}

function getLatest(product_id) {
  return getLatestById.get(product_id);
}

function recordAlert(fingerprint, meta) {
  insertAlert.run({ fingerprint, ...meta });
}

function alertExists(fingerprint) {
  return !!hasAlertFingerprint.get(fingerprint);
}

function cleanupOlderThan(days) {
  const cutoff = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
  db.prepare('DELETE FROM observations WHERE scraped_at < ?').run(cutoff);
  db.prepare('DELETE FROM alerts_sent WHERE sent_at < ?').run(cutoff);
}

export default {
  insertObservation,
  upsertLatestRow,
  getLatest,
  recordAlert,
  alertExists,
  cleanupOlderThan,
  db
};
