import fs from 'fs';
import assert from 'assert';
import playwright from 'playwright';
import { parseFromPage } from '../src/adapters/ehituskaup24.js';

(async function(){
  const html = fs.readFileSync('logs/ehituskaup24_campaign.html','utf8');
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const out = await parseFromPage(page);
  assert(Array.isArray(out), 'parseFromPage should return an array');
  assert(out.length > 0, 'expected at least one parsed item');
  const it = out[0];
  assert(it.name && typeof it.name === 'string', 'item.name should be a string');
  assert(typeof it.product_id === 'string' && it.product_id.length > 0, 'product_id present');
  assert(typeof it.now_price === 'number' && it.now_price > 0, 'now_price should be a positive number');
  await browser.close();
  console.log('ehituskaup24 parse test passed:', out.length, 'items');
})();
