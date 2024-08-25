const { commands, Meta } = require('../lib/');
const config = require('../config.js');
const { jidDecode } = require('@whiskeysockets/baileys');

Meta({
  command: 'ison',
  category: 'utility',
  handler: async (sock, message, args) => {
    const { key, from, isGroup } = message;
    const { remoteJid } = key;

    const numbers = args.input.trim().split(' ').slice(1);
    if (numbers.length === 0) {
        return await sock.sendMessage(remoteJid, {
        text: `*Usage:* ${config.PREFIX}ison 27686881×××`,
        quoted: message
      });
    }

    let res_matched = '*WhatsApp Num Ison:*\n\n';
    const results = [];

    for (const number of numbers) {
      const id = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
      try {
        const status = await sock.onWhatsApp(id);
        if (status && status.length > 0) {
          const [contactInfo] = status;
          const { jid, status: about, statusTimestamp } = await sock.fetchStatus(contactInfo.jid);
          const Date_Jid = new Date(statusTimestamp * 1000).toLocaleString();
          const parsedJid = jidDecode(jid);

          results.push({
            jid: parsedJid.user + '@' + parsedJid.server,
            number: parsedJid.user,
            about: about || 'No status',
            date: statusTimestamp ? Date_Jid : '_Non_',
          });

          res_matched += `*Number:* ${parsedJid.user}\n`;
          res_matched += `*WhatsApp_JID:* ${parsedJid.user + '@' + parsedJid.server}\n`;
          res_matched += `*About:* ${about || 'No status'}\n`;
          res_matched += `*Status_On:* ${Date_Jid}\n`;
          res_matched += `─────────────────────\n`;
        } else {
          res_matched += `- ${number}: Not Registered on WhatsApp\n`;
        }
      } catch (error) {
        res_matched += `- ${number}: Error\n`;
      }
    }

    if (results.length > 0) {
      res_matched += `\n*Total:* ${results.length}`;
    } else {
      res_matched = 'No WhatsApp accounts found for the provided *num*';
    }
    await sock.sendMessage(remoteJid, { text: res_matched }, { quoted: message });
  }
});
