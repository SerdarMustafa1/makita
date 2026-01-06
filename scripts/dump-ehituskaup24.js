import playwright from 'playwright';
import fs from 'fs';
const url = 'https://www.ehituskaup24.ee/ee/catalogsearch/result/index/?cat=73&q=Makita';
(async ()=>{
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  const html = await page.content();
  fs.writeFileSync('logs/ehituskaup24_campaign.html', html);
  console.log('wrote logs/ehituskaup24_campaign.html');
  await browser.close();
})();
