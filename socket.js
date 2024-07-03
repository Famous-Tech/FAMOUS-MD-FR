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
const { MongoClient } = require('mongodb');

const { state, saveCreds } = useMultiFileAuthState('./lib/auth_info_multi');
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });
store.readFromFile('./lib/baileys_store_multi.json');
setInterval(() => {
    store.writeToFile('./lib/baileys_store_multi.json');
}, 10000);

let welcomeEnabled = true;
let promoteEnabled = true;
let demoteEnabled = true;

const mongoUrl = global.MONGODB;

let db;
if (mongoUrl) {
    const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    client.connect()
        .then(() => {
            console.log('Connected to MongoDB');
            db = client.db(); 
        })
        .catch(err => {
            console.error(err);
            process.exit(1); 
        });
} else {
    console.error('MongoDB URL not provided/Provide mongo url');
    process.exit(1); 
}

function waveWhatsApp() {
    fetchLatestBaileysVersion().then(({ version, isLatest }) => {
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

                const metadata = isGroup ? sock.groupMetadata(chat) : Promise.resolve({});
                metadata.then(data => {
                    const participants = isGroup ? data.participants : [sock.sender];
                    const groupName = isGroup ? data.subject : "";
                    const groupAdmin = participants.filter(participant => participant.isAdmin);
                    const botNumber = (async () => {
                        return (await sock.decodeJid(sock.user.id))?.user;
                    })();
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
                            cmd.function(sock, serializedMsg, { args });
                        } catch (error) {
                            console.error(error);
                        }
                    }

                    if (serializedMsg.mimeType === "imageMessage") {
                        control.commands.forEach(command => {
                            if (command.on === "image") {
                                try {
                                    command.function(sock, serializedMsg, { args });
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        });
                    } else if (serializedMsg.mimeType === "stickerMessage") {
                        control.commands.forEach(command => {
                            if (command.on === "sticker") {
                                try {
                                    command.function(sock, serializedMsg, { args });
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        });
                    } else if (serializedMsg.message && serializedMsg.message.conversation) {
                        control.commands.forEach(command => {
                            if (command.on === "text") {
                                try {
                                    command.function(sock, serializedMsg, { args });
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        });
                    }
                });
            });
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

        sock.ev.on('contacts.update', async (update) => {
            if (welcomeEnabled) await contact.saveContacts(update, sock);
        });

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

                if (action === 'promote' && promoteEnabled) {
                    sendPromote(sock, id, participant, groupName, ProfilePicture);
                } else if (action === 'demote' && demoteEnabled) {
                    sendDemote(sock, id, participant, groupName, ProfilePicture);
               } else if (action === 'add' && welcomeEnabled) {
                    sock.sendMessage(id, {
                        text: `Welcome @${participant.split('@')[0]}🖐️`,
                        mentions: [participant],
                        image: {
                            url: './lib/media/group_add.png',
                            caption: `Welcome @${participant.split('@')[0]}🖐️`
                        }
                    });
                } else if (action === 'remove' && goodbyeEnabled) {
                    sock.sendMessage(id, {
                        text: `Goodbye @${participant.split('@')[0]}😔`,
                        mentions: [participant],
                        image: {
                            url: './lib/media/group_left.png',
                            caption: `Goodbye @${participant.split('@')[0]}😔`
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
    });
}

function sendPromote(sock, id, participant, groupName, ProfilePicture) {
    sock.sendMessage(id, {
        text: `🔝 Elevation Alert\n\nCongratulations @${participant.split('@')[0]}\nFOR: You had been promoted\nPOSITION: Admin`,
        mentions: [participant],
        image: {
            url: ProfilePicture,
            caption: `🔝 Elevation Alert\n\nCongratulations @${participant.split('@')[0]}\nFOR: You  have been promoted\nPOSITION: Admin`
        }
    });
}

function sendDemote(sock, id, participant, groupName, ProfilePicture) {
    sock.sendMessage(id, {
        text: `⚠️ Demotion Notice\n\n@${participant.split('@')[0]}, you have been demoted\nPOSITION: Admin`,
        mentions: [participant],
        image: {
            url: ProfilePicture,
            caption: `⚠️ Demotion Notice\n\n@${participant.split('@')[0]}, you have been demoted\nPOSITION: Admin`
        }
    });
}

control.commands.push({
    pattern: 'welcome',
    function: (sock, msg, { args }) => {
        if (args.length > 0 && args[0] === 'off') {
            welcomeEnabled = false;
            sock.sendMessage(msg.chat, 'Welcome messages turned off');
        } else if (args.length > 0 && args[0] === 'on') {
            welcomeEnabled = true;
            sock.sendMessage(msg.chat, 'Welcome messages turned on');
        }
    }
});

control.commands.push({
    pattern: 'promote',
    function: (sock, msg, { args }) => {
        if (args.length > 0 && args[0] === 'off') {
            promoteEnabled = false;
            sock.sendMessage(msg.chat, 'Promotion messages turned off');
        } else if (args.length > 0 && args[0] === 'on') {
            promoteEnabled = true;
            sock.sendMessage(msg.chat, 'Promotion messages turned on');
        }
    }
});

control.commands.push({
    pattern: 'demote',
    function: (sock, msg, { args }) => {
        if (args.length > 0 && args[0] === 'off') {
            demoteEnabled = false;
            sock.sendMessage(msg.chat, 'Demotion messages turned off');
        } else if (args.length > 0 && args[0] === 'on') {
            demoteEnabled = true;
            sock.sendMessage(msg.chat, 'Demotion messages turned on');
        }
    }
});

setTimeout(() => {
    waveWhatsApp();
}, 8000);
    
