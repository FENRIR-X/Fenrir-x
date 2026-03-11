// lib/delulu-master.js
// Complete Antidelete System - Adapted from Tayyab's working code

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'delulu-cache.json');
const deletedMessages = new Map();
let botId = null;

// Set Bot ID
function setBotId(sock) {
  if (sock && sock.user && sock.user.id) {
    botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    console.log('✅ Bot ID set:', botId);
  }
}

// Store message (skip bot's own)
function storeMessage(msg) {
  const jid = msg.key.remoteJid;
  const id = msg.key.id;

  if (!jid || !id || !msg.message) return;

  // Skip if sender is bot itself
  const sender = msg.key.participant || msg.key.remoteJid;
  if (msg.key.fromMe || sender === botId) return;

  if (!deletedMessages.has(jid)) {
    deletedMessages.set(jid, new Map());
  }

  deletedMessages.get(jid).set(id, msg);
  console.log(`💾 Stored message: ${id.substring(0, 10)}... from ${sender}`);
  
  // Keep only last 100 messages per chat
  const chatMessages = deletedMessages.get(jid);
  if (chatMessages.size > 100) {
    const firstKey = chatMessages.keys().next().value;
    chatMessages.delete(firstKey);
  }
}

// Handle Message Revocation (Delete)
async function handleMessageRevocation(sock, msg) {
  const jid = msg.key.remoteJid;
  const deletedId = msg.message?.protocolMessage?.key?.id;

  if (!jid || !deletedId || !deletedMessages.has(jid)) return;

  // Check if antidelete is enabled globally
  if (!global.antidelete) return;

  const storedMsg = deletedMessages.get(jid).get(deletedId);
  if (!storedMsg) {
    console.log('⚠️ Message not in cache:', deletedId);
    return;
  }

  console.log('✅ Found deleted message:', deletedId);

  // Skip if deleted msg was from bot itself
  const sender = storedMsg.key.participant || storedMsg.key.remoteJid;
  if (storedMsg.key.fromMe || sender === botId) {
    deletedMessages.get(jid).delete(deletedId);
    return;
  }

  // Check if deleter is owner
  const { isRealOwner } = require('./permissions.js');
  if (isRealOwner(sock, sender)) {
    console.log('👑 Owner deleted - skipping');
    deletedMessages.get(jid).delete(deletedId);
    return;
  }

  const senderName = storedMsg.pushName || sender.split('@')[0];
  const senderNumber = sender.split('@')[0].replace(/\D/g, '');
  const messageContent = extractMessageContent(storedMsg);

  const infoText = `╭━━━━━━━━━━━━━━╮
┃ 🗑️ 𝗗𝗘𝗟𝗘𝗧𝗘𝗗 𝗠𝗘𝗦𝗦𝗔𝗚𝗘
╰━━━━━━━━━━━━━━╯

👤 User: @${senderNumber}
📛 Name: ${senderName}
⏰ Time: ${new Date().toLocaleTimeString()}

`;

  if (messageContent.text) {
    await sock.sendMessage(jid, {
      text: `${infoText}📝 Message:\n"${messageContent.text}"\n\nFENRIR-X`,
      mentions: [sender]
    });
  } else if (messageContent.media) {
    await sock.sendMessage(jid, {
      caption: infoText + 'FENRIR-X',
      [messageContent.type]: messageContent.media,
      mentions: [sender]
    });
  }

  console.log('✅ Deleted message recovered!');
  
  // Remove from cache
  deletedMessages.get(jid).delete(deletedId);
}

// Extract message content
function extractMessageContent(msg) {
  const message = msg.message;

  if (!message) return { text: null };
  if (message.conversation) return { text: message.conversation };
  if (message.extendedTextMessage?.text) return { text: message.extendedTextMessage.text };
  if (message.imageMessage) return { type: 'image', media: message.imageMessage };
  if (message.videoMessage) return { type: 'video', media: message.videoMessage };
  if (message.stickerMessage) return { type: 'sticker', media: message.stickerMessage };
  if (message.audioMessage) return { type: 'audio', media: message.audioMessage };
  if (message.documentMessage) return { type: 'document', media: message.documentMessage };

  return { text: null };
}

module.exports = {
  storeMessage,
  handleMessageRevocation,
  setBotId
};
