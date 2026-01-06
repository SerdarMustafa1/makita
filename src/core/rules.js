import { parsePrice, sha1 } from './util.js';

export function makeProductId(store, url, name) {
  return sha1(store + '|' + url + '|' + (name || ''));
}

export function detectDiscountFromCard(card) {
  // card: {name, url, text, now_price, was_price, badges, raw}
  const now = card.now_price ?? null;
  const was = card.was_price ?? null;
  let discount_pct = card.discount_pct ?? null;

  if (!discount_pct && was && now) {
    try { discount_pct = Math.round(((was - now) / was) * 100); } catch(e){discount_pct=null}
  }

  // detect strike-through or 'was' indicators in English and Estonian
  const raw = String(card.raw || '');
  const hasStrike = /<del>|<s>|\bwas\b|\bold\b|\bvarem\b|\benne\b/i.test(raw) || !!was;
  const badges = Array.isArray(card.badges) ? card.badges : (card.badges ? [card.badges] : []);
  const hasBadge = !!(badges.find(b=>/-\d+%/.test(String(b))));

  const discounted = hasBadge || (was != null && now != null) || hasStrike;
  return { discounted, now, was, discount_pct };
}
