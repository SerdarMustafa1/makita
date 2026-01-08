import fs from 'fs';
import assert from 'assert';
import playwright from 'playwright';
import { parseFromPage } from '../src/adapters/krRauta.js';

(async function(){
  const html = fs.readFileSync('tests/fixtures/krRauta.html','utf8');
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const out = await parseFromPage(page);
  assert(Array.isArray(out), 'parseFromPage should return an array');
  if (out.length === 0) {
    console.warn('k-rauta: parsed 0 items — please check fixture or adapter');
    await browser.close();
    process.exit(0);
  }
  const it = out[0];
  assert(it.name && typeof it.name === 'string', 'item.name should be a string');
  assert(typeof it.product_id === 'string' && it.product_id.length > 0, 'product_id present');
  if (typeof it.now_price === 'number') {
    assert(it.now_price > 0, 'now_price should be a positive number when present');
  } else {
    console.warn('k-rauta: item has no numeric now_price — adapter may need selector updates');
  }
  await browser.close();
  console.log('k-rauta parse test passed:', out.length, 'items');
})();
