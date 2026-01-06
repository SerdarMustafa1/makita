import playwright from 'playwright';
const url = 'https://www.ehituskaup24.ee/ee/catalogsearch/result/index/?cat=73&q=Makita';
(async ()=>{
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  const selectors = ['[data-product]', '.product', '.product-item', '.product-card', '.product-list-item', '.catalog-item', 'article.product', '.products-grid .item', '.products-grid article.product'];
  for (const s of selectors) {
    const count = await page.$$eval(s, els => els.length).catch(()=>0);
    console.log(s, count);
  }
  await browser.close();
})();
