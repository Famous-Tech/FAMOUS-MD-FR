const { 
    makeWASocket, 
    DisconnectReason, 
    useSingleFileAuthState, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore 
} = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const contact = require('./sockets/contact');

const { state, saveCreds } = useMultiFileAuthState('./auth_info_multi.json');
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });
store.readFromFile('./lib/baileys_store_multi.json');
setInterval(() => {
    store.writeToFile('./lib/baileys_store_multi.json');
}, 10000);

async function waveWhatsApp() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    const Astrid = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        msgRetryCounterMap: {},
        generateHighQualityLinkPreview: true
    });

    store.bind(Astrid.ev);
    Astrid.ev.on('creds.update', saveCreds);

    Astrid.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const msg of messages) {
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                continue;
            }

            if (msg.message && msg.message.extendedTextMessage) {
                const TextRegx = msg.message.extendedTextMessage.text;
                console.log(TextRegx);
            }
        }
    });

    Astrid.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reconnecting:', shouldReconnect);
            if (shouldReconnect) waveWhatsApp();
        } else if (connection === 'open') {
            console.log('Connected');
        }
    });

    Astrid.ev.on('contacts.update', async (update) => await contact.saveContacts(update, Astrid));
    Astrid.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;

        if (action === 'add') {
            const logo = fs.readFileSync('./lib/media/group_add.png');
            for (const participant of participants) {
                await Astrid.sendMessage(id, {
                    text: `Welcome @${participant.split('@')[0]}!`,
                    mentions: [participant],
                    image: { 
                        url: './lib/media/group_add.png', 
                        caption: `Welcome @${participant.split('@')[0]}!`
                    }
                });
            }
        } else if (action === 'remove') {
            const logo = fs.readFileSync('./lib/media/group_left.png');
            for (const participant of participants) {
                await Astrid.sendMessage(id, {
                    text: `Goodbye @${participant.split('@')[0]}!`,
                    mentions: [participant],
                    image: { 
                        url: './lib/media/group_left.png', 
                        caption: `Goodbye @${participant.split('@')[0]}!`
                    }
                });
            }
        } else if (action === 'promote') {
            for (const participant of participants) {
                await Astrid.sendMessage(id, { 
                    text: `Congratulations @${participant.split('@')[0]}, you have been promoted to admin!`,
                    mentions: [participant]
                });
            }
        } else if (action === 'demote') {
            for (const participant of participants) {
                await Astrid.sendMessage(id, { 
                    text: `@${participant.split('@')[0]} has been demoted from admin.`,
                    mentions: [participant]
                });
            }
        }
    });

    process.on('SIGINT', () => {
        console.log('Closing...');
        Astrid.end(new Error('Process terminated'));
        process.exit(0);
    });

    return Astrid;
}

setTimeout(() => {
    waveWhatsApp();
}, 8000);
