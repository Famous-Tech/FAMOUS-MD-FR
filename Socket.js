const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const chalk = require('chalk');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const config = require('./config');
const { commands } = require('./lib/commands');
const { serialised, decodeJid } = require('./lib/serialize');

const SESSION_FILE = path.join(__dirname, 'auth_info_baileys', 'creds.json');

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
        auth: state,
    });

    sock.ev.on('creds.update', saveCreds);

    const store = { contacts: {} };

    sock.ev.on('messages.upsert', async (m) => {
        const msg = await serialised(JSON.parse(JSON.stringify(m.messages[0])), m, sock);
        if (!msg.message || msg.key.fromMe) return;

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
        } else {
            console.log(chalk.rgb(0, 255, 255)(`[${new Date().toLocaleString()}] Chat: ${body}, Sender: ${msg.sender}`));
        }

        if (body.startsWith(config.prefix)) {
            commands.forEach(async (command) => {
                if (command.fromMe && !config.mods.includes(msg.sender)) return;

                if (body.match(command.command)) {
                    const matchResult = body.match(command.command);
                    const prefix = matchResult[0];
                    const matchedCommand = matchResult[1];
                    const args = matchResult.slice(2);
              await command.handler({
                        sock,
                        msg,
                        args,
                        prefix,
                        command: matchedCommand,
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
            if (action === 'add') {
                message = `┌────\n` +
                          `│ *Welcome* @${name}\n` +
                          `│ *Group*: ${groupName}\n` +
                          `│ *Time*: ${time}\n` +
                          `│ *We are excited X3*\n` +
                          `└─────────────┘`;
                console.log(chalk.rgb(0, 255, 0)(`[${time}] ${groupName}: @${name}`));
            } else if (action === 'remove') {
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
            console.log(chalk.magenta('Connected'));
        }
    });
}

startBot();
