const { commands, Meta } = require('../lib/');
const fs = require('fs');
const path = require('path');

Meta({
  command: 'backup',
  category: 'utility',
  handler: async (sock, message, args) => {
    const { from } = message;

    try {
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants.map(p => ({
        jid: p.jid,
        pushName: p.pushName || 'No Name',
        isAdmin: p.isAdmin
      }));
      const messages = await sock.getChatHistory(from);
      const backupData = {
        groupName: groupMetadata.subject,
        groupId: from,
        createdAt: new Date(),
        participants,
        messages: messages.map(msg => ({
          id: msg.key.id,
          sender: msg.key.remoteJid,
          message: msg.message,
          timestamp: msg.messageTimestamp
        }))
      };

      const backupDir = path.join(__dirname, '../lib/backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const filePath = path.join(backupDir, `backup-${from}-${Date.now()}.json`);
      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
      await sock.sendMessage(from, { text: `Data saved to ${filePath}.` }, { quoted: message });
    } catch (error) {
      console.error(error);
      }
  }
});

setInterval(async () => {
  try {
    const groups = await sock.groupFetchAllParticipating();
    for (const groupId of Object.keys(groups)) {
      await commands.backup.handler(sock, [{ key: { fromMe: true }, message: {}, from: groupId }]);
    }
  } catch (error) {
    console.error(error);
  }
}, 24 * 60 * 60 * 1000);
