import { parsePrice, tryClickCookie } from '../core/util.js';
import { makeProductId } from '../core/rules.js';

function pickText(el, selectors) {
  for (const s of selectors) {
    const n = el.querySelector(s);
    if (n && n.textContent && n.textContent.trim()) return n.textContent.trim();
  }
  return null;
}

export default async function scan(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await tryClickCookie(page).catch(()=>{});
  await page.waitForTimeout(900);

  // Try a set of likely product card selectors first
  const cardSelectors = ['.product', '.product-item', '.product-tile', '.product-card', '.tile', '.grid-item', '.catalog-item'];
  let cards = [];
  for (const sel of cardSelectors) {
    cards = await page.$$(sel);
    if (cards && cards.length) break;
  }

  // If we didn't find cards, fallback to product anchors on the page
  if (!cards || cards.length === 0) {
    const anchors = await page.$$('a[href*="/p/"], a[href*="/product/"], a[href*="/products/"], a[href*="/toode/"]');
    // create pseudo-cards from anchors
    cards = anchors;
  }

  const out = [];
  for (const c of cards.slice(0, 200)) {
    try {
      // anchor resolution
      let anchor = await c.$('a[href]');
      if (!anchor) {
        // if card is an anchor itself
        const tag = await c.evaluate(node => node.tagName.toLowerCase()).catch(()=>null);
        if (tag === 'a') anchor = c;
      }
      if (!anchor) continue;
      let href = await anchor.getAttribute('href');
      if (!href) continue;
      if (href && !href.startsWith('http')) {
        try { href = new URL(href, page.url()).toString(); } catch (e) { /* ignore */ }
      }

      const name = (await (anchor.textContent()).catch(()=>null))?.trim() || (await c.textContent()).catch? (await c.textContent()).trim() : '';
      const raw = (await c.innerHTML()).catch(()=>'');

      // Price extraction fallbacks
      const nowSelectors = ['.price .now', '.price-now', '.price-current', '.current-price', '.product-price .price', '[itemprop="price"]', '.price'];
      const wasSelectors = ['del', '.old-price', '.price-old', '.was-price', '.compare-at-price'];
      const badgeSelectors = ['.badge', '.product-label', '.discount', '.sale-badge', '.label-sale'];

      let nowText = null;
      for (const s of nowSelectors) {
        nowText = await c.$eval(s, el=>el.textContent).catch(()=>null);
        if (nowText) break;
      }
      let wasText = null;
      for (const s of wasSelectors) {
        wasText = await c.$eval(s, el=>el.textContent).catch(()=>null);
        if (wasText) break;
      }
      let badge = null;
      for (const s of badgeSelectors) {
        badge = await c.$eval(s, el=>el.textContent).catch(()=>null);
        if (badge) break;
      }

      // final fallbacks: try to regex prices from card text
      const cardText = (await c.textContent()).catch(()=>'') || '';
      if (!nowText) {
        const m = cardText.match(/(\d+[\s\d]*[,\.]\d{2})\s*€/);
        nowText = m ? m[1] : null;
      }
      if (!wasText) {
        const m2 = cardText.match(/(\d+[\s\d]*[,\.]\d{2})\s*€\s*(?:$|\n)/m);
        wasText = m2 ? m2[1] : null;
      }

      const now_price = parsePrice(nowText) || null;
      const was_price = parsePrice(wasText) || null;
      const discount_pct = badge && /-(\d+)%/.exec(badge) ? Number(RegExp.$1) : (was_price && now_price ? Math.round(((was_price-now_price)/was_price)*100) : null);

      const txt = cardText || '';
      const in_stock = /\b(laos|saadaval|on laos|available)\b/i.test(txt) ? 1 : (/\b(otsas|pole laos|out of stock|sold out)\b/i.test(txt) ? 0 : null);

      const pid = makeProductId('tooriistamaailm', href||'', name || '');
      out.push({ store: 'tooriistamaailm', name, url: href, now_price, was_price, discount_pct, in_stock, raw, scraped_at: Math.floor(Date.now()/1000), product_id: pid });
    } catch (e) {
      // ignore individual card errors
      continue;
    }
  }

  return out;
}
