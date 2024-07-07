const {
    makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    WASocket,
    fetchLatestWaWebVersion,
    makeInMemoryStore
} = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const { imageSync } = require('qr-image');
const contact = require('./lib/contact');
const control = require('./lib/commands');
const { serialize } = require('./lib/serialize.js');
const { QuickDatabase, mongoDB } = require('./contents/QuickDB/Database');
const Authentication = require('./contents/QuickDB/Schema');
const config = require('./config');
const { getCommands } = require('./lib/getCommands');
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });

async function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
    ]);
}

async function WaSock() {
    if (!config.MONGODB_URL) {
        console.log('Mongodb URL not provided');
        process.exit(1);
    }

    const db = await QuickDatabase();
    await mongoDB().connect();
    const databaseMultiInstance = Authentication(config.session, db, WASocket);
    const SessionMulti = await databaseMultiInstance.DatabaseMulti();
    
    fetchLatestWaWebVersion().then(async ({ version, isLatest }) => {
        const sock = makeWASocket({
            version,
            logger: P({ level: 'silent' }),
            printQRInTerminal: true,
            auth: SessionMulti.state,
            msgRetryCounterMap: {},
            generateHighQualityLinkPreview: true
        });

        store.bind(sock.ev);
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            for (const msg of messages) {
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
                const participants = isGroup ? metadata.participants : [sender];
                const groupName = isGroup ? metadata.subject : "";
                const groupAdmin = participants.filter(participant => participant.isAdmin);
                const botNumber = await sock.decodeJid(sock.user.id)?.user;
                const isBotAdmin = isGroup && groupAdmin.some(admin => admin.id === botNumber);
                const isowner = "27686881509";
                const isDev = [botNumber, isowner, ...config.MODS].some(id => id.replace(/\D+/g, '') + '@s.whatsapp.net' === sender);
                const args = body.startsWith(config.PREFIX) ? body.slice(config.PREFIX.length).trim().split(/\s+/).slice(1) : [];
                const cmdName = args.shift().toLowerCase();

                const cmd = control.commands.find(command =>
                    command.pattern === cmdName ||
                    (command.alias && command.alias.includes(cmdName)) ||
                    command.commandName === cmdName
                );

                if (cmd) {
                    try {
                        await cmd.function(sock, serializedMsg, { args, isDev });
                    } catch (error) {
                        console.error(error);
                    }
                }

                if (serializedMsg.mimeType === "imageMessage") {
                    for (const command of control.commands) {
                        if (command.on === "image") {
                            try {
                                await command.function(sock, serializedMsg, { args, isDev });
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    }
                } else if (serializedMsg.mimeType === "stickerMessage") {
                    for (const command of control.commands) {
                        if (command.on === "sticker") {
                            try {
                                await command.function(sock, serializedMsg, { args, isDev });
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    }
                } else if (serializedMsg.message && serializedMsg.message.conversation) {
                    for (const command of control.commands) {
                        if (command.on === "text") {
                            try {
                                await command.function(sock, serializedMsg, { args, isDev });
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    }
                }
            }
        });

        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                if (qr) {
                    config.session.qr = imageSync(qr);
                    console.log('QR code has been generated');
                }
                console.log('Connection closed, reconnecting:', shouldReconnect);
                await withTimeout(SessionMulti.clearState(), 5000);
                if (shouldReconnect) await WaSock();
            } else if (connection === 'open') {
                const app = require('express')();
                app.get('/', (req, res) => {
                    res.status(200).setHeader('Content-Type', 'image/png').send(config.session.qr);
                });
                console.log('Connected');
                await getCommands();
            }
        });

        sock.ev.on('creds.update', async () => {
            try {
                await SessionMulti.saveState();
            } catch (error) {
                console.error(error.message);
            }
        });

        sock.ev.on('contacts.update', async (update) => {
            try {
                await contact.saveContacts(update, sock);
            } catch (error) {
                console.error(error.message);
            }
        });

        sock.ev.on('group-participants.update', async (update) => {
            const { id, participants, action } = update;
            const metadata = await sock.groupMetadata(id);
            const groupName = metadata.subject;

            for (const participant of participants) {
                if (action === 'add') {
                    await sock.sendMessage(id, {
                        text: `Welcome @${participant.split('@')[0]}\nGroup: ${groupName}\nWe're glad to have you here`,
                        mentions: [participant]
                    });
                } else if (action === 'remove') {
                    await sock.sendMessage(id, {
                        text: `😢 Goodbye @${participant.split('@')[0]}\nWe'll miss you`,
                        mentions: [participant]
                    });
                }
            }
        });
    });
}

WaSock();
