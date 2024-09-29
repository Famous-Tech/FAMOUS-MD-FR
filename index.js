const { default: makeWASocket, useMultiFileAuthState, makeInMemoryStore, fetchLatestBaileysVersion, PHONENUMBER_MCC } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const config = require('./config');
const { languages } = require('./data_store/languages.js');
const { commands } = require('./lib/commands');
const { serialised, decodeJid } = require('./lib/serialize');
const { get_XP, set_XP, get_Level } = require('./lib/leveling_xp');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);

    const bot = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: state.keys,
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            let jid = key.remoteJid;
            let msg = await store.loadMessage(jid, key.id);
            return msg?.message || "";
        },
    });

    // Définir store ici
    const store = makeInMemoryStore({
        logger: P({ level: 'silent' })
    });

    store.bind(bot.ev);

    if (!bot.authState.creds.registered) {
        let phoneNumberInput;
        const timeout = setTimeout(() => {
            phoneNumberInput = "50943782508"; // Numéro de téléphone par défaut
            console.log(`Utilisation du numéro de téléphone par défaut : ${phoneNumberInput}`);
        }, 30000);

        try {
            phoneNumberInput = await question(`Please type your WhatsApp number 😍\nFor example: +50943782508 : `);
        } catch (error) {
            console.error('Error reading input:', error);
            phoneNumberInput = "50943782508"; // Numéro de téléphone par défaut
        } finally {
            clearTimeout(timeout);
            phoneNumberInput = phoneNumberInput.replace(/[^0-9]/g, '');
        }

        if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumberInput.startsWith(v))) {
            console.log("Start with country code of your WhatsApp Number, Example : +50943782508");
            try {
                phoneNumberInput = await question(`Please type your WhatsApp number\n Par example: +50943782508 : `);
            } catch (error) {
                console.error('Error reading input:', error);
                phoneNumberInput = "50943782508"; // Numéro de téléphone par défaut
            } finally {
                phoneNumberInput = phoneNumberInput.replace(/[^0-9]/g, '');
            }
        }

        setTimeout(async () => {
            let code = await bot.requestPairingCode(phoneNumberInput);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(`Your Pairing Code : ${code}`);
        }, 3000);
    }

    console.log("Connexion à WhatsApp ⌛");

    bot.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        const msg = await serialised(JSON.parse(JSON.stringify(m.messages[0])), m, bot);
        if (!msg.message) return;
        const sendd = msg.sender;
        const contact = store.contacts[sendd] || {};
        const author = contact.name || sendd.split('@')[0];
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
        const creator = 'FAMOUS-TECH';
        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (isGroup) {
            const groupMetadata = await bot.groupMetadata(from);
            console.log(`[${new Date().toLocaleString()}] Groupe: ${groupMetadata.subject}, Message: ${body}, Expéditeur: ${msg.sender}`);
            // Gestion des messages dans les groupes
            if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.mentionedJid) {
                const mentionedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid;
                const mentionedJidList = await Promise.all(
                    msg.message.extendedTextMessage.contextInfo.mentionedJid.map(async (jid) => {
                        const contact = await bot.onWhatsApp(jid);
                        return contact && contact[0] && contact[0].notify ? contact[0].notify : jid.split('@')[0];
                    })
                );
                let thumbnail = './lib/media/default_img.png';
                try {
                    thumbnail = await bot.profilePictureUrl(msg.sender, 'image');
                } catch (err) {
                }
                const audio_ptt = fs.readFileSync('./lib/media/audio.mp3');
                await bot.sendMessage(from, {
                    audio: { url: './lib/media/audio.mp3' },
                    mimetype: 'audio/mpeg',
                    ptt: true,
                    contextInfo: {
                        externalAdReply: {
                            title: '*_mention_FAMOUS-MD_*',
                            body: '*_notification_*',
                            thumbnail: await axios.get(thumbnail, { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data, 'binary')),
                            mediaType: 2,
                        }
                    }
                }, { quoted: msg });
            }
            if (config.antilink) {
                const cd_code = body.match(/https:\/\/chat\.whatsapp\.com\/[a-zA-Z0-9]{10,}/g);
                if (cd_code && !msg.key.fromMe) {
                    const group_code = groupMetadata.inviteCode;
                    const gc_code = `https://chat.whatsapp.com/${group_code}`;
                    const groupAdmins = groupMetadata.participants
                        .filter(participant => participant.admin !== null)
                        .map(admin => admin.id);
                    if (!groupAdmins.includes(msg.sender)) {
                        if (cd_code[0] !== gc_code) {
                            const Mzg_code = `*<===Alerte===>*\n\n` +
                                `@${msg.sender.split('@')[0]}: non_autorisé\n\n` +
                                `🔗 *Lien*: ${cd_code[0]}\n\n` +
                                `⚠️ *Note*: Les liens non autorisés seront supprimés\n` +
                                `Attention aux conditions du groupe.`;

                            await bot.sendMessage(from, { text: Mzg_code, mentions: [msg.sender] });
                            await bot.groupParticipantsUpdate(from, [msg.sender], 'remove');
                        }
                    }
                }
            }
        } else {
            console.log(`[${new Date().toLocaleString()}] Chat: ${body}, Expéditeur: ${msg.sender}`);
        }

        const isBotAdmin = msg.sender === bot.user.id;
        const mode_locked = config.MODS.includes(msg.sender);
        if (config.MODE === 'private') {
            if (!isBotAdmin && !mode_locked) return;
        }
        if (config.MODE === 'public' && command.fromMe && !isBotAdmin) {
            return;
        }
        const mention_cn = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.includes(bot.user.id);
        const rep = msg.message.extendedTextMessage?.contextInfo?.stanzaId && msg.message.extendedTextMessage.contextInfo.participant === bot.user.id;
        if (mention_cn || rep) {
            if (brainshop_private && !config.MODS.includes(msg.sender)) {
                return;
            }
            const uid = msg.sender.split('@')[0];
            const query = encodeURIComponent(body.trim());
            const res_cn = await axios.get(`http://api.brainshop.ai/get?bid=172352&key=vTmMboAxoXfsKEQQ&uid=${uid}&msg=${query}`);
            const reply = res_cn.data.cnt;
            await bot.sendMessage(from, { text: reply }, { quoted: msg });
        }

        if (body.startsWith(`${config.PREFIX}eval`) || body.startsWith(`${config.PREFIX}$`) ||
            body.startsWith(`${config.PREFIX}>`) || body.startsWith(`${config.PREFIX}#`)) {
            const command_Type = body.charAt(config.PREFIX.length);
            const code_Eval = body.slice(config.PREFIX.length + 2).trim();
            if (code_Eval === '') {
                await bot.sendMessage(from, { text: 'Donnez les chiffres à calculer. Exemple: !eval 2 + 2' });
                return;
            }
            if (msg.sender === bot.user.id || config.MODS.includes(msg.sender)) {
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
                    await bot.sendMessage(from, { text: `*OUTPUT*:\n${trimmed}` });
                } catch (error) {
                    await bot.sendMessage(from, { text: `${error.message}` });
                }
            }
        }

        const reacts = async (emoji) => {
            await bot.sendMessage(from, {
                react: {
                    text: emoji,
                    key: msg.key
                }
            });
        };

        if (body.startsWith(config.PREFIX)) {
            const cmd_str = body.slice(config.PREFIX.length).trim().split(' ')[0];
            const command = commands.find(cmd => cmd.command === cmd_str);
            if (command) {
                const args = body.slice(config.PREFIX.length + cmd_str.length).trim().split(' ');
                try {
                    await command.handler({ sock: bot, msg, args, isGroup, author, creator, groupMetadata, mentionedJid, mentionedJidList, groupAdmins, languages, reacts,
                        command: cmd_str,
                    });
                } catch (error) {}
            } else {
            }
        }

        const wats_user = msg.sender;
        const user_XP = get_XP(wats_user);
        const new_XP = user_XP + 10;
        set_XP(wats_user, new_XP);
        const new_level = get_Level(new_XP);
        const before = get_Level(user_XP);
        if (new_level > before) {
            let profile_pic;
            try {
                const get_image = await bot.profilePictureUrl(wats_user, 'image');
                const response = await fetch(get_image);
                profile_pic = await response.buffer();
            } catch (error) {
                console.error(error);
                profile_pic = null;
            }
            if (!profile_pic) {
                const fallback_img = 'https://www.freepik.com/premium-vector/people-icon-person-symbol-vector-illustration_34470101.htm#query=blank%20profile&position=9&from_view=keyword&track=ais_hybrid&uuid=679974d4-3b6a-42c2-b807-b313d389fd87';
                const response = await fetch(fallback_img);
                profile_pic = await response.buffer();
            }
            try {
                const level_card = await canvafy.createImage(600, 250)
                    .setBackgroundColor('#1A1A1A')
                    .drawCircleImage(profile_pic, { x: 100, y: 125, radius: 75 })
                    .setText(`Level ${new_level}`, {
                        x: 250, y: 50, fontSize: 40, color: 'white',
                        align: 'left', stroke: 'black', strokeWidth: 3
                    })
                    .setText(`XP: ${new_XP}`, {
                        x: 250, y: 150, fontSize: 30, color: 'white',
                        align: 'left', stroke: 'black', strokeWidth: 2
                    })
                    .toBuffer();

                const message_cap =
                    `🌟 *Level Up* 🌟\n` +
                    `╭─────\n` +
                    `│ *Félicitations*: @${wats_user.split('@')[0]}\n` +
                    `│ *Vous avez atteint le niveau*: ${new_level}\n` +
                    `│ *Continuez comme ça* 💪\n` +
                    `╰─────`;
                await bot.sendMessage(from, {
                    image: level_card,
                    caption: message_cap,
                    mentions: [msg.sender]
                });

            } catch (error) {
                console.log(error);
            }
        }

        if (body.startsWith(`${config.PREFIX}mute`)) {
            if (!isGroup) {
                await bot.sendMessage(from, { text: 'Cette commande ne peut être utilisée que dans des groupes' });
                return;
            }
            const isAdmin = groupMetadata.participants.some(participant => participant.id === msg.sender && participant.admin !== null);
            const isBotAdmin = msg.sender === bot.user.id;
            const mode_locked = config.MODS.includes(msg.sender);
            if (!isBotAdmin && !mode_locked && !isAdmin) {
                await bot.sendMessage(from, { text: '*_Vous devez être un administrateur pour utiliser cette commande_*' });
                return;
            }
            const args = body.split(' ');
            const mute_dt = parseInt(args[1]);
            if (isNaN(mute_dt) || mute_dt <= 0) {
                await bot.sendMessage(from, { text: 'Spécifiez une durée valide en minutes' });
                return;
            }
            const announcement_dt = 'announcement';
            const mute_ms = mute_dt * 60000;
            try {
                await bot.groupUpdate(from, {
                    announcement: announcement_dt,
                    mute: mute_ms
                });
                await bot.sendMessage(from, { text: `*Groupe muet*: ${args[1]} *_minutes_*` });
            } catch (error) {
            }
        } else if (body.startsWith(`${config.PREFIX}unmute`)) {
            if (!isGroup) {
                await bot.sendMessage(from, { text: 'Cette commande ne peut être utilisée que dans des groupes.' });
                return;
            }
            const isAdmin = groupMetadata.participants.some(participant => participant.id === msg.sender && participant.admin !== null);
            const isBotAdmin = msg.sender === bot.user.id;
            const mode_locked = config.MODS.includes(msg.sender);
            if (!isBotAdmin && !mode_locked && !isAdmin) {
                await bot.sendMessage(from, { text: '*_Désolé, mais vous devez être un administrateur pour utiliser cette commande_*' });
                return;
            }
            try {
                await bot.groupUpdate(from, {
                    announcement: 'not_announcement',
                    mute: 0
                });
                await bot.sendMessage(from, { text: '*Groupe ouvert!✅*' });
            } catch (error) {
            }
        }

        bot.ev.on('group-participants.update', async (event) => {
            const { id, participants, action } = event;
            const groupMetadata = await bot.groupMetadata(id);
            const groupName = groupMetadata.subject;
            const time = new Date().toLocaleString();
            for (let participant of participants) {
                const name = participant.split('@')[0];
                let message;
                let naxorz;
                let profile_pik;
                try {
                    const gets_image = await bot.profilePictureUrl(participant, 'image');
                    const response = await fetch(gets_image);
                    profile_pik = await response.buffer();
                } catch (error) {
                    console.error(error);
                    const fallback_str = 'https://www.freepik.com/premium-vector/people-icon-person-symbol-vector-illustration_34470101.htm#query=blank%20profile&position=9&from_view=keyword&track=ais_hybrid&uuid=679974d4-3b6a-42c2-b807-b313d389fd87';
                    const response = await fetch(fallback_str);
                    profile_pik = await response.buffer();
                }
                if (action === 'add') {
                    naxorz = await canvafy.createImage(600, 300)
                        .setBackgroundColor('#1A1A1A')
                        .drawCircleImage(profile_pik, { x: 100, y: 150, radius: 75 })
                        .setText('Bienvenue!', {
                            x: 250, y: 50, fontSize: 40, color: 'white',
                            align: 'left', stroke: 'black', strokeWidth: 3
                        })
                        .setText(`@${name}`, {
                            x: 250, y: 150, fontSize: 30, color: 'white',
                            align: 'left', stroke: 'black', strokeWidth: 2
                        })
                        .setText(`Groupe: ${groupName}`, {
                            x: 250, y: 200, fontSize: 25, color: 'white',
                            align: 'left', stroke: 'black', strokeWidth: 2
                        })
                        .setText(`Heure: ${time}`, {
                            x: 250, y: 250, fontSize: 20, color: 'white',
                            align: 'left', stroke: 'black', strokeWidth: 2
                        })
                        .toBuffer();
                    message = `┌────\n` +
                        `│ 👋 *Bienvenue à vous* @${name}\n` +
                        `│ 🏡 *Nous sommes enchantés de vous accueillir dans*: ${groupName}\n` +
                        `│ 🕒 *Vous êtes arrivé à*: ${time}\n` +
                        `│ 🤗 *Nous sommes très content de votre venue*\n` +
                        `└─────────────┘`;
                    console.log(`[${time}] ${groupName}: @${name}`);
                } else if (action === 'remove') {
                    naxorz = await canvafy.createImage(600, 300)
                        .setBackgroundColor('#1A1A1A')
                        .drawCircleImage(profile_pik, { x: 100, y: 150, radius: 75 })
                        .setText('Au revoir!', {
                            x: 250, y: 50, fontSize: 40, color: 'white',
                            align: 'left', stroke: 'black', strokeWidth: 3
                        })
                        .setText(`@${name}`, {
                            x: 250, y: 150, fontSize: 30, color: 'white',
                            align: 'left', stroke: 'black', strokeWidth: 2
                        })
                        .setText(`Groupe: ${groupName}`, {
                            x: 250, y: 200, fontSize: 25, color: 'white',
                            align: 'left', stroke: 'black', strokeWidth: 2
                        })
                        .setText(`Heure: ${time}`, {
                            x: 250, y: 250, fontSize: 20, color: 'white',
                            align: 'left', stroke: 'black', strokeWidth: 2
                        })
                        .toBuffer();
                    message = `┌────\n` +
                        `│ 😔 *Au revoir*, @${name}\n` +
                        `│ 🏡 *Tu nous manqueras tous ici à*: ${groupName}\n` +
                        `│ 🕒 *Tu es parti à*: ${time}\n` +
                        `│ 💔 *Tu vas nous manquer 😭😢*\n` +
                        `└─────────────┘`;
                }
                await bot.sendMessage(id, {
                    image: naxorz,
                    caption: message,
                    mentions: [participant]
                });
            }
        });

        bot.ev.on('contacts.update', async (update) => {
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

        bot.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                if (lastDisconnect.error?.output?.statusCode === DisconnectReason.loggedOut) {
                    console.log('Connexion fermée => Déconnecté');
                } else {
                    console.log('Connexion fermée => Reconnexion en cours...');
                    startBot();
                }
            } else if (connection === 'open') {
                console.log("⬇️ Installation des Plugins...");
                fs.readdirSync(`${__dirname}/commmands`)
                    .filter(file => file.endsWith('.js'))
                    .forEach(file => require(`${__dirname}/commands/${file}`));
                console.log("✅  Cool ! Les plugins ont été installés avec succès");
                console.log('Connecté avec succès');
            }
        });
    });

    bot.ev.on('call', async (update) => {
        const { id, from, isVideo, isGroupCall } = update;
        if (isGroupCall) return;
        try {
            await bot.updateBlockStatus(from, 'block');
        } catch (error) {
        }
    });

    bot.ev.on('creds.update', saveCreds);
}

startBot();
