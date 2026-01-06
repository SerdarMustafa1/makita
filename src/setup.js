import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DB_DIR, 'makita.db');
const SCHEMA = path.join(ROOT, 'schema.sql');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const sql = fs.readFileSync(SCHEMA, 'utf8');
db.exec(sql);
console.log('DB initialized at', DB_PATH);
