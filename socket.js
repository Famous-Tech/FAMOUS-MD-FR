const { 
    makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore 
} = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const contact = require('./lib/contact');
const control = require('./lib/commands');
const { serialize } = require('./lib/serialize.js');

const { state, saveCreds } = useMultiFileAuthState('./lib/auth_info_multi');
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });
store.readFromFile('./lib/baileys_store_multi.json');
setInterval(() => {
    store.writeToFile('./lib/baileys_store_multi.json');
}, 10000);

async function waveWhatsApp() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        msgRetryCounterMap: {},
        generateHighQualityLinkPreview: true
    });

    store.bind(sock.ev);
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const msg of messages) {
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                continue;
            }

            if (msg.message && msg.message.extendedTextMessage) {
                const TextRegx = msg.message.extendedTextMessage.text;
                console.log(TextRegx);
            }
            const body = serialize(JSON.parse(JSON.stringify(msg)), sock); 
            const { isGroup = false, sender = '', chat = '', body = '', pushname = '' } = body;

            const metadata = await (isGroup ? sock.groupMetadata(chat) : Promise.resolve({}));
            const participants = isGroup ? metadata.participants : [sock.sender];
            const groupName = isGroup ? metadata.subject : "";
            const groupAdmin = participants.filter(participant => participant.isAdmin);
            const botNumber = (await sock.decodeJid(sock.user.id))?.user;
            const isBotAdmin = isGroup && groupAdmin.some(admin => admin.id === botNumber);
            const isowner = "27686881509";
            const isDev = [botNumber,isowner, ...config.MODS].some(id => id.replace(/\D+/g, '') + '@s.whatsapp.net' === sock.sender);
            const args = body.startsWith(config.PREFIX) ? body.slice(config.PREFIX.length).trim().split(/\s+/).slice(1) : [];
            const cmdName = args.shift().toLowerCase();

            const cmd = control.commands.find(command =>
                command.pattern === cmdName ||
                (command.alias && command.alias.includes(cmdName)) ||
                command.commandName === cmdName
            );

            if (cmd) {
                try {
                    await cmd.function(Sock, msg, { args });
                } catch (error) {
                    console.error(error);
                }
            }

            if (msg.mimeType === "imageMessage") {
                control.commands.forEach(async (command) => {
                    if (command.on === "image") {
                        try {
                            await command.function(Sock, msg, { args });
                        } catch (error) {
                            console.error(error);
                        }
                    }
                });
            } else if (msg.mimeType === "stickerMessage") {
                control.commands.forEach(async (command) => {
                    if (command.on === "sticker") {
                        try {
                            await command.function(Sock, msg, { args });
                        } catch (error) {
                            console.error(error);
                        }
                    }
                });
            } else if (msg.message && msg.message.conversation) {
                control.commands.forEach(async (command) => {
                    if (command.on === "text") {
                        try {
                            await command.function(Sock, msg, { args });
                        } catch (error) {
                            console.error(error);
                        }
                    }
                });
            }
        }
    });

    Sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reconnecting:', shouldReconnect);
            if (shouldReconnect) waveWhatsApp();
        } else if (connection === 'open') {
            console.log('Connected');
        }
    });

    Sock.ev.on('contacts.update', async (update) => await contact.saveContacts(update, Sock));
    Sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;

        if (action === 'add') {
            const logo = fs.readFileSync('./lib/media/group_add.png');
            for (const participant of participants) {
                await Sock.sendMessage(id, {
                    text: `Welcome @${participant.split('@')[0]}🖐️`,
                    mentions: [participant],
                    image: {
                        url: './lib/media/group_add.png',
                        caption: `Welcome @${participant.split('@')[0]}🖐️`
                    }
                });
            }
        } else if (action === 'remove') {
            const logo = fs.readFileSync('./lib/media/group_left.png');
            for (const participant of participants) {
                await Sock.sendMessage(id, {
                    text: `Goodbye @${participant.split('@')[0]}😔`,
                    mentions: [participant],
                    image: {
                        url: './lib/media/group_left.png',
                        caption: `Goodbye @${participant.split('@')[0]}😔`
                    }
                });
            }
        } else if (action === 'promote') {
            for (const participant of participants) {
                await Sock.sendMessage(id, {
                    text: `Congratulations @${participant.split('@')[0]}, you have been promoted as admin`,
                    mentions: [participant]
                });
            }
        } else if (action === 'demote') {
            for (const participant of participants) {
                await Sock.sendMessage(id, {
                    text: `@${participant.split('@')[0]} has been demoted from admin`,
                    mentions: [participant]
                });
            }
        }
    });

    process.on('SIGINT', () => {
        console.log('Closing...');
        Sock.end(new Error('Process terminated'));
        process.exit(0);
    });

    return Sock;
}

setTimeout(() => {
    waveWhatsApp();
}, 8000);
