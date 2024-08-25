const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const P = require('pino');
const chalk = require('chalk');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const config = require('./config');
const { commands } = require('./lib/commands');
const { serialised, decodeJid } = require('./lib/serialize');
const { get_XP, set_XP, get_Level } = require('./lib/leveling_xp');

const SESSION_FILE = path.join(__dirname, 'auth_info_baileys', 'creds.json');
let action_add = true;
let action_remove = true;
let brainshop_private = config.BRAINSHOP_PRIVATE || false;

async function Connect_Session() {
    if (fs.existsSync(SESSION_FILE)) return;
    const sessionId = config.SESSION_ID.replace(/Socket;;;/g, "");
    let sessionData = sessionId;
    if (sessionId.length < 20) {
        const { data } = await axios.get(`https://privatebin.net/${sessionId}`);
        session = Buffer.from(data, 'base64').toString('utf8');
    }
    fs.writeFileSync(SESSION_FILE, session, 'utf8');
}

async function startBot() {
    await Connect_Session();
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FILE);
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.windows('Firefox'),
        auth: state,
        getMessage: async () => {
            return {
                conversation: 'owner is diego call me naxor'
            }
        }
    });
    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);
    const store = { contacts: {} };
    sock.ev.on('messages.update', async (update) => {
        for (let msg_pdate of update) {
            if (msg_pdate.key && msg_pdate.updateType === 'message-revoke') {
                const { remoteJid, participant } = msg_pdate.key;
                const org = msg_pdate.message;
                if (org) {
                    const Content_pdate = org.conversation || org.extendedTextMessage?.text;
                    const group_name = (await sock.groupMetadata(remoteJid)).subject;
                    const gender = store.contacts[participant]?.name || participant.split('@')[0];

                    if (Content_pdate) {
                        const anti_del = `🔴 *Anti-Delete Alert* 🔴\n\n` +
                            `👤 *Sender*: @${gender}\n` +
                            `⌚ *Time*: [${new Date().toLocaleString()}]`\n +
                            `📜 *Message*: ${Content_pdate}\n` +
                            `🚨 *Note*: Deleted`;

                        await sock.sendMessage(remoteJid, {
                            text: anti_del,
                            mentions: [participant]
                        });
                    }
                }
            }
        }
    });
    
    sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;
    const msg = await serialised(JSON.parse(JSON.stringify(m.messages[0])), m, sock);
    if (!msg.message) return;
    const messageMapping = {
        'conversation': () => msg.text,
        'imageMessage': () => msg.text,
        'videoMessage': () => msg.text,
        'extendedTextMessage': () => msg.text,
        'buttonsResponseMessage': () => m.message.buttonsResponseMessage.selectedButtonId,
        'listResponseMessage': () => m.message.listResponseMessage.singleSelectReply.selectedRowId,
        'templateButtonReplyMessage': () => m.message.templateButtonReplyMessage.selectedId
    };
    const msgType = msg.messageType;
    const body = messageMapping[msgType]?.() || '';
     const from = msg.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      if (isGroup) {
         const groupMetadata = await sock.groupMetadata(from);
         console.log(chalk.rgb(0, 255, 255)(`[${new Date().toLocaleString()}] Group: ${groupMetadata.subject}, Message: ${body}, Sender: ${msg.sender}`));
    if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.mentionedJid) {
      const mentionedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid;
      let thumbnail = './lib/media/default_img.png';
    try {
        thumbnail = await sock.profilePictureUrl(msg.sender, 'image');
      } catch (err) {
    }
    const audio_ptt = fs.readFileSync('./lib/media/audio.mp3');
    await sock.sendMessage(from, {
        audio: { url: './lib/media/audio.mp3' },
        mimetype: 'audio/mpeg',
        ptt: true,
        contextInfo: {
            externalAdReply: {
                title: '*_mentioned_x-astral_*',
                body: '*_notification_naxor_*',
                thumbnail: await axios.get(thumbnail, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data, 'binary')),
                mediaType: 2,
              }
          }
       }, { quoted: msg });

       }
            if (config.PER_ANTI) {
                const cd_code = body.match(/https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]{10,}/g);
                if (cd_code && !msg.key.fromMe) {
                    const group_code = groupMetadata.inviteCode;
                    const gc_code = `https://chat.whatsapp.com/${group_code}`;
                    const groupAdmins = groupMetadata.participants
                        .filter(participant => participant.admin !== null)
                        .map(admin => admin.id);
                    if (!groupAdmins.includes(msg.sender)) { 
                        if (cd_code[0] !== gc_code) {
                            const Mzg_code = `*<===Alert===>*\n\n` +
                                `@${msg.sender.split('@')[0]}: not_allowed\n\n` +
                                `🔗 *Link*: ${cd_code[0]}\n\n` +
                                `⚠️ *Note*: unauthorized links will lead to removal\n` +
                                `Adhere to gc_rules.`;                                   

                            await sock.sendMessage(from, { text: Mzg_code, mentions: [msg.sender] });
                            await sock.groupParticipantsUpdate(from, [msg.sender], 'remove');
                        }
                    }
                }
            }
        } else {
            console.log(chalk.rgb(0, 255, 255)(`[${new Date().toLocaleString()}] Chat: ${body}, Sender: ${msg.sender}`));
        }

        const isBotAdmin = msg.sender === sock.user.id;
        const mode_locked = config.MODS.includes(msg.sender);
        if (config.MODE === 'private') {
            if (!isBotAdmin && !mode_locked) return;
        }

        if (config.MODE === 'public' && command.fromMe && !isBotAdmin) {
            return;
        }
        const mention_cn = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.includes(sock.user.id);
        const rep = msg.message.extendedTextMessage?.contextInfo?.stanzaId && msg.message.extendedTextMessage.contextInfo.participant === sock.user.id;
        if (mention_cn || rep) {
            if (brainshop_private && !config.MODS.includes(msg.sender)) {
                return;
            }
            const uid = msg.sender.split('@')[0];
              const query = encodeURIComponent(body.trim());
                const res_cn = await axios.get(`http://api.brainshop.ai/get?bid=172352&key=vTmMboAxoXfsKEQQ&uid=${uid}&msg=${query}`);
                  const reply = res_cn.data.cnt;
            await sock.sendMessage(from, { text: reply }, { quoted: msg });
          }
        if (body.startsWith(config.PREFIX)) {
            if (body.startsWith(`${config.PREFIX}welcome true`)) {
                action_add = true;
                await sock.sendMessage(from, { text: 'Welcome_enabled' });
            } else if (body.startsWith(`${config.PREFIX}welcome false`)) {
                action_add = false;
                await sock.sendMessage(from, { text: 'Welcome_disabled' });
            } else if (body.startsWith(`${config.PREFIX}goodbye true`)) {
                action_remove = true;
                await sock.sendMessage(from, { text: 'Goodbye_enabled' });
            } else if (body.startsWith(`${config.PREFIX}goodbye false`)) {
                action_remove = false;
                await sock.sendMessage(from, { text: 'Goodbye_disabled' });
            }

            if (body.startsWith(`${config.PREFIX}eval`) || body.startsWith(`${config.PREFIX}$`) ||
                body.startsWith(`${config.PREFIX}>`) || body.startsWith(`${config.PREFIX}#`)) {
                const command_Type = body.charAt(config.PREFIX.length); 
                const code_Eval = body.slice(config.PREFIX.length + 2).trim();
                if (code_Eval === '') {
                    await sock.sendMessage(from, { text: 'Provide_code to evaluate Example: !eval 2 + 2' });
                    return;
                }

                if (msg.sender === sock.user.id || config.MODS.includes(msg.sender)) {
                    try {
                        const timeout = 5000;
                        let result;
                         const compile_cd = new Promise((resolve, reject) => {
                            try {
                                result = eval(code_Eval);
                                resolve(result);
                            } catch (error) {
                                reject(error);
                            }
                        });

                        result = await Promise.race([
                            compile_cd,
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), timeout))
                        ]);

                        const output = typeof result === 'string' ? result : require('util').inspect(result);
                        const trimmed = output.length > 2000 ? `${output.slice(0, 2000)}...` : output;

                        await sock.sendMessage(from, { text: `*OUTPUT*:\n${trimmed}` });
                    } catch (error) {
                        await sock.sendMessage(from, { text: `${error.message}` });
                    }
                }
            }
         if (body.startsWith(config.PREFIX)) {
         const cmd_str = body.slice(config.PREFIX.length).trim().split(' ')[0];
         const command = commands.find(cmd => cmd.command === cmd_str);
         if (command) {
            const args = body.slice(config.PREFIX.length + cmd_str.length).trim().split(' ');
            try {
                await command.handler({sock, msg,args,isGroup,groupMetadata, mentionedJid,groupAdmins
                    command: cmd_str,
                });
            } catch (error) {}
        } else {
       }
          }
      });
        const wats_user = msg.sender;
        const user_XP = get_XP(wats_user);
        const new_XP = user_XP + 10; 
        set_XP(wats_user, newXP);

        const new_level = get_Level(new_XP);
        const bofore = get_Level(user_XP);

        if (new_level > before) {
            const get_image = await sock.profilePictureUrl(wats_user, 'image');
            const profile_pic = get_image || 'https://www.freepik.com/premium-vector/people-icon-person-symbol-vector-illustration_34470101.htm#query=blank%20profile&position=9&from_view=keyword&track=ais_hybrid&uuid=679974d4-3b6a-42c2-b807-b313d389fd87';
            const message_cap = 
                `🌟 *Level Up* 🌟\n` +
                `╭─────\n` +
                `│ *Congrats*: @${wats_user.split('@')[0]}\n` +
                `│ *Youve_reached:${new_level}*\n` +
                `│ *Keep_up* 💪\n` +
                `╰─────`;
            await sock.sendMessage(from, { image: { url: profile_pic }, caption: message_cap, mentions: [msg.sender] });
            }
        });
          if (body.startsWith(`${config.PREFIX}mute`)) {
                if (!isGroup) {
                    await sock.sendMessage(from, { text: 'This command can only be used in groups' });
                    return;
                }
                const isAdmin = groupMetadata.participants.some(participant => participant.id === msg.sender && participant.admin !== null);
                const isBotAdmin = msg.sender === sock.user.id;
                const mode_locked = config.MODS.includes(msg.sender);

                if (!isBotAdmin && !mode_locked && !isAdmin) {
                    await sock.sendMessage(from, { text: '*_You need to be an admin to use this command_*' });
                    return;
                }

                const args = body.split(' ');
                const mute_dt = parseInt(args[1]);
                if (isNaN(mute_dt) || mute_dt <= 0) {
                    await sock.sendMessage(from, { text: 'Specify a valid duration in minutes' });
                    return;
                }

                const announcement_dt = 'announcement';
                const mute_ms = mute_dt * 60000;
                try {
                    await sock.groupUpdate(from, { 
                        announcement: announcement_dt,
                        mute: mute_ms
                    });
                    await sock.sendMessage(from, { text: `*Group muted*: ${args[1]} *_minutes_*` });
                } catch (error) {
                  }
            } else if (body.startsWith(`${config.PREFIX}unmute`)) {
                if (!isGroup) {
                    await sock.sendMessage(from, { text: 'This command can only be used in groups' });
                    return;
                }
                const isAdmin = groupMetadata.participants.some(participant => participant.id === msg.sender && participant.admin !== null);
                const isBotAdmin = msg.sender === sock.user.id;
                const mode_locked = config.MODS.includes(msg.sender);

                if (!isBotAdmin && !mode_locked && !isAdmin) {
                    await sock.sendMessage(from, { text: '*_You need to be an admin to use this command_*' });
                    return;
                }
                try {
                    await sock.groupUpdate(from, { 
                        announcement: 'not_announcement',
                        mute: 0 
                    });
                    await sock.sendMessage(from, { text: '*Group unmuted*' });
                } catch (error) {
                }
            }
    
    }
    });

   sock.ev.on('group-participants.update', async (event) => {
        const { id, participants, action } = event;
        const groupMetadata = await sock.groupMetadata(id);
        const groupName = groupMetadata.subject;
        const time = new Date().toLocaleString();

        for (let participant of participants) {
            const name = participant.split('@')[0];
            let message;
            if (action === 'add' && action_add) {
                message = `┌────\n` +
                 `│ 👋 *Welcome* @${name}\n` +
                 `│ 🏡 *Group*: ${groupName}\n` +
                 `│ 🕒 *Time*: ${time}\n` +
                 `│ 🤗 *We are excited X3*\n` +
                 `└─────────────┘`;
                console.log(chalk.rgb(0, 255, 0)(`[${time}] ${groupName}: @${name}`));
            } else if (action === 'remove' && action_remove) {
                message = `┌────\n` +
                 `│ 😔 *Goodbye*, @${name}\n` +
                 `│ 🏡 *Group*: ${groupName}\n` +
                 `│ 🕒 *Time*: ${time}\n` +
                 `│ 💔 *Will be missed*\n` +
                 `└─────────────┘`;
            }

            await sock.sendMessage(id, { text: message, mentions: [participant] });
        }
    });

    sock.ev.on('contacts.update', async (update) => {
        for (let contact of update) {
            let id = decodeJid(contact.id);

            if (store && store.contacts) {
                store.contacts[id] = {
                    id,
                    name: contact.notify || 'No Name',
                };
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode === DisconnectReason.loggedOut) {
                console.log(chalk.red('Connection closed => Logged out'));
            } else {
                console.log(chalk.red('Connection closed => Reconnecting...'));
                startBot();
            }
        } else if (connection === 'open') {
            console.log(chalk.magenta('_Connected_'));
        }
    });
}

sock.ev.on('call', async (update) => {
    const { id, from, isVideo, isGroupCall } = update;
    if (isGroupCall) return;
    try {
        await sock.updateBlockStatus(from, 'block');
    } catch (error) {
    }
});

startBot();       
