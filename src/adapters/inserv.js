import { parsePrice, tryClickCookie } from '../core/util.js';
import { makeProductId } from '../core/rules.js';

async function parseFromPage(page) {
  await tryClickCookie(page).catch(()=>{});
  await page.waitForTimeout(200);
  // Prefer product container selectors when available (articles, catalog-item, product blocks)
  const containers = await page.$$eval('article.catalog-item, .catalog-item, [class*=product], [class*=card], .product-item, .item', els => els.map(el => {
    const a = el.querySelector('a[href]');
    const priceEl = el.querySelector('.price, .product-price, .price-now, .price, .old, .price-old');
    const oldEl = el.querySelector('del, .old, .price-old');
    return { href: a ? a.getAttribute('href') : null, title: a ? a.textContent.trim() : (el.textContent||'').trim(), priceText: priceEl ? priceEl.textContent.trim() : null, oldText: oldEl ? oldEl.textContent.trim() : null, html: el.outerHTML || '' };
  })).catch(()=>[]);

  let candidates = containers.filter(n => n && n.href);
  // fallback: anchors that have nearby price info
  if (!candidates.length) {
    candidates = await page.$$eval('a[href^="/"]', els => els.map(a => {
      // look for price siblings or parent price nodes
      const parent = a.closest('article, .product, .catalog-item, .card, .item');
      const priceEl = parent ? parent.querySelector('.price, .product-price, .price-now, .price, .old, .price-old') : (a.nextElementSibling && /price|old|product/i.test(a.nextElementSibling.className || '') ? a.nextElementSibling : null);
      const oldEl = parent ? parent.querySelector('del, .old, .price-old') : null;
      return { href: a.getAttribute('href'), title: a.textContent ? a.textContent.trim() : '', priceText: priceEl ? (priceEl.textContent||'').trim() : null, oldText: oldEl ? (oldEl.textContent||'').trim() : null, html: a.outerHTML || '' };
    })).catch(()=>[]);
  }

  const out = [];
  for (const n of candidates.slice(0, 200)) {
    try {
      let href = n.href;
      if (href && !href.startsWith('http')) {
        try { href = new URL(href, page.url()).toString(); } catch(e){}
      }
      const cardText = n.title || '';
      const raw = n.html || '';
      const priceCandidates = [];
      if (n.priceText) priceCandidates.push(n.priceText);
      if (n.oldText) priceCandidates.push(n.oldText);

      // also look in title/html for amounts
      const amountsInTitle = Array.from((cardText.matchAll(/(\d+[\s\d]*[,\.]\d{2})\s*€/g))).map(m=>m[1]);
      for (const a of amountsInTitle) priceCandidates.push(a);

      const prices = priceCandidates;
      let nowText = null, wasText = null;
      if (prices.length === 1) nowText = prices[0];
      else if (prices.length >= 2) {
        const parsed = prices.map(p=>parsePrice(p)).filter(x=>x!=null);
        if (parsed.length >= 2) {
          const sorted = [...parsed].sort((a,b)=>a-b);
          nowText = String(sorted[0]);
          wasText = String(sorted[1]);
        } else { nowText = prices[0]; wasText = prices[1]; }
      }
      if (!nowText) {
        const m = raw.match(/(\d+[\s\d]*[,\.]\d{2})\s*€/);
        if (m) nowText = m[1];
      }

      const now_price = parsePrice(nowText) || null;
      const was_price = parsePrice(wasText) || null;
      const badgeM = cardText.match(/-(\d+)%/);
      const discount_pct = badgeM ? Number(badgeM[1]) : (was_price && now_price ? Math.round(((was_price-now_price)/was_price)*100) : null);

      const in_stock = /\b(laos|saadaval|on laos|available)\b/i.test(cardText) ? 1 : (/\b(otsas|pole laos|out of stock|sold out)\b/i.test(cardText) ? 0 : null);

      const name = cardText.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,3).join(' | ');
      out.push({ store: 'inserv', name, url: href, now_price, was_price, discount_pct, in_stock, raw, scraped_at: Math.floor(Date.now()/1000), product_id: makeProductId('inserv', href||'', name) });
    } catch(e) { continue; }
  }
  return out;
}

export { parseFromPage };

export default async function scan(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return parseFromPage(page);
}
