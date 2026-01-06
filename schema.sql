PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  store TEXT NOT NULL,
  name TEXT,
  url TEXT,
  now_price REAL,
  was_price REAL,
  discount_pct INTEGER,
  in_stock INTEGER,
  scraped_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_observations_product_time ON observations(product_id, scraped_at);

CREATE TABLE IF NOT EXISTS latest (
  product_id TEXT PRIMARY KEY,
  store TEXT NOT NULL,
  name TEXT,
  url TEXT,
  now_price REAL,
  was_price REAL,
  discount_pct INTEGER,
  in_stock INTEGER,
  scraped_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts_sent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL,
  store TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  now_price REAL,
  was_price REAL,
  in_stock INTEGER,
  sent_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_sent_product ON alerts_sent(product_id);
