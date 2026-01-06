import fs from 'fs';
import playwright from 'playwright';
import { parseFromPage } from '../src/adapters/krRauta.js';

(async function(){
  const html = fs.readFileSync('tests/fixtures/krRauta.html','utf8');
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const out = await parseFromPage(page);
  console.log('Parsed items (k-rauta):', out.length);
  for (const it of out) console.log('-', it.name, it.now_price, it.was_price, it.discount_pct);
  await browser.close();
})();
