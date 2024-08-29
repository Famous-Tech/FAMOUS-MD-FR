const { commands, Meta } = require('../lib/');
const { MessageType, WA_DEFAULT_EPHEMERAL } = require('@whiskeysockets/baileys');
const config = require('../config');
Meta({
  command: 'kick',
  category: 'group',
  handler: async (sock, message, args) => {
    const { from, sender, body } = message;
  
    const groupMetadata = await sock.groupMetadata(from);
    const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
    const isAdmin = admins.includes(sender);
    const isOwner = config.MODS.includes(sender);

    if (!isAdmin && !isOwner) {
      return sock.sendMessage(from, { text: '_Only admins can use this command_' }, { quoted: message });
    }

    const arg = body.trim().split('//').pop().trim();
    if (arg === 'all') {
     const participants = groupMetadata.participants.map(p => p.id);
      for (const participant of participants) {
        if (!admins.includes(participant) && participant !== sock.user.id) {
          await sock.groupParticipantsUpdate(from, [participant], 'remove');
        }
      }
      await sock.sendMessage(from, { text: 'All non-admin memb have been removed' }, { quoted: message });
    } else {
      const get_lost = arg.includes('@') ? arg : `${arg}@s.whatsapp.net`;
      if (!admins.includes(get_lost) && get_lost !== sock.user.id) {
        await sock.groupParticipantsUpdate(from, [get_lost], 'remove');
        await sock.sendMessage(from, { text: `${arg} *has been removed*` }, { quoted: message });
      } else {
        await sock.sendMessage(from, { text: '_You cannot *kick_the bot* itself_' }, { quoted: message });
      }
    }
  }
});

