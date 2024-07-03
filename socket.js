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
const global = require('./config.js');
const { serialize } = require('./lib/serialize.js');

const { state, saveCreds } = useMultiFileAuthState('./lib/auth_info_multi');
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });
store.readFromFile('./lib/baileys_store_multi.json');
setInterval(() => {
    store.writeToFile('./lib/baileys_store_multi.json');
}, 10000);

const config = {
    PREFIX: global.PREFIX,
    welcomeEnabled: true,
    goodbyeEnabled: true,
    promoteEnabled: true,
    demoteEnabled: true
};

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

            const serializedMsg = serialize(JSON.parse(JSON.stringify(msg)), sock); 
            const { isGroup = false, sender = '', chat = '', body = '', pushname = '' } = serializedMsg;

            if (!isGroup) continue;

            const args = body.startsWith(config.PREFIX) ? body.slice(config.PREFIX.length).trim().split(/\s+/) : [];
            const cmdName = args.shift().toLowerCase();

            if (cmdName === 'toggle') {
                const feature = args[0];
                if (['welcome', 'goodbye', 'promote', 'demote'].includes(feature)) {
                    config[`${feature}Enabled`] = !config[`${feature}Enabled`];
                    await sock.sendMessage(chat, {
                        text: `${feature.charAt(0).toUpperCase() + feature.slice(1)} messages are now ${config[`${feature}Enabled`] ? 'enabled' : 'disabled'}.`
                    });
                }
            }
        }
    });

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reconnecting:', shouldReconnect);
            if (shouldReconnect) waveWhatsApp();
        } else if (connection === 'open') {
            console.log('Connected');
        }
    });

    sock.ev.on('contacts.update', async (update) => await contact.saveContacts(update, sock));
    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;
        const metadata = await sock.groupMetadata(id);
        const groupName = metadata.subject;

        let groupProfile = '';

        try {
            groupProfile = await sock.profilePictureUrl(id, 'image');
        } catch (err) {
    }

        for (const participant of participants) {
            let ProfilePicture = '';
            try {
                ProfilePicture = await sock.profilePictureUrl(participant, 'image');
            } catch (err) {
        }

            if (action === 'add' && config.welcomeEnabled) {
                await sock.sendMessage(id, {
                    text: `🎉 Welcome @${participant.split('@')[0]}\nGroup: ${groupName}\nWe're glad to have you here`,
                    mentions: [participant],
                    image: {
                        url: groupProfile,
                        caption: `🎉 Welcome @${participant.split('@')[0]}\nGroup: ${groupName}\nWe're glad to have you here`
                    }
                });
            } else if (action === 'remove' && config.goodbyeEnabled) {
                await sock.sendMessage(id, {
                    text: `😢 Goodbye @${participant.split('@')[0]}\nWe'll miss you`,
                    mentions: [participant],
                    image: {
                        url: groupProfile,
                        caption: `😢 Goodbye @${participant.split('@')[0]}\nWe'll miss you`
                    }
                });
            } else if (action === 'promote' && config.promoteEnabled) {
                await sock.sendMessage(id, {
                    text: `🔝 Elevation Alert\n\nCongratulations @${participant.split('@')[0]}\nFOR: You have been promoted\nPOSITION: Admin`,
                    mentions: [participant],
                    image: {
                        url: ProfilePicture,
                        caption: `🔝 Elevation Alert\n\nCongratulations @${participant.split('@')[0]}\nFOR: You have been promoted\nPOSITION: Admin`
                    }
                });
            } else if (action === 'demote' && config.demoteEnabled) {
                await sock.sendMessage(id, {
                    text: `⚠️ Demotion Notice\n\n@${participant.split('@')[0]}, you have been demoted\nPOSITION: Admin`,
                    mentions: [participant],
                    image: {
                        url: ProfilePicture,
                        caption: `⚠️ Demotion Notice\n\n@${participant.split('@')[0]}, you have been demoted\nPOSITION: Admin`
                    }
                });
            }
        }
    });

    process.on('SIGINT', () => {
        console.log('Closing...');
        sock.end(new Error('Process terminated'));
        process.exit(0);
    });

    return sock;
}

setTimeout(() => {
    waveWhatsApp();
}, 8000);
