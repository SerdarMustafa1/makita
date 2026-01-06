import playwright from 'playwright';
const url = 'https://www.ehituskaup24.ee/ee/catalogsearch/result/index/?cat=73&q=Makita';
(async ()=>{
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  const data = await page.evaluate(()=>{
    const nodes = Array.from(document.querySelectorAll('.products-grid .item'));
    return nodes.map(n=>{
      const a = n.querySelector('h2.product-name a, .product-name a');
      const href = a ? a.href : (n.querySelector('a[href]') ? n.querySelector('a[href]').href : null);
      const name = a ? a.textContent.trim() : (n.textContent||'').trim();
      const now = (n.querySelector('.special-price .price')||{}).textContent || null;
      const was = (n.querySelector('.old-price .price')||{}).textContent || null;
      const badge = (n.querySelector('.label-pro-sale .price')||{}).textContent || null;
      return {href, name: name && name.slice(0,120), now: now && now.trim(), was: was && was.trim(), badge: badge && badge.trim()};
    });
  });
  console.log(data);
  await browser.close();
})();