Meta({
  command: 'add',
  category: 'group',
  handler: async (sock, message, args) => {
    const { from, body, sender } = message;

    const groupMetadata = await sock.groupMetadata(from);
    const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
    const isAdmin = admins.includes(sender);
    const isOwner = config.MODS.includes(sender);
    if (!isAdmin && !isOwner) {
      return sock.sendMessage(from, { text: 'Only admins can use_this' }, { quoted: message });
    } const number = body.split(' ')[1];  //+27686881509
    if (!number) {
      return sock.sendMessage(from, { text: 'Please provide a number' }, { quoted: message });
  }const num_Jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
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
  handler: async (sock, message, args) => {
    const { key, from, isGroup } = message;
    const { remoteJid } = key;

  if (!isGroup) {
      return await sock.sendMessage(remoteJid, { text: '*[ERROR]* _Group_Command_' }, { quoted: message });
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
      return await sock.sendMessage(remoteJid, { text: 'No common numbers found in the group.' }, { quoted: message });
    }
    let naxor_ser = '*Common_Detected:*\n\n';
    common_num.forEach(number => {
      naxor_ser += `- ${number}\n`;
    });
    naxor_ser += '\n*Removing_these numbers...*';
    await sock.sendMessage(remoteJid, { text: naxor_ser }, { quoted: message });
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
  handler: async (sock, message, args) => {
    const { key, from, isGroup } = message;
    const { remoteJid } = key;
    const { participants, subject, desc, creation } = await sock.groupMetadata(from);
    
  if (!isGroup) return await sock.sendMessage(remoteJid, { text: '*[ERROR]* _🤣_' }, { quoted: message });
   const groupName = subject;
   const groupDesc = desc || 'No description';
    const  Count = participants.length;
     const creations = new Date(creation * 1000).toLocaleString();
     const GC_ID = remoteJid.split('@');
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

Meta({
  command: 'jids',
  category: 'group',
  handler: async (sock, message, args) => {
    try {
      const isGroup = message.key.remoteJid.endsWith('@g.us');
      if (!isGroup) {
        await sock.sendMessage(message.key.remoteJid, { text: '*This command can only be used in groups*' });
        return;
      }
      const groupMetadata = await sock.groupMetadata(message.key.remoteJid);
      const participants = groupMetadata.participants;
      const jids = participants.map((participant, index) => 
        `✨ *Member ${index + 1}:*\n🆔 *JID*: ${participant.id}\n`
      );
      const gc_name = groupMetadata.subject;
      const List = jids.join('\n');
      const messagez = `*📜 JID M: ${gc_name}*\n\n${List}\n*Total*: ${participants.length}`;
       await sock.sendMessage(message.key.remoteJid, { text: messagez });    
    } catch (error) {
      console.error(error);
        }
  }
});
          
Meta({
    command: 'join',
    category: 'owner',
    handler: async (sock, args, message, creator, author, isGroup) => {
        const { from } = message;
      if (isGroup) {
            return sock.sendMessage(from, { text: 'This command can only be used in private chat' });
        } if (!config.MODS.includes(author)) {
            return sock.sendMessage(from, { text: 'You are not allowed to use this cmd' });
           }
        if (args.length === 0) {
            return sock.sendMessage(from, { text: 'Please provide a group invite link' });
           }
        const str_invite = args[0];
        const get_code = str_invite.split('https://chat.whatsapp.com/')[1];
        if (!get_code) {
            return sock.sendMessage(from, { text: 'Please provide a valid group invite link' });
              }try {
          await sock.groupAcceptInvite(get_code);
            sock.sendMessage(from, { text: '*_Successfully_*' });
        } catch (error) {
            console.error(error);
                  }
         }
   });

Meta({
    command: 'tagall',
    category: 'group',
    handler: async (sock, args, message, isGroup, creator, author) => {
        const { from } = message;

        if (!config.MODS.includes(author)) {
            return sock.sendMessage(from, { text: 'You are not allowed to use this_cmd' });
        }     if (!isGroup) {
            return sock.sendMessage(from, { text: 'This command can only be used in a group' });
          } const groupMetadata = await sock.groupMetadata(from);
        const { participants } = groupMetadata;
        let tags = '';
        for (const participant of participants) {
            const { id } = participant;
            tags += `@${id.split('@')[0]} `;
        }  const tag_str = args.length > 0 ? args.join(' ') : '*Hello everyone*';
        const message_str = `
╭───────────◯
${tag_str}

${tags}
╰───────────◯\n*X-Astral*
       `;
        try {
            await sock.sendMessage(from, {
                text: message_str,
                mentions: participants.map(p => p.id),
            });
        } catch (error) {
            console.error(error);             
        }
    }
});

const getTimeUntil = (targetHour, targetMinute) => {
    const now = new Date();
    const target = new Date();
    target.setHours(targetHour, targetMinute, 0, 0);
    if (now > target) {
        target.setDate(target.getDate() + 1);
    }
    return target - now;
};
Meta({
    command: 'automute',
    category: 'group',
    handler: async (sock, args, message, creator, isGroup, author) => {
        const { from } = message;

        if (!config.MODS.includes(author)) {
            return sock.sendMessage(from, { text: 'You are not allowed to use this *cmd*' });
        }      if (!isGroup) {
            return sock.sendMessage(from, { text: '_This command can only be used in a group chat_' });
        }   if (args.length !== 4) {
            return sock.sendMessage(from, { text: 'Please provide mute and unmute times in the format: /automute HH MM HH MM *(e.g., /automute 22 00 07 30)*' });
        }
        const mute_hr = parseInt(args[0]);
        const mute_mun = parseInt(args[1]);
        const unmute_hr = parseInt(args[2]);
        const unmute_min = parseInt(args[3]);
        if (isNaN(mute_hr) || isNaN(mute_mun) || isNaN(unmute_hr) || isNaN(unmute_min)) {
            return sock.sendMessage(from, { text: 'Invalid time format: _Please provide numeric values for hours and minutes_' });
        }    const muteDelay = getTimeUntil(mute_hr, mute_mun);
        setTimeout(async () => {
            try {
                await sock.groupSettingUpdate(from, 'announcement');
                sock.sendMessage(from, { text: '🔇 *Group has been automatically muted*' });
            } catch (error) {
                console.error(error);
                    }
        }, muteDelay);
           const unmuteDelay = getTimeUntil(unmute_hr, unmute_min);
        setTimeout(async () => {
            try {
                await sock.groupSettingUpdate(from, 'not_announcement');
                sock.sendMessage(from, { text: '🔊 *Group has been automatically unmuted*' });
            } catch (error) {
                console.error(error);
                  }
        }, unmuteDelay);
        sock.sendMessage(from, { text: `Auto-mute has been set: _The group will be muted at ${mute_hr}:${mute_mun} and unmuted at ${unmute_hr}:${unmute_min}` });
    }
});
          
