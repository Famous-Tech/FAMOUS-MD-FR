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

commands.push('warn')
