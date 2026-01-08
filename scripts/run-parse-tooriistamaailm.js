import fs from 'fs';
import playwright from 'playwright';
import { parseFromPage } from '../src/adapters/tooriistamaailm.js';

(async()=>{
  const html = fs.readFileSync('tests/fixtures/tooriistamaailm_1.html','utf8');
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  try{
    const out = await parseFromPage(page);
    console.log('parseFromPage out length', out.length);
    console.dir(out.slice(0,3), { depth: 2 });
  }catch(e){
    console.error('parseFromPage error', e);
  }
  await browser.close();
})();
