import { parsePrice, tryClickCookie } from '../core/util.js';
import { makeProductId } from '../core/rules.js';

function pickText(el, selectors) {
  for (const s of selectors) {
    const n = el.querySelector(s);
    if (n && n.textContent && n.textContent.trim()) return n.textContent.trim();
  }
  return null;
}

async function parseFromPage(page) {
  await tryClickCookie(page).catch(()=>{});
  await page.waitForTimeout(200);

  // Try a set of likely product card selectors first
  const cardSelectors = ['.product', '.product-item', '.product-tile', '.product-card', '.tile', '.grid-item', '.catalog-item', '#brand-products-section a', '.grid a', 'a.group', 'a.bg-white', 'a[href^["/"]][class]'];

  let nodes = [];
  for (const sel of cardSelectors) {
    // Use $$eval to reliably serialize matching nodes into plain objects
    const found = await page.$$eval(sel, els => els.map(el => {
      const a = el.closest('a') || (el.tagName && el.tagName.toLowerCase() === 'a' ? el : null);
      return {
        href: a ? a.getAttribute('href') : null,
        text: el.textContent ? el.textContent.trim() : '',
        html: el.outerHTML || ''
      };
    })).catch(()=>[]);
    if (found && found.length) { nodes = found; break; }
  }

  // fallback: anchors that look like product links
  if (!nodes || nodes.length === 0) {
    nodes = await page.$$eval('a[href^="/"][class], #brand-products-section a[href^="/"], a[href^="/"].group, .grid a', els => els.map(a => ({ href: a.getAttribute('href'), text: a.textContent ? a.textContent.trim() : '', html: a.outerHTML || '' }))).catch(()=>[]);
  }

  const out = [];
  for (const n of nodes.slice(0, 300)) {
    try {
      let href = n.href || null;
      if (!href) continue;
      if (href && !href.startsWith('http')) {
        try { href = new URL(href, page.url()).toString(); } catch (e) { /* leave relative */ }
      }

      const cardText = n.text || '';
      const raw = n.html || '';

      // Try to extract now/was prices and badge text via simple regexes
      let nowText = null;
      let wasText = null;
      let badge = null;

      // badge like -37%
      const b = cardText.match(/-(\d+)%/);
      if (b) badge = b[0];

      // find two euro amounts; prefer the first as now price if there's a discount badge
      const prices = Array.from(cardText.matchAll(/(\d+[\s\d]*[,\.]\d{2})\s*€/g)).map(m=>m[1]);
      if (prices.length === 1) nowText = prices[0];
      else if (prices.length >= 2) {
        // often 'now was' order or 'now old' order; assume the smaller is now price
        const parsed = prices.map(p=>parsePrice(p)).filter(x=>x!=null);
        if (parsed.length >= 2) {
          const sorted = [...parsed].sort((a,b)=>a-b);
          nowText = String(sorted[0]);
          wasText = String(sorted[1]);
        } else {
          nowText = prices[0];
          wasText = prices[1];
        }
      }

      // extra fallback: try to parse prices from raw HTML
      if (!nowText) {
        const m = raw.match(/(\d+[\s\d]*[,\.]\d{2})\s*€/);
        if (m) nowText = m[1];
      }

      const now_price = parsePrice(nowText) || null;
      const was_price = parsePrice(wasText) || null;
      const discount_pct = badge && /-(\d+)%/.exec(badge) ? Number(RegExp.$1) : (was_price && now_price ? Math.round(((was_price-now_price)/was_price)*100) : null);

      const in_stock = /\b(laos|saadaval|on laos|available)\b/i.test(cardText) ? 1 : (/\b(otsas|pole laos|out of stock|sold out)\b/i.test(cardText) ? 0 : null);

      const name = cardText.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,3).join(' | ');

      const pid = makeProductId('tooriistamaailm', href||'', name || '');
      out.push({ store: 'tooriistamaailm', name, url: href, now_price, was_price, discount_pct, in_stock, raw, scraped_at: Math.floor(Date.now()/1000), product_id: pid });
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
