const { commands, Meta } = require('../lib/');

Meta({
  command: 'kick',
  category: 'group',
  handler: async (sock, message, matched) => {
    const { from, sender, body } = message;
  
    const groupMetadata = await sock.groupMetadata(from);
    const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
    const isAdmin = admins.includes(sender);
    const isOwner = config.MODS.includes(sender);

    if (!isAdmin && !isOwner) {
      return sock.sendMessage(from, { text: '_Only admins can use this command_' }, { quoted: message });
    }

    const args = body.trim().split('//').pop().trim();
    if (args === 'all') {
     const participants = groupMetadata.participants.map(p => p.id);
      for (const participant of participants) {
        if (!admins.includes(participant) && participant !== sock.user.id) {
          await sock.groupParticipantsUpdate(from, [participant], 'remove');
        }
      }
      await sock.sendMessage(from, { text: 'All non-admin memb have been removed' }, { quoted: message });
    } else {
      const get_lost = args.includes('@') ? args : `${args}@s.whatsapp.net`;
      if (!admins.includes(get_lost) && get_lost !== sock.user.id) {
        await sock.groupParticipantsUpdate(from, [get_lost], 'remove');
        await sock.sendMessage(from, { text: `${args} *has been removed*` }, { quoted: message });
      } else {
        await sock.sendMessage(from, { text: '_You cannot *kick_the bot* itself_' }, { quoted: message });
      }
    }
  }
});

commands.push('kick');
      
