import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

let TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// allow an explicit group chat id env var for group notifications
let CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
let ready = false;
let botInfo = null;

async function init() {
  TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  ready = false;
  botInfo = null;
  if (!TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set; notifications disabled');
    return false;
  }
  // validate token
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getMe`);
    const meJson = await meRes.json();
    if (!meJson.ok) { console.warn('Invalid TELEGRAM_BOT_TOKEN:', meJson); return false; }
    botInfo = meJson.result;
  } catch (e) {
    console.warn('Error validating TELEGRAM_BOT_TOKEN', e.message);
    return false;
  }
  if (!CHAT_ID) {
    console.warn('TELEGRAM_CHAT_ID not set; notifications disabled');
    return false;
  }
  // validate chat id
  try {
    const chatRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getChat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID })
    });
    const chatJson = await chatRes.json();
    if (!chatJson.ok) { console.warn('TELEGRAM_CHAT_ID invalid or bot not a member of the chat:', chatJson); return false; }
  } catch (e) {
    console.warn('Error validating TELEGRAM_CHAT_ID', e.message);
    return false;
  }
  ready = true;
  console.log('Telegram notifier ready; bot:', botInfo.username, 'chat:', CHAT_ID);
  return true;
}

async function sendTelegramHTML(message) {
  if (!ready) {
    console.warn('Telegram notifier not ready; skipping send');
    return false;
  }
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'HTML', disable_web_page_preview: true })
    });
    const json = await res.json();
    if (!json.ok) console.warn('Telegram send failed', json);
    return json.ok;
  } catch (e) {
    console.warn('Telegram send error', e.message);
    return false;
  }
}

export default { init, sendTelegramHTML, isReady: () => ready };
