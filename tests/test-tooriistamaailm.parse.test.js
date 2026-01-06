import fs from 'fs';
import playwright from 'playwright';
import { parseFromPage } from '../src/adapters/tooriistamaailm.js';

(async function(){
  const html = fs.readFileSync('tests/fixtures/tooriistamaailm.html','utf8');
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const out = await parseFromPage(page);
  console.log('Parsed items (tooriistamaailm):', out.length);
  for (const it of out) console.log('-', it.name, it.now_price, it.was_price, it.discount_pct);
  await browser.close();
})();
