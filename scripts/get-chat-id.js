#!/usr/bin/env node
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN not set in .env');
  process.exit(2);
}

async function getUpdates() {
  const url = `https://api.telegram.org/bot${TOKEN}/getUpdates`;
  try {
    const res = await fetch(url);
    const j = await res.json();
    if (!j.ok) { console.error('getUpdates failed', j); process.exit(3); }
    return j.result || [];
  } catch (e) {
    console.error('fetch error', e.message);
    process.exit(4);
  }
}

function extractChatIds(updates) {
  const set = new Set();
  for (const u of updates) {
    if (u.message && u.message.chat && u.message.chat.id) set.add(u.message.chat.id);
    if (u.channel_post && u.channel_post.chat && u.channel_post.chat.id) set.add(u.channel_post.chat.id);
  }
  return Array.from(set);
}

(async ()=>{
  const updates = await getUpdates();
  if (!updates.length) {
    console.log('No updates found. To get your private chat id: send any message to your bot from your account, or add the bot to the group and send a message there.');
    process.exit(0);
  }
  console.log('Recent updates count:', updates.length);
  const ids = extractChatIds(updates);
  if (!ids.length) {
    console.log('No chat ids extracted from updates.');
    process.exit(0);
  }
  console.log('Candidate chat IDs:');
  for (const id of ids) console.log(' -', id);
  console.log('\nIf you need to set `TELEGRAM_CHAT_ID`, copy one of the above IDs into your .env as TELEGRAM_CHAT_ID and re-run the monitor.');
})();
