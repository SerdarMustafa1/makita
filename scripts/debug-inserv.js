import fs from 'fs';
import playwright from 'playwright';

(async()=>{
  const html = fs.readFileSync('tests/fixtures/inserv_1.html','utf8');
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });

  const anchors = await page.$$eval('a[href^="/"]', els => els.map(a=>({ href: a.getAttribute('href'), text: a.textContent ? a.textContent.trim() : '', html: a.outerHTML || '' })));
  console.log('total anchors', anchors.length);
  const withEur = anchors.filter(a=>/\d+[\.,]\d{2}\s*€/.test(a.text));
  console.log('anchors with € in text', withEur.length);
  for (let i=0;i<Math.min(12, withEur.length); i++) {
    console.log(i, withEur[i].href, '->', withEur[i].text.slice(0,180).replace(/\n/g,' '));
  }

  // check for product-list sections
  const counts = [];
  const sels = ['.product', '.product-item', '.product-card', '.product-list', '.card', '.catalog', '.catalog-item', 'div.product', 'section.products', '.grid', '#products', '.items-list'];
  for (const s of sels) {
    const n = await page.$$eval(s, els=>els.length).catch(()=>0);
    counts.push([s,n]);
  }
  console.table(counts);

  await browser.close();
})();
