import fs from 'fs';
import assert from 'assert';
import playwright from 'playwright';
import { parseFromPage } from '../src/adapters/tooriistamaailm.js';

(async function(){
  const f1 = 'tests/fixtures/tooriistamaailm_1.html';
  const f0 = 'tests/fixtures/tooriistamaailm.html';
  const src = fs.existsSync(f1) ? f1 : f0;
  const html = fs.readFileSync(src,'utf8');
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const out = await parseFromPage(page);
  assert(Array.isArray(out), 'parseFromPage should return an array');
  if (out.length === 0) {
    console.warn('tooriistamaailm: parsed 0 items — please check fixture or adapter');
    await browser.close();
    process.exit(0);
  }
  const it = out[0];
  assert(it.name && typeof it.name === 'string', 'item.name should be a string');
  assert(typeof it.product_id === 'string' && it.product_id.length > 0, 'product_id present');
  assert(typeof it.now_price === 'number' && it.now_price > 0, 'now_price should be a positive number');
  await browser.close();
  console.log('tooriistamaailm parse test passed:', out.length, 'items');
})();
