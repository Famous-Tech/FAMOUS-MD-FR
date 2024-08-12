const { commands, Meta } = require('../lib/');
const warnings = {};

Meta({
  command: 'warn',
  category: 'moderation',
  handler: async (sock, message, matched) => {
    const { from, mentionedJid } = message[0];
    const target = mentionedJid[0];

    if (!target) {
      return await sock.sendMessage(from, { text: 'Please mention a user' }, { quoted: message[0] });
    }

    if (!warnings[from]) warnings[from] = {};
    if (!warnings[from][target]) warnings[from][target] = 0;

    warnings[from][target] += 1;
    if (warnings[from][target] >= 3) {
      await sock.groupRemove(from, [target]);
      await sock.sendMessage(from, { text: `@${target.split('@')[0]} has been kicked for receiving 3 warnings`, mentions: [target] });
      warnings[from][target] = 0;
    } else {
      await sock.sendMessage(from, { text: `@${target.split('@')[0]} has been warned (${warnings[from][target]}/3).`, mentions: [target] });
    }
  }
});
        
const message_count = {};
commands.messagesUpsert = async (sock, message) => {
  const { key, from, sender } = message[0];
  const sender_m = sender;

  if (!message_count[from]) message_count[from] = {};
  if (!message_count[from][sender_m]) message_count[from][sender_m] = 0;
  message_count[from][sender_m] += 1;
  setTimeout(() => {
    message_count[from][sender_m] -= 1;
  }, 10000); 

  if (message_count[from][sender_m] > 5) {
    await sock.groupRemove(from, [sender_m]);
    await sock.sendMessage(from, { text: `User @${sender_m.split('@')[0]} has been removed for spamming`, mentions: [sender_m] });
  }
};
  
