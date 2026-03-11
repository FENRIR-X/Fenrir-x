async function ping(sock, msg) {
  const start = Date.now();
  const jid = msg.key.remoteJid;
  
  // Send initial "Pong" message
  const sentMsg = await sock.sendMessage(jid, { text: '𝐏𝐨𝐧𝐠! 🏓' }, { quoted: msg });
  
  // Calculate response time
  const end = Date.now();
  const responseTime = end - start;
  
  // Edit the same message with response time
  await sock.sendMessage(
    jid, 
    { 
      text: `𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 𝐭𝐢𝐦𝐞: ${responseTime}𝐦𝐬`,
      edit: sentMsg.key
    }
  );
}

module.exports = ping;
