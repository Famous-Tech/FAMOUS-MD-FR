const { commands, Meta } = require('../lib/');
const { MessageType, WA_DEFAULT_EPHEMERAL } = require('@whiskeysockets/baileys');
const config = require('../config');
Meta({
  command: 'kick',
  category: 'groupe',
  handler: async (sock, message, args, author) => {
    const { from, body } = message;
  
    const groupMetadata = await sock.groupMetadata(from);
    const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
    const isAdmin = admins.includes(author);
    const isOwner = config.MODS.includes(author);
    if (!isAdmin && !isOwner) {
      return sock.sendMessage(from, { text: '_Seuls les admins peuvent utiliser cette commande_' }, { quoted: message });
    } const arg = body.trim().split('//').pop().trim();
    if (arg === 'all') {
     const participants = groupMetadata.participants.map(p => p.id);
      for (const participant of participants) {
        if (!admins.includes(participant) && participant !== sock.user.id) {
          await sock.groupParticipantsUpdate(from, [participant], 'remove');
        }
      } await sock.sendMessage(from, { text: 'Tous les membres non-admins ont été retirés' }, { quoted: message });
    } else {
      const get_lost = arg.includes('@') ? arg : `${arg}@s.whatsapp.net`;
      if (!admins.includes(get_lost) && get_lost !== sock.user.id) {
        await sock.groupParticipantsUpdate(from, [get_lost], 'remove');
        await sock.sendMessage(from, { text: `${arg} *a été retiré*` }, { quoted: message });
      } else {
        await sock.sendMessage(from, { text: '_Vous ne pouvez pas *expulser le bot* lui-même_' }, { quoted: message });
      }
    }
  }
});

Meta({
  command: 'add',
  category: 'groupe',
  handler: async (sock, message, args, author) => {
    const { from, body } = message;

    const groupMetadata = await sock.groupMetadata(from);
    const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
    const isAdmin = admins.includes(author);
    const isOwner = config.MODS.includes(author);
    if (!isAdmin && !isOwner) {
      return sock.sendMessage(from, { text: 'Seuls les admins peuvent utiliser cette commande' }, { quoted: message });
    } const number = body.split(' ')[1];  //+50943782508 
    if (!number) {
      return sock.sendMessage(from, { text: 'Veuillez fournir un numéro' }, { quoted: message });
  }const num_Jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
     try {
        await sock.groupParticipantsUpdate(from, [num_Jid], 'add');
        await sock.sendMessage(from, { text: `${number} *a été ajouté*` }, { quoted: message });
    } catch (error) {
        await sock.sendMessage(from, { text: `erreur` }, { quoted: message });
    }
  }
});

