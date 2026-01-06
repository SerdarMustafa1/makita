import crypto from 'crypto';

export function sha1(input) {
  return crypto.createHash('sha1').update(input).digest('hex');
}

export function parsePrice(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9,.-]/g, '').trim();
  if (!cleaned) return null;
  // Replace comma decimal with dot
  const normalized = cleaned.replace(/(\d),(\d{2})$/,'$1.$2').replace(/\s+/g,'');
  const n = parseFloat(normalized.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function formatPrice(n) {
  if (n == null) return '';
  return n.toFixed(2) + ' €';
}

export async function tryClickCookie(page) {
  const candidates = [
    'button:has-text("Nõustu")',
    'button:has-text("N%C3%B5ustu")',
    'button:has-text("Accept")',
    'button:has-text("Agree")',
    'button:has-text("Saan aru")',
    'button:has-text("Allow")'
  ];
  for (const sel of candidates) {
    try {
      const btn = await page.$(sel);
      if (btn) { await btn.click({ timeout: 2000 }).catch(()=>{}); return true; }
    } catch (e) {}
  }
  return false;
}
