import fs from 'fs';
import playwright from 'playwright';

(async()=>{
  const html = fs.readFileSync('tests/fixtures/tooriistamaailm_1.html','utf8');
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const cards = await page.$$('#brand-products-section a');
  console.log('cards count', cards.length);
  for (let i=0;i<Math.min(5,cards.length);i++){
    const c = cards[i];
    const href = await c.getAttribute('href');
    const txt = await c.textContent();
    console.log('--- card', i, 'href=', href);
    console.log(txt.slice(0,200).replace(/\n/g,' '));
    const m = txt.match(/(\d+[\.,]\d{2})\s*€/) || txt.match(/(\d+[\.,]\d{2})/);
    console.log('price match:', m && m[1]);
  }
  await browser.close();
})();
