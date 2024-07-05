const { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestWaWebVersion,
    makeInMemoryStore 
} = require('baileys');
const P = require('pino');
const fs = require('fs');
const { imageSync } = require('qr-image');
const contact = require('./lib/contact');
const control = require('./lib/commands');
const { serialize } = require('./lib/serialize.js');
const { QuickDatabase, mongoDB, db } = require('./contents/QuickDB/Database');
const Authentication = require('./contents/QuickDB/Schema');
const config = require('./config');
const { getCommands } = require('./lib/getCommands');
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });

async function WaSock() {
    const db = new QuickDatabase(config);
    await mongoDB.connect();
    const DatabaseMulti = new Authentication(config.session, db);
    const SessionMulti = await DatabaseMulti();
    
    fetchLatestWaWebVersion().then(async ({ version, isLatest }) => {
        const sock = makeWASocket({
            version,
            logger: P({ level: 'silent' }),
            printQRInTerminal: true,
            auth: SessionMulti,
            msgRetryCounterMap: {},
            generateHighQualityLinkPreview: true
        });

        store.bind(sock.ev);
        sock.ev.on('messages.upsert', ({ messages, type }) => {
            messages.forEach(async msg => {
                if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                    return;
                }

                if (msg.message && msg.message.extendedTextMessage) {
                    const TextRegx = msg.message.extendedTextMessage.text;
                    console.log(TextRegx);
                }

                const serializedMsg = serialize(JSON.parse(JSON.stringify(msg)), sock); 
                const { isGroup = false, sender = '', chat = '', body = '', pushname = '' } = serializedMsg;

                const metadata = isGroup ? await sock.groupMetadata(chat) : {};
                const participants = isGroup ? metadata.participants : [sock.sender];
                const groupName = isGroup ? metadata.subject : "";
                const groupAdmin = participants.filter(participant => participant.isAdmin);
                const botNumber = await sock.decodeJid(sock.user.id)?.user;
                const isBotAdmin = isGroup && groupAdmin.some(admin => admin.id === botNumber);
                const isowner = "27686881509";
                const isDev = [botNumber, isowner, ...config.MODS].some(id => id.replace(/\D+/g, '') + '@s.whatsapp.net' === sock.sender);
                const args = body.startsWith(config.PREFIX) ? body.slice(config.PREFIX.length).trim().split(/\s+/).slice(1) : [];
                const cmdName = args.shift().toLowerCase();

                const cmd = control.commands.find(command =>
                    command.pattern === cmdName ||
                    (command.alias && command.alias.includes(cmdName)) ||
                    command.commandName === cmdName
                );

                if (cmd) {
                    try {
                        cmd.function(sock, serializedMsg, { args, isDev });
                    } catch (error) {
                        console.error(error);
                    }
                }

                if (serializedMsg.mimeType === "imageMessage") {
                    control.commands.forEach(command => {
                        if (command.on === "image") {
                            try {
                                command.function(sock, serializedMsg, { args, isDev });
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    });
                } else if (serializedMsg.mimeType === "stickerMessage") {
                    control.commands.forEach(command => {
                        if (command.on === "sticker") {
                            try {
                                command.function(sock, serializedMsg, { args, isDev });
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    });
                } else if (serializedMsg.message && serializedMsg.message.conversation) {
                    control.commands.forEach(command => {
                        if (command.on === "text") {
                            try {
                                command.function(sock, serializedMsg, { args, isDev });
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    });
                }
            });
        });
 
        sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (qr) {
                    config.session.qr = imageSync(qr);
                    console.log('QR code has been generated');
                }
                console.log('Connection closed, reconnecting:', shouldReconnect);
                await Session.clearState() and timeot ())
                if (shouldReconnect) WaSock();
            } else if (connection === 'open') {
                const app = require('express')();
                app.get('/', (req, res) => {
                    res.status(200).setHeader('Content-Type', 'image/png').send(config.session.qr);
                });
                console.log('Connected');
                await getCommands();
            }
        });
        sock.ev.on('creds.update', async() => {
        await SessionMulti.saveState()
        })
        sock.ev.on('contacts.update', async (update) => await contact.saveContacts(update, sock);
        });
        sock.ev.on('group-participants.update', async (update) => {
            const { id, participants, action } = update;
            const metadata = await sock.groupMetadata(id);
            const groupName = metadata.subject;

            for (const participant of participants) {
                if (action === 'add') {
                    sock.sendMessage(id, {
                        text: `Welcome @${participant.split('@')[0]}\nGroup: ${groupName}\nWe're glad to have you here`,
                        mentions: [participant]
                    });
                } else if (action === 'remove') {
                    sock.sendMessage(id, {
                        text: `😢 Goodbye @${participant.split('@')[0]}\nWe'll miss you`,
                        mentions: [participant]
                    });
                }
            }
        });
    });
}

WaSock();
