import fs from 'fs';
import playwright from 'playwright';

(async()=>{
  const html = fs.readFileSync('tests/fixtures/tooriistamaailm_1.html','utf8');
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const sels = ['.product', '.product-item', '.product-tile', '.product-card', '.tile', '.grid-item', '.catalog-item', '#brand-products-section a', '.grid a', 'a.group', 'a.bg-white', 'a[href^="/"][class]'];
  for (const s of sels) {
    const n = await page.$$eval(s, els => els.length).catch(()=>0);
    console.log(s, n);
  }
  await browser.close();
})();
