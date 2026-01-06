import playwright from 'playwright';
const url = 'https://www.ehituskaup24.ee/ee/catalogsearch/result/index/?cat=73&q=Makita';
(async ()=>{
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  const nodes = await page.$$('.products-grid .item');
  console.log('nodes', nodes.length);
  for (let i=0;i<nodes.length;i++){
    const c = nodes[i];
    const anchor = await c.$('a[href]');
    const href = anchor ? await anchor.getAttribute('href') : null;
    const nameText = await (anchor ? anchor.textContent().catch(()=>null) : null);
    const name = (nameText && nameText.trim()) || (await c.textContent().catch(()=>null) || '').trim();
    const now = await c.$eval('.special-price .price', el=>el.textContent.trim()).catch(()=>null);
    const was = await c.$eval('.old-price .price', el=>el.textContent.trim()).catch(()=>null);
    const badge = await c.$eval('.label-pro-sale .price', el=>el.textContent.trim()).catch(()=>null);
    console.log(i+1, {href, name: name && name.slice(0,80), now, was, badge});
  }
  await browser.close();
})();
