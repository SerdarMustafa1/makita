import { parsePrice, tryClickCookie } from '../core/util.js';
import { makeProductId } from '../core/rules.js';

async function parseFromPage(page) {
  await tryClickCookie(page).catch(()=>{});
  await page.waitForTimeout(200);

  // quick DOM-mode extraction for category / campaign grid (works for .products-grid .item)
  try {
    const gridCount = await page.$$eval('.products-grid .item', els => els.length).catch(() => 0);
    if (gridCount && gridCount > 0) {
      const rawItems = await page.$$eval('.products-grid .item', nodes => nodes.map(n => {
        const a = n.querySelector('h2.product-name a, .product-name a') || n.querySelector('a[href]');
        const href = a ? a.href : null;
        const name = a ? a.textContent.trim() : (n.textContent || '').trim();
        const nowText = (n.querySelector('.special-price .price') || {}).textContent || null;
        const wasText = (n.querySelector('.old-price .price') || {}).textContent || null;
        const badge = (n.querySelector('.label-pro-sale .price') || {}).textContent || null;
        const raw = n.innerHTML || '';
        return { href, name, nowText, wasText, badge, raw };
      }));

      const outFast = rawItems.slice(0,160).map(it => {
        const now_price = parsePrice(it.nowText);
        const was_price = parsePrice(it.wasText);
        const discount_pct = (it.badge && /-(\d{1,2})%/.exec(it.badge)) ? Number(RegExp.$1) : (was_price && now_price ? Math.round(((was_price-now_price)/was_price)*100) : null);
        const in_stock = /\b(laos|saadaval|on laos|available)\b/i.test(it.raw) ? 1 : (/\b(otsas|pole laos|out of stock|sold out)\b/i.test(it.raw) ? 0 : null);
        return { store: 'ehituskaup24', name: it.name, url: it.href, now_price, was_price, discount_pct, in_stock, raw: it.raw, scraped_at: Math.floor(Date.now()/1000), product_id: makeProductId('ehituskaup24', it.href||'', it.name) };
      });
      if (outFast.length) return outFast;
    }
  } catch (e) {}

  const cardSelectors = ['.products-grid .item', '.item', '.item-inner', '.box-item', '[data-product]', 'article.product', '.product', '.product-item', '.product-card', '.product-list-item', '.catalog-item'];
  let cards = [];
  for (const s of cardSelectors) {
    cards = await page.$$(s);
    if (cards && cards.length) break;
  }
  if (!cards || cards.length === 0) {
    // fallback to product anchors
    cards = await page.$$('a[href*="/product"], a[href*="/toode"], a[href*="/p/"]');
  }

  const nowSelectors = ['.price .now', '.price-now', '.price-current', '.current-price', '[itemprop="price"]', '.price'];
  const wasSelectors = ['del', '.old-price', '.price-old', '.was-price', '.compare-at-price'];
  const badgeSelectors = ['.badge', '.discount', '.sale', '.label-sale', '.product-label', '.label-pro-sale'];

  const out = [];
  for (const c of cards.slice(0, 160)) {
    try {
      // prefer product-name anchor for title/link, otherwise fall back to first anchor
      const nameAnchor = await c.$('h2.product-name a, .product-name a').catch(()=>null);
      let anchor = nameAnchor || await c.$('a[href]').catch(()=>null);
      if (!anchor) {
        const tag = await c.evaluate(n=>n.tagName.toLowerCase()).catch(()=>null);
        if (tag === 'a') anchor = c;
      }
      if (!anchor) continue;
      let href = await anchor.getAttribute('href').catch(()=>null);
      if (!href) continue;
      if (href && !href.startsWith('http')) {
        try { href = new URL(href, page.url()).toString(); } catch(e){}
      }

      const nameText = nameAnchor ? await nameAnchor.textContent().catch(()=>null) : await anchor.textContent().catch(()=>null);
      const name = (nameText && nameText.trim()) || (await c.textContent().catch(()=>null) || '').trim();
      const raw = (await c.innerHTML().catch(()=>'')) || '';

      // try to find explicit badge text first
      let badge = null;
      for (const s of badgeSelectors) { badge = await c.$eval(s, el=>el.textContent).catch(()=>null); if (badge) break; }

      const cardText = (await c.textContent()).catch(()=>'') || '';

      // extract all euro prices from the card text and pick now/was robustly
      const priceRe = /(\d+[\s\d]*[,.]\d{2})\s*€/g;
      const prices = [];
      let pm;
      while ((pm = priceRe.exec(cardText)) !== null) {
        const p = parsePrice(pm[1]);
        if (p) prices.push(p);
      }
      let now_price = null;
      let was_price = null;
      if (prices.length === 1) {
        now_price = prices[0];
      } else if (prices.length >= 2) {
        now_price = Math.min(...prices);
        was_price = Math.max(...prices);
        if (was_price <= now_price) was_price = null;
      }

      // explicit percentage like "-13%" in card text is reliable
      let discount_pct = null;
      const dm = cardText.match(/-(\d{1,2})%/);
      if (dm) discount_pct = Number(dm[1]);
      else if (was_price && now_price) discount_pct = Math.round(((was_price - now_price) / was_price) * 100);

      const in_stock = /\b(laos|saadaval|on laos|available|kohtuvad)\b/i.test(cardText) ? 1 : (/\b(otsas|pole laos|out of stock|sold out)\b/i.test(cardText) ? 0 : null);

      out.push({ store: 'ehituskaup24', name, url: href, now_price, was_price, discount_pct, in_stock, raw, scraped_at: Math.floor(Date.now()/1000), product_id: makeProductId('ehituskaup24', href||'', name) });
    } catch (e) {
      continue;
    }
  }
  return out;
}

export { parseFromPage };

export default async function scan(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  return parseFromPage(page);
}
