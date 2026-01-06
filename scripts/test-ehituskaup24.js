import playwright from 'playwright';
import scan from '../src/adapters/ehituskaup24.js';

const url = 'https://www.ehituskaup24.ee/ee/catalogsearch/result/index/?cat=73&q=Makita';
(async ()=>{
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    const res = await scan(page, url);
    console.log('detected', res.length);
    console.log(res.slice(0,6));
  } catch (e) {
    console.error('error', e && e.message);
  } finally {
    await browser.close();
  }
})();
