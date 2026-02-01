import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

let TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// allow an explicit group chat id env var for group notifications
let CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
let REQUIRED_USER_ID = process.env.TELEGRAM_REQUIRED_USER_ID;
let REQUIRED_USERNAME = process.env.TELEGRAM_REQUIRED_USERNAME;
let ready = false;
let botInfo = null;

async function validateRequiredMember(token, chatId, userIdRaw, usernameRaw) {
  const requiredUserId = userIdRaw?.toString().trim() ?? '';
  const requiredUsername = usernameRaw?.toString().trim().replace(/^@/, '') ?? '';
  if (!requiredUserId && !requiredUsername) {
    return { ok: true };
  }

  if (requiredUserId) {
    const parsedUserId = Number.parseInt(requiredUserId, 10);
    if (!Number.isFinite(parsedUserId)) {
      return { ok: false, reason: `TELEGRAM_REQUIRED_USER_ID is not a valid number: ${requiredUserId}` };
    }
    try {
      const memberRes = await fetch(`https://api.telegram.org/bot${token}/getChatMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, user_id: parsedUserId })
      });
      const memberJson = await memberRes.json();
      if (!memberJson.ok) {
        return { ok: false, reason: `Required user ${parsedUserId} not found in chat`, detail: memberJson };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: `Error validating required user id ${requiredUserId}: ${e.message}` };
    }
  }

  if (requiredUsername) {
    try {
      const adminsRes = await fetch(`https://api.telegram.org/bot${token}/getChatAdministrators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId })
      });
      const adminsJson = await adminsRes.json();
      if (!adminsJson.ok) {
        return { ok: false, reason: 'Unable to fetch chat administrators', detail: adminsJson };
      }
      const expected = requiredUsername.toLowerCase();
      const found = adminsJson.result?.some((admin) => {
        const username = admin?.user?.username?.toLowerCase() ?? '';
        return username === expected;
      }) ?? false;
      if (!found) {
        return { ok: false, reason: `Required username @${requiredUsername} not found among chat administrators` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: `Error validating required username @${requiredUsername}: ${e.message}` };
    }
  }

  return { ok: true };
}

async function init() {
  TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  REQUIRED_USER_ID = process.env.TELEGRAM_REQUIRED_USER_ID;
  REQUIRED_USERNAME = process.env.TELEGRAM_REQUIRED_USERNAME;
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
  const requiredCheck = await validateRequiredMember(TOKEN, CHAT_ID, REQUIRED_USER_ID, REQUIRED_USERNAME);
  if (!requiredCheck.ok) {
    console.warn('Required member validation failed:', requiredCheck.reason, requiredCheck.detail ?? '');
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
