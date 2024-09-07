const { commands, Meta } = require('../lib/');
const { MessageType, WA_DEFAULT_EPHEMERAL } = require('@whiskeysockets/baileys');
const config = require('../config');
Meta({
  command: 'kick',
  category: 'group',
  handler: async (sock, message, args, author) => {
    const { from, sender, body } = message;
  
    const groupMetadata = await sock.groupMetadata(from);
    const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
    const isAdmin = admins.includes(author);
    const isOwner = config.MODS.includes(author);

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
  handler: async (sock, message, args, author) => {
    const { from, body } = message;

    const groupMetadata = await sock.groupMetadata(from);
    const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
    const isAdmin = admins.includes(author);
    const isOwner = config.MODS.includes(author);
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
  handler: async (sock, message, isGroup, args) => {
    const { key, from  } = message;
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
  handler: async (sock, message, isGroup, args) => {
    const { key, from } = message;
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
          
Meta({
  command: 'online_mem',
  category: 'group',
  handler: async (sock, message) => {
    const { from } = message;

    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;
    const x_astral_s = participants.map(p => p.id);
    const msg_map = new Map();
    const mule_donkey = async (ids) => {
      const presence_up = await Promise.all(ids.map(id => sock.presenceSubscribe(id)));
      presence_up.forEach(update => {
        msg_arg.set(update.id, update.status === 'available');
      });
    }; const batchSize = 10;
    for (let i = 0; i < x_astral_s.length; i += batchSize) {
      const batch = x_astral_s.slice(i, i + batchSize);
      await mule_donkey(batch);
    }
    const meander_neck = [];
    const exotic = [];
    participants.forEach(participant => {
      const online = msg_map.get(participant.id);
      const ex_arg = participant.id.split('@')[0];
       if(online) {
        meander_neck.push(`🟢 ${ex_arg}`);
      } else {
        exotic.push(`🔴 ${ex_arg}`);
      }
    });
    const caption = 
      '*Group: ' + groupMetadata.subject + '*\n' + '\n' +
      '*🟢 Online Mems:*\n' + 
      (meander_neck.length > 0 ? meander_neck.join('\n') : 'None') + '\n' + '\n' +
      '*🔴 Offline Mems:*\n' + 
      (exotic.length > 0 ? exotic.join('\n') : '_All_membs are online_') + '\n';
    await sock.sendMessage(from, { text: caption });
  }
});   

const moment = require('moment');
Meta({
    command: 'group_stats',
    category: 'group',
    handler: async (sock, message, args, author) => {
        const { from } = message;
      let msg_log = {};
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;
        let gc_icon = await sock.profilePictureUrl(from, 'image').catch(() => null);
        if (!msg_log[from]) {
            msg_log[from] = [];
        }
        let msgz = {};
        let emails = {};
        for (let participant of participants) {
            const jid = participant.id;
            msgz[jid] = 0;
            emails[jid] = [];
        }
        msg_log[from].forEach(log => {
            if (msgz[log.jid] !== undefined) {
                msgz[log.jid]++;
                emails[log.jid].push(log.timestamp);
            }
        });
        let active_hrs = Object.keys(msgz)
            .map(jid => ({ jid, count: msgz[jid] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        let Stamps = Object.values(emails).flat();
        let msoon = {};
         Stamps.forEach(ts => {
            let hour = moment(ts).format('HH');
            if (!msoon[hour]) {
                msoon[hour] = 0;
            }
            msoon[hour]++;
        });
        let most_gays = Object.keys(msoon).sort((a, b) => msoon[b] - msoon[a])[0];
        let most_dicks = `${most_gays}:00 - ${parseInt(most_gays) + 1}:00`;
        let stats = `*📊 Group Stats: ${groupMetadata.subject} 📊*\n\n`;
        stats += `*🔵 Total Members:* ${participants.length}\n`;
        stats += `*💬 Total Messages_S:* ${msg_log[from].length}\n\n`;
        stats += `*🥇 Most Active Members:*\n`;
        for (let i = 0; i < active_hrs.length; i++) {
            let rank = ['🥇', '🥈', '🥉'][i];
            let name = participants.find(p => p.id === active_hrs[i].jid).notify || active_hrs[i].jid.split('@')[0];
            stats += `${rank} ${name} - ${active_hrs[i].count} messages\n`;
        }
        stats += `\n*🕒 Most Active Time:*\n${most_dicks}`;
        await sock.sendMessage(from, {
            caption: stats,
            image: { url: gc_icon }
        });
    }
});

const logMessage = (groupJid, partJid) => {
    if (!msg_log[groupJid]) {
        msg_log[groupJid] = [];
    }
    msg_log[groupJid].push({
        jid: partJid,
        timestamp: new Date()
    });
};
sock.on('message-new', async (message) => {
    const from = message.key.remoteJid;
    const participant = message.participant || message.key.participant || message.key.remoteJid;
    logMessage(from, participant);
});

Meta({
    command: 'admin_list',
    category: 'group',
    handler: async (sock, message) => {
        const { from } = message;
        const groupMetadata = await sock.groupMetadata(from);
        const admins = groupMetadata.participants.filter(participant => participant.admin);
        let adminz = '*Group Admins:* \n\n';
        admins.forEach(admin => {
            adminz += `@${admin.id.split('@')[0]}\n`;
        });
        await sock.sendMessage(from, {
            text: adminz,
            mentions: admins.map(admin => admin.id)
        });
    }
});

Meta({
    command: 'set_daily',
    category: 'group',
    handler: async (sock, message, args) => {
        const { from, participant } = message;
        const isAdmin = participant.isAdmin;
        morning_str = args[0] || '07:00'; 
        night_str = args[1] || '22:00'; 
        if (!isAdmin) {
            return sock.sendMessage(from, { text: 'Only admins can use this command' });
        }
        await sock.sendMessage(from, { text: `Daily message set` });
    }
});

Meta({
    command: 'clear_msg',
    category: 'group',
    handler: async (sock, message) => {
        const { from, participant } = message;
        const isAdmin = participant.isAdmin;
        if (!isAdmin) {
            return sock.sendMessage(from, { text: 'Only admins can use this command' });
        }
        morning_str = null;
        night_str = null;
        await sock.sendMessage(from, { text: 'Daily messages cleared' });
    }
});

sock.ev.on('messages.upsert', async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const axios = require('axios');
    const QUOTE_API = 'https://api.quotable.io/random';
  
    if (morning_str && `${hour}:${minute}` === morning_str) {
        axios.get(QUOTE_API)
            .then(async (response) => {
                const { content, author } = response.data;
                const quote = `"${content}" - ${author}`;
                await sock.sendMessage(from, {
                    image: { url: 'image.jpg' },
                    caption: `Good morning everyone 🌞\n\n${quote}`
                });
            })
            .catch(() => {
                sock.sendMessage(from, { text: '*Good morning everyone 🌞*\n\nStay positive and keep moving forward' });
            });
    }

    if (night_str && `${hour}:${minute}` === night_str) {
        axios.get(QUOTE_API_URL)
            .then(async (response) => {
                const { content, author } = response.data;
                const quote = `"${content}" - ${author}`;
                await sock.sendMessage(from, {
                    image: { url: 'image.jpg' },
                    caption: `Good night everyone 🌙\n\n${quote}`
                });
            })
            .catch(() => {
                sock.sendMessage(from, { text: 'Good night everyone 🌙\n\nRest well and recharge' });
            });
    }
});
