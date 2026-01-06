import { parsePrice, tryClickCookie } from '../core/util.js';
import { makeProductId } from '../core/rules.js';

export default async function scan(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await tryClickCookie(page).catch(()=>{});
  await page.waitForTimeout(800);
  const cards = await page.$$('[class*=product], .product-item, .item');
  const out = [];
  for (const c of cards.slice(0,80)) {
    const anchor = await c.$('a[href]');
    if (!anchor) continue;
    let href = await anchor.getAttribute('href');
    if (href && !href.startsWith('http')) {
      try { href = new URL(href, page.url()).toString(); } catch(e){}
    }
    const name = (await anchor.textContent())?.trim() || (await c.textContent())?.trim() || '';
    const raw = (await c.innerHTML()).toLowerCase();
    const nowText = (await c.$eval('.price, .now, [itemprop=price]', el=>el.textContent).catch(()=>null)) || null;
    const wasText = (await c.$eval('del, .was, .old-price', el=>el.textContent).catch(()=>null)) || null;
    const badge = (await c.$eval('.badge, .discount', el=>el.textContent).catch(()=>null)) || null;
    const now_price = parsePrice(nowText) || null;
    const was_price = parsePrice(wasText) || null;
    const discount_pct = badge && /-(\d+)%/.exec(badge) ? Number(RegExp.$1) : null;
    const txt = (await c.textContent()) || '';
    const in_stock = /laos|saadaval|available/i.test(txt) ? 1 : (/otsas|pole laos|out of stock|sold out/i.test(txt) ? 0 : null);
    out.push({ store: 'impert24', name, url: href, now_price, was_price, discount_pct, in_stock, raw, scraped_at: Math.floor(Date.now()/1000), product_id: makeProductId('impert24', href||'', name) });
  }
  return out;
}