Meta({
  command: 'remove_common',
  category: 'groupe',
  handler: async (sock, message, isGroup, args) => {
    const { key, from  } = message;
    const { remoteJid } = key;

  if (!isGroup) {
      return await sock.sendMessage(remoteJid, { text: '*[ERREUR]* _Commande de groupe_' }, { quoted: message });
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
      return await sock.sendMessage(remoteJid, { text: 'Aucun numéro commun trouvé dans le groupe.' }, { quoted: message });
    } let naxor_ser = '*Numéros communs détectés:*\n\n';
    common_num.forEach(number => {
      naxor_ser += `- ${number}\n`;
    });
    naxor_ser += '\n*Suppression de ces numéros...*';
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
  category: 'groupe',
  handler: async (sock, message, isGroup, args) => {
    const { key, from } = message;
    const { remoteJid } = key;
    const { participants, subject, desc, creation } = await sock.groupMetadata(from);
    
  if (!isGroup) return await sock.sendMessage(remoteJid, { text: '*[ERREUR]* _🤣_' }, { quoted: message });
   const groupName = subject;
   const groupDesc = desc || 'Aucune description';
    const  Count = participants.length;
     const creations = new Date(creation * 1000).toLocaleString();
     const GC_ID = remoteJid.split('@');
    const info_r = [
        `╭───────────◯`,
        `├ *Nom:* ${groupName}`,
        `│ *Membres:* ${Count}`,
        `│ *ID du groupe:* ${GC_ID} membres`,
        `├───────────◯`,
        `│ *Description:* ${groupDesc}`,
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
  category: 'groupe',
  handler: async (sock, message, args) => {
    try {
      const isGroup = message.key.remoteJid.endsWith('@g.us');
      if (!isGroup) {
        await sock.sendMessage(message.key.remoteJid, { text: '*Cette commande ne peut être utilisée que dans les groupes*' });
        return;
      }
      const groupMetadata = await sock.groupMetadata(message.key.remoteJid);
      const participants = groupMetadata.participants;
      const jids = participants.map((participant, index) => 
        `✨ *Membre ${index + 1}:*\n🆔 *JID*: ${participant.id}\n`
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
    category: 'propriétaire',
    handler: async (sock, args, message, creator, author, isGroup) => {
        const { from } = message;
      if (isGroup) {
            return sock.sendMessage(from, { text: 'Cette commande ne peut être utilisée que dans un chat privé' });
        } if (!config.MODS.includes(author)) {
            return sock.sendMessage(from, { text: 'Vous n\'êtes pas autorisé à utiliser cette commande' });
           }
        if (args.length === 0) {
            return sock.sendMessage(from, { text: 'Veuillez fournir un lien d\'invitation de groupe' });
           }
        const str_invite = args[0];
        const get_code = str_invite.split('https://chat.whatsapp.com/')[1];
        if (!get_code) {
            return sock.sendMessage(from, { text: 'Veuillez fournir un lien d\'invitation de groupe valide' });
              }try {
          await sock.groupAcceptInvite(get_code);
            sock.sendMessage(from, { text: '*_Réussi_*' });
        } catch (error) {
            console.error(error);
                  }
         }
   });

Meta({
    command: 'tagall',
    category: 'groupe',
    handler: async (sock, args, message, isGroup, creator, author) => {
        const { from } = message;

        if (!config.MODS.includes(author)) {
            return sock.sendMessage(from, { text: 'Vous n\'êtes pas autorisé à utiliser cette commande' });
        }     if (!isGroup) {
            return sock.sendMessage(from, { text: 'Cette commande ne peut être utilisée que dans un groupe' });
          } const groupMetadata = await sock.groupMetadata(from);
        const { participants } = groupMetadata;
        let tags = '';
        for (const participant of participants) {
            const { id } = participant;
            tags += `@${id.split('@')[0]} `;
        }  const tag_str = args.length > 0 ? args.join(' ') : '*_Salut à tous🙂😏_*';
        const message_str = `
╭───────────◯
${tag_str}

${tags}
╰───────────◯\n*FAMOUS-MD*
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
    category: 'groupe',
    handler: async (sock, args, message, creator, isGroup, author) => {
        const { from } = message;

        if (!config.MODS.includes(author)) {
            return sock.sendMessage(from, { text: 'Vous n\'êtes pas autorisé à utiliser cette commande' });
        }      if (!isGroup) {
            return sock.sendMessage(from, { text: '_Cette commande ne peut être utilisée que dans un groupe_' });
        }   if (args.length !== 4) {
            return sock.sendMessage(from, { text: 'Veuillez fournir les heures de mute et de démute au format: /automute HH MM HH MM *(par exemple, /automute 22 00 07 30)*' });
        }
        const mute_hr = parseInt(args[0]);
        const mute_mun = parseInt(args[1]);
        const unmute_hr = parseInt(args[2]);
        const unmute_min = parseInt(args[3]);
        if (isNaN(mute_hr) || isNaN(mute_mun) || isNaN(unmute_hr) || isNaN(unmute_min)) {
            return sock.sendMessage(from, { text: 'Format d\'heure invalide: _Veuillez fournir des valeurs numériques pour les heures et les minutes_' });
        }    const muteDelay = getTimeUntil(mute_hr, mute_mun);
        setTimeout(async () => {
            try {
                await sock.groupSettingUpdate(from, 'announcement');
                sock.sendMessage(from, { text: '🔇 *Le groupe a été automatiquement mis en sourdine*' });
            } catch (error) {
                console.error(error);
                    }
        }, muteDelay);
           const unmuteDelay = getTimeUntil(unmute_hr, unmute_min);
        setTimeout(async () => {
            try {
                await sock.groupSettingUpdate(from, 'not_announcement');
                sock.sendMessage(from, { text: '🔊 *Le groupe a été automatiquement démuté*' });
            } catch (error) {
                console.error(error);
                  }
        }, unmuteDelay);
        sock.sendMessage(from, { text: `Auto-mute défini: _Le groupe sera mis en sourdine à ${mute_hr}:${mute_mun} et démuté à ${unmute_hr}:${unmute_min}` });
    }
});
          
Meta({
  command: 'online_mem',
  category: 'groupe',
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
      '*Groupe: ' + groupMetadata.subject + '*\n' + '\n' +
      '*🟢 Membres en ligne:*\n' + 
      (meander_neck.length > 0 ? meander_neck.join('\n') : 'Aucun') + '\n' + '\n' +
      '*🔴 Membres hors ligne:*\n' + 
      (exotic.length > 0 ? exotic.join('\n') : '_Tous les membres sont en ligne_') + '\n';
    await sock.sendMessage(from, { text: caption });
  }
});   

const moment = require('moment');
Meta({
    command: 'group_stats',
    category: 'groupe',
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
        let stats = `*📊 Statistiques du groupe: ${groupMetadata.subject} 📊*\n\n`;
        stats += `*🔵 Total des membres:* ${participants.length}\n`;
        stats += `*💬 Total des messages envoyés:* ${msg_log[from].length}\n\n`;
        stats += `*🥇 Membres les plus actifs:*\n`;
        for (let i = 0; i < active_hrs.length; i++) {
            let rank = ['🥇', '🥈', '🥉'][i];
            let name = participants.find(p => p.id === active_hrs[i].jid).notify || active_hrs[i].jid.split('@')[0];
            stats += `${rank} ${name} - ${active_hrs[i].count} messages\n`;
        }
        stats += `\n*🕒 Heure la plus active:*\n${most_dicks}`;
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
    category: 'groupe',
    handler: async (sock, message) => {
        const { from } = message;
        const groupMetadata = await sock.groupMetadata(from);
        const admins = groupMetadata.participants.filter(participant => participant.admin);
        let adminz = '*Admins du groupe:* \n\n';
        admins.forEach(admin => {
            adminz += `@${admin.id.split('@')[0]}\n`;
        });
        await sock.sendMessage(from, {
            text: adminz,
            mentions: admins.map(admin => admin.id)
        });
    }
});

const axios = require('axios');
function xastralh(){const A=['2836944MwbMKo','720286viojka','60aWTXwX','Bonjour tout le monde 🌞','2197305QZEaSz','75640ckGhLb','1919976hjHSCb','170228ltAYZK','5230008OTdASr','https://api.quotable.io/random','24uKHBGZ'];xastralh=function(){return A;};return xastralh();}function xastrall(h,l){const a=xastralh();return xastrall=function(o,r){o=o-0x131;let L=a[o];return L;},xastrall(h,l);}const xastralc=xastrall;(function(h,l){const L=xastrall,a=h();while(!![]){try{const o=parseInt(L(0x131))/0x1*(parseInt(L(0x136))/0x2)+-parseInt(L(0x13b))/0x3+-parseInt(L(0x133))/0x4*(parseInt(L(0x139))/0x5)+parseInt(L(0x134))/0x6+-parseInt(L(0x138))/0x7+-parseInt(L(0x132))/0x8+parseInt(L(0x137))/0x9;if(o===l)break;else a['push'](a['shift']());}catch(r){a['push'](a['shift']());}}}(xastralh,0x7c286));const QUOTE_API=xastralc(0x135);let morning_str=null,night_str=null,morning_msg=xastralc(0x13a),night_msg='Bonne nuit tout le monde 🌙';
Meta({
    command: 'set_daily',
    category: 'groupe',
    handler: async (sock, message, args) => {
        const { from, participant } = message;
        const isAdmin = participant.isAdmin;
        if (!isAdmin) {
            return sock.sendMessage(from, { text: 'Seuls les admins peuvent utiliser cette commande' });
        }     if (args.length < 2) {
            return sock.sendMessage(from, { text: 'utilisation: *set_daily* <heure_matin> <heure_soir> [message_matin] [message_soir]' });
        }

        morning_str = args[0];
        night_str = args[1]; 

        morning_msg = args[2] || morning_msg; 
        night_msg = args[3] || night_msg; 

        await sock.sendMessage(from, { text: `Messages quotidiens définis:\n- Matin à ${morning_str}: "${morning_msg}"\n- Soir à ${night_str}: "${night_msg}"` });
    }
});

Meta({
    command: 'clear_msg',
    category: 'groupe',
    handler: async (sock, message) => {
        const { from, participant } = message;
        const isAdmin = participant.isAdmin;

        if (!isAdmin) {
            return sock.sendMessage(from, { text: 'Seuls les admins peuvent utiliser cette commande' });
        }
        function xastralh(){var A=['87TaNkro','1530496lsgGGL','59863OXTPXR','225228OsRSMn','253nfCyDg','19315mzyKkd','6BngyKD','140HQucVl','1524439ukvhWx','Bonne nuit tout le monde 🌙','150ehdNHh','Bonjour tout le monde 🌞','31668nPNxOH','111906wBTMIU'];xastralh=function(){return A;};return xastralh();}function xastrall(h,l){var a=xastralh();return xastrall=function(o,r){o=o-0x113;var L=a[o];return L;},xastrall(h,l);}var xastralc=xastrall;(function(h,l){var L=xastrall,a=h();while(!![]){try{var o=-parseInt(L(0x11a))/0x1*(-parseInt(L(0x11e))/0x2)+-parseInt(L(0x118))/0x3*(-parseInt(L(0x116))/0x4)+parseInt(L(0x11d))/0x5*(-parseInt(L(0x114))/0x6)+parseInt(L(0x120))/0x7+parseInt(L(0x119))/0x8+parseInt(L(0x117))/0x9*(-parseInt(L(0x11f))/0xa)+-parseInt(L(0x11c))/0xb*(parseInt(L(0x11b))/0xc);if(o===l)break;else a['push'](a['shift']());}catch(r){a['push'](a['shift']());}}}(xastralh,0x1c4dd),morning_str=null,night_str=null,morning_msg=xastralc(0x115),night_msg=xastralc(0x113));
        await sock.sendMessage(from, { text: 'Messages quotidiens effacés' });
    }
});

sock.ev.on('messages.upsert', async () => {
    const xastralc=xastrall;(function(h,l){const L=xastrall,a=h();while(!![]){try{const o=-parseInt(L(0x16a))/0x1*(parseInt(L(0x167))/0x2)+-parseInt(L(0x16d))/0x3*(parseInt(L(0x16e))/0x4)+-parseInt(L(0x16b))/0x5+parseInt(L(0x16f))/0x6+parseInt(L(0x166))/0x7*(-parseInt(L(0x172))/0x8)+parseInt(L(0x168))/0x9+parseInt(L(0x171))/0xa;if(o===l)break;else a['push'](a['shift']());}catch(r){a['push'](a['shift']());}}}(xastralh,0x88f37));function xastrall(h,l){const a=xastralh();return xastrall=function(o,r){o=o-0x166;let L=a[o];return L;},xastrall(h,l);}const now=new Date(),hour=now['getHours']()[xastralc(0x16c)]()[xastralc(0x169)](0x2,'0'),minute=now[xastralc(0x170)]()[xastralc(0x16c)]()[xastralc(0x169)](0x2,'0'),cur_str=hour+':'+minute;function xastralh(){const A=['8oePcDj','1817753cOHxyd','32GYxSWa','2294289wDOoMM','padStart','56522IjTpsX','43585HJKejn','toString','337569WpEGcf','16fzWIBo','3000612xrCLqm','getMinutes','14287680kCffdj'];xastralh=function(){return A;};return xastralh();}
    if (morning_str && cur_str === morning_str) {
        try {
            const response = await axios.get(QUOTE_API);
            const { content, author } = response.data;
            const quote = `"${content}" - ${author}`;
            await sock.sendMessage(from, {
                image: { url: 'https://ik.imagekit.io/eypz/1725719155620_rvfPmh1lL.png' },
                caption: `*${morning_msg}*\n\n${quote}`
            });
        } catch (error) {
            await sock.sendMessage(from, {
                image: { url: 'https://ik.imagekit.io/eypz/1725719155620_rvfPmh1lL.png' },
                caption: `*${morning_msg}*\n\nRestez positif et continuez d'avancer`
            });
        }
    }

    if (night_str && cur_str === night_str) {
        try {
            const response = await axios.get(QUOTE_API);
            const { content, author } = response.data;
            const quote = `"${content}" - ${author}`;
            await sock.sendMessage(from, {
                image: { url: 'https://ik.imagekit.io/eypz/1725719170035_t13SGIUYv.png' },
                caption: `*${night_msg}*\n\n${quote}`
            });
        } catch (error) {
            await sock.sendMessage(from, {
                image: { url: 'https://ik.imagekit.io/eypz/1725719170035_t13SGIUYv.png' },
                caption: `*${night_msg}*\n\nReposez-vous bien et rechargez-vous`
            });
        }
    }
});

Meta({
  command: 'warn',
  category: 'groupes',
  handler: async (sock, message, args, isGroup, author) => {
    if (!isGroup) return; 

    const { from } = message;
    const pushname = args[0]; 
    const reason = args.slice(1).join(' ') || '*Aucune raison*';
    const to_three = 3; 
    if (!pushname) {
      await sock.sendMessage(from, { text: 'spécifiez un utilisateur à avertir*' });
      return;
    }   const pikachu = await WeAreGays(sock, from, pushname);
    const count = pikachu + 1;
    await sock.sendMessage(from, {
      text: `┏━━━━━━━━━━━━━━━━━━━━━┓\n` +
            `┃      ⚠️ *Avertissement* ⚠️     \n` +
            `┣━━━━━━━━━━━━━━━━━━━━━┫\n` +
            `┃ *▢ Numéro:* ${pushname}\n` +
            `┃ *▢ Nom:* ${pushname}\n` +
            `┃ *▢ Compteur:* ${count}/${to_three}\n` +
            `┃ *▢ Raison:* ${reason}\n` +
            `┗━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
            `┏━━━━━━━━━━━━━━━━━━━━━┓\n` +
            `┃ *Veuillez être prudent*\n` +
            `┗━━━━━━━━━━━━━━━━━━━━━┛`
    });
    if (count >= to_three) {
      await sock.groupParticipantsUpdate(from, [pushname], 'remove');
      await sock.sendMessage(from, { text: `*${pushname} a été retiré limite d’avertissement atteint*` });
    }
  }
});

async function WeAreGays(sock, gcID, pushNama) {
  let count = 0;
  const history = await sock.fetchMessages(gcID, { limit: 50 });
  history.forEach(msg => {
    if (msg.message && msg.message.conversation) {
      const content = msg.message.conversation;
      if (content.includes(`▢ Numéro: ${pushNama}`) && content.includes('⚠️ *Avertissement* ⚠️')) {
        count += 1;
      }
    }
  });
  return count;
        }
