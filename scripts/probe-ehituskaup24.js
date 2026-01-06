import playwright from 'playwright';
const url = 'https://www.ehituskaup24.ee/ee/catalogsearch/result/index/?cat=73&q=Makita';
(async ()=>{
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  const nodes = await page.$$('.products-grid article.product');
  console.log('nodes', nodes.length);
  for (let i=0;i<nodes.length;i++){
    const c = nodes[i];
    const href = await c.$eval('a[href]', a=>a.getAttribute('href')).catch(()=>null);
    const title = await c.$eval('h2.product-name a', a=>a.textContent.trim()).catch(()=>null);
    const now = await c.$eval('.special-price .price', el=>el.textContent.trim()).catch(()=>null);
    const was = await c.$eval('.old-price .price', el=>el.textContent.trim()).catch(()=>null);
    const badge = await c.$eval('.label-pro-sale .price', el=>el.textContent.trim()).catch(()=>null);
    console.log(i+1, {href, title, now, was, badge});
  }
  await browser.close();
})();
