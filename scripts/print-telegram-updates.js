import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) { console.error('TELEGRAM_BOT_TOKEN not set in .env'); process.exit(1); }

async function run() {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates`);
  const j = await res.json();
  if (!j.ok) { console.error('getUpdates failed', j); process.exit(2); }
  const updates = j.result || [];
  const chats = new Map();
  for (const u of updates) {
    const msg = u.message || u.channel_post || u.edited_message || u.callback_query && u.callback_query.message;
    if (!msg) continue;
    const chat = msg.chat;
    if (!chat) continue;
    chats.set(chat.id, { id: chat.id, type: chat.type, title: chat.title, username: chat.username, first_name: chat.first_name, last_name: chat.last_name });
  }
  if (!chats.size) {
    console.log('No chats found in getUpdates. To obtain your group id: add the bot to the group and send any message, then run this script.');
    return;
  }
  console.log('Discovered chats:');
  for (const [id, info] of chats) {
    console.log('-', id, info.type, info.title || `${info.first_name || ''} ${info.last_name || ''}`.trim() || info.username || '');
  }
  console.log('\nUse the numeric id (for groups it will be negative for supergroups, or -100... for channels) as TELEGRAM_GROUP_CHAT_ID in your .env');
}

run().catch(e=>{ console.error('error', e); process.exit(3); });
