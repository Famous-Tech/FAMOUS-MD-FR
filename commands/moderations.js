const { commands, Meta } = require('../lib/');
const { setTimeout } = require('timers/promises');

Meta({
  command: 'ban',
  category: 'modération',
  handler: async (sock, message, args) => {
    const { from, key, mentionedJid } = message;
    const [_, duration] = matched;
    const target = mentionedJid;

    if (!target || !duration) {
      return await sock.sendMessage(from, { text: 'Veuillez mentionner un utilisateur et spécifier une durée de bannissement, par exemple, @Famous-Tech }, { quoted: message });
    }
    await sock.groupRemove(from, [target]);
    await sock.sendMessage(from, { text: `@${target.split('@')[0]} a été banni pendant ${duration}.`, mentions: [target] }, { quoted: message });
    const milliseconds = parseDuration(duration);
    setTimeout(milliseconds).then(async () => {
      await sock.groupAdd(from, [target]);
      await sock.sendMessage(from, { text: `@${target.split('@')[0]} a été débanni et ajouté de nouveau au groupe`, mentions: [target] });
    });
  }
});

function parseDuration(duration) {
  const timeUnits = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
  };
  const unit = duration.slice(-1);
  const time = parseInt(duration.slice(0, -1));
  return time * timeUnits[unit];
                                             }
