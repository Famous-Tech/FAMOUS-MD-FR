const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const P = require('pino');
const chalk = require('chalk');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const config = require('./config');
const { commands } = require('./lib/commands');
const { serialised, decodeJid } = require('./lib/serialize');

const SESSION_FILE = path.join(__dirname, 'auth_info_baileys', 'creds.json');

let action_add = true;
let action_remove = true;
async function Connect_Session() {
    if (fs.existsSync(SESSION_FILE)) return;

    const sessionId = config.SESSION_ID.replace(/Socket;;;/g, "");
    let sessionData = sessionId;
    if (sessionId.length < 20) {
        const { data } = await axios.get(`https://privatebin.net/${sessionId}`);
        sessionData = Buffer.from(data, 'base64').toString('utf8');
    }

    fs.writeFileSync(SESSION_FILE, sessionData, 'utf8');
}

async function startBot() {
    await Connect_Session();

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FILE);
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.windows('Firefox'),
        auth: state,
    });

    sock.ev.on('creds.update', saveCreds);
    const store = { contacts: {} };
    sock.ev.on('messages.upsert', async (m) => {
        const msg = await serialised(JSON.parse(JSON.stringify(m.messages[0])), m, sock);
        if (!msg.message) return;

        const msgType = msg.messageType;
        let body = '';
        switch (msgType) {
            case 'conversation':
                body = msg.text;
                break;
            case 'imageMessage':
            case 'videoMessage':
            case 'extendedTextMessage':
                body = msg.text;
                break;
            case 'buttonsResponseMessage':
                body = m.message.buttonsResponseMessage.selectedButtonId;
                break;
            case 'listResponseMessage':
                body = m.message.listResponseMessage.singleSelectReply.selectedRowId;
                break;
            case 'templateButtonReplyMessage':
                body = m.message.templateButtonReplyMessage.selectedId;
                break;
        }

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        if (isGroup) {
            const groupMetadata = await sock.groupMetadata(from);
            console.log(chalk.rgb(0, 255, 255)(`[${new Date().toLocaleString()}] Group: ${groupMetadata.subject}, Message: ${body}, Sender: ${msg.sender}`));

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
                    } else {
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

        if (body.startsWith(config.PREFIX)) {
            if (body.startsWith(`${config.PREFIX}welcome true`)) {
                action_add = true;
                sock.sendMessage(from, { text: 'Welcome_enabled' });
            } else if (body.startsWith(`${config.PREFIX}welcome false`)) {
                action_add = false;
                sock.sendMessage(from, { text: 'Welcome_disabled' });
            } else if (body.startsWith(`${config.PREFIX}goodbye true`)) {
                action_remove = true;
                sock.sendMessage(from, { text: 'Goodbye_enabled' });
            } else if (body.startsWith(`${config.PREFIX}goodbye false`)) {
                action_remove = false;
                sock.sendMessage(from, { text: 'Goodbye_disabled' });
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
                } else {
                   }
            }

            commands.forEach(async (command) => {
                if (body.match(command.command)) {
                    const match_cmd = body.match(command.command);
                    const prefix = match_cmd[0];
                    const matched = match_cmd[1];
                    const args = match_cmd.slice(2);

                    await command.handler({
                        sock,
                        msg,
                        args,
                        prefix,
                        command: matched,
                    });
                }
            });
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
                          `│ *Welcome* @${name}\n` +
                          `│ *Group*: ${groupName}\n` +
                          `│ *Time*: ${time}\n` +
                          `│ *We are excited X3*\n` +
                          `└─────────────┘`;
                console.log(chalk.rgb(0, 255, 0)(`[${time}] ${groupName}: @${name}`));
            } else if (action === 'remove' && action_remove) {
                message = `┌────\n` +
                          `│ *Goodbye*, @${name}\n` +
                          `│ *Group*: ${groupName}\n` +
                          `│ *Time*: ${time}\n` +
                          `│ *Will be missed*\n` +
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

startBot();
        
