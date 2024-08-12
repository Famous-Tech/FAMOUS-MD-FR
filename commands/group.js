const { commands, Meta } = require('../lib/');
const { MessageType, WA_DEFAULT_EPHEMERAL } = require('@whiskeysockets/baileys');

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

Meta({
  command: 'add',
  category: 'group',
  handler: async (sock, message, matched) => {
    const { from, body, sender } = message;

    const groupMetadata = await sock.groupMetadata(from);
    const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
    const isAdmin = admins.includes(sender);
    const isOwner = config.MODS.includes(sender);
    if (!isAdmin && !isOwner) {
      return sock.sendMessage(from, { text: 'Only admins can use_this' }, { quoted: message });
    }
    const number = body.split(' ')[1];  //+27686881509
    if (!number) {
      return sock.sendMessage(from, { text: 'Please provide a number' }, { quoted: message });
    }
    const num_Jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
     try {
        await sock.groupParticipantsUpdate(from, [num_Jid], 'add');
        await sock.sendMessage(from, { text: `${number} _added_` }, { quoted: message });
    } catch (error) {
        await sock.sendMessage(from, { text: `error` }, { quoted: message });
    }
  }
});

Meta({
  command: 'remove_common',
  category: 'group',
  handler: async (sock, message, matched) => {
    const { key, from, isGroup } = message[0];
    const { remoteJid } = key;

  if (!isGroup) {
      return await sock.sendMessage(remoteJid, { text: '*[ERROR]* _Group_Command_' }, { quoted: message[0] });
    }
    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;

    const Num_Jid = {};
    for (const participant of participants) {
      const number = participant.id.split('@')[0];
      if (Num_Jid[number]) {
        Num_Jid[number]++;
      } else {
        Num_Jid[number] = 1;
      }
    }

    const common_num = Object.keys(Num_Jid).filter(number => Num_Jid[number] > 1);
    if (common_num.length === 0) {
      return await sock.sendMessage(remoteJid, { text: 'No common numbers found in the group.' }, { quoted: message[0] });
    }
    let naxor_ser = '*Common_Detected:*\n\n';
    common_num.forEach(number => {
      naxor_ser += `- ${number}\n`;
    });
    naxor_ser += '\n*Removing_these numbers...*';

    await sock.sendMessage(remoteJid, { text: naxor_ser }, { quoted: message[0] });
    for (const number of common_num) {
      const part_psnts = participants.filter(p => p.id.startsWith(`${number}@`));
      for (const participant of part_psnts) {
        await sock.groupRemove(from, [participant.id]);
      }
    }
    }
});

Meta({
  command: 'ginfo',
  category: 'group',
  handler: async (sock, message, matched) => {
    const { key, from, isGroup } = message[0];
    const { remoteJid } = key;
    const { participants, subject, desc, creation } = await sock.groupMetadata(from);
    
  if (!isGroup) return await sock.sendMessage(remoteJid, { text: '*[ERROR]* _🤣_' }, { quoted: message[0] });
   const groupName = subject;
   const groupDesc = desc || 'No description';
    const  Count = participants.length;
     const creations = new Date(creation * 1000).toLocaleString();
     const GC_ID = remoteJid.split('@')[0];
    const info_r = [
        `╭───────────◯`,
        `├ *Name:* ${groupName}`,
        `│ *Members:* ${Count}`,
        `│ *Group_ID:* ${GC_ID} members`,
        `├───────────◯`,
        `│ *Desc:* ${groupDesc}`,
        `╰───────────◯`
    ].join('\n');

  const mentions = participants.map(p => p.id);
    const options = {
      contextInfo: {
        mentionedJid: mentions,
        forwardingScore: 999,
        isForwarded: true
      },
      quoted: message[0],
    };
    await sock.sendMessage(from, { text: info_r }, options);
  }
});
      
commands.push('kick', 
              'add', 
              'remove_common', 
              'ginfo');
      
