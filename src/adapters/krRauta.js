import { parsePrice, tryClickCookie } from '../core/util.js';
import { makeProductId } from '../core/rules.js';

async function parseFromPage(page) {
  await tryClickCookie(page).catch(()=>{});
  await page.waitForTimeout(200);
  const cards = await page.$$('[class*=product], .product-card, .product');
  const out = [];
  for (const c of cards.slice(0,80)) {
    const anchor = await c.$('a[href]');
    if (!anchor) continue;
    let href = await anchor.getAttribute('href');
    if (href && !href.startsWith('http')) {
      try { href = new URL(href, page.url()).toString(); } catch(e){}
    }
    const name = (await anchor.textContent().catch(()=>null))?.trim() || (await c.textContent().catch(()=>null))?.trim() || '';
    const raw = (await c.innerHTML().catch(()=>'')) || '';
    const nowText = (await c.$eval('.price, .price--now, [itemprop=price]', el=>el.textContent).catch(()=>null)) || null;
    const wasText = (await c.$eval('del, .price--was, .old-price', el=>el.textContent).catch(()=>null)) || null;
    const badge = (await c.$eval('.badge, .sale, .discount', el=>el.textContent).catch(()=>null)) || null;
    const now_price = parsePrice(nowText) || null;
    const was_price = parsePrice(wasText) || null;
    const discount_pct = badge && /-(\d+)%/.exec(badge) ? Number(RegExp.$1) : (was_price && now_price ? Math.round(((was_price-now_price)/was_price)*100) : null);
    const txt = (await c.textContent().catch(()=>'')) || '';
    const in_stock = /laos|saadaval|available/i.test(txt) ? 1 : (/otsas|pole laos|out of stock|sold out/i.test(txt) ? 0 : null);
    out.push({ store: 'k-rauta', name, url: href, now_price, was_price, discount_pct, in_stock, raw, scraped_at: Math.floor(Date.now()/1000), product_id: makeProductId('k-rauta', href||'', name) });
  }
  return out;
}

export { parseFromPage };

export default async function scan(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return parseFromPage(page);
}
