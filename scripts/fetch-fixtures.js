import fs from 'fs';
import path from 'path';
import playwright from 'playwright';

const repoRoot = process.cwd();
const cfgPath = path.join(repoRoot, 'src', 'config', 'sources.json');
const outDir = path.join(repoRoot, 'tests', 'fixtures');

if (!fs.existsSync(cfgPath)) {
  console.error('sources.json not found at', cfgPath);
  process.exit(2);
}
const sources = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function fetchAll() {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  for (const store of Object.keys(sources)) {
    const urls = sources[store] || [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const safeName = `${store.replace(/[^a-z0-9_-]/gi,'')}_${i+1}`;
      const outFile = path.join(outDir, `${safeName}.html`);
      try {
        console.log('Fetching', url);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1500);
        const content = await page.content();
        fs.writeFileSync(outFile, content, 'utf8');
        console.log('Saved fixture:', outFile);
      } catch (e) {
        console.error('Failed to fetch', url, e.message);
      }
    }
  }
  await browser.close();
}

fetchAll().then(()=>process.exit(0)).catch(err=>{console.error(err); process.exit(1)});
