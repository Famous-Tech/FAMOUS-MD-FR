const { 
    default: makeWASocket, 
    DisconnectReason, 
    useSingleFileAuthState, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore, 
    delay 
} = require('@adiwajshing/baileys');
const P = require('pino');
const fs = require('fs');
const contact = require('./contact'); // Import the contact module

// Authentication setup
const { state, saveState } = useSingleFileAuthState('./auth_info_multi.json');

// Create a store to manage sessions
const store = makeInMemoryStore({ logger: P().child({ level: 'debug', stream: 'store' }) });
store.readFromFile('./baileys_store_multi.json');
setInterval(() => {
    store.writeToFile('./baileys_store_multi.json');
}, 10_000);

// Function to connect to WhatsApp and return the socket
async function connectToWhatsApp() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using Baileys version: ${version}, isLatest: ${isLatest}`);
    
    const sock = makeWASocket({
        version,
        logger: P({ level: 'debug' }),
        printQRInTerminal: true,
        auth: state,
        msgRetryCounterMap: {},
        generateHighQualityLinkPreview: true
    });
    
    // Bind store to session
    store.bind(sock.ev);
    
    // Save session state upon change
    sock.ev.on('creds.update', saveState);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const msg of messages) {
            // Skip messages from 'status@broadcast'
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                continue;
            }

            // Check if the message meets the notification criteria
            if (!sock.public && msg.key.fromMe && type === 'notify') {
                console.log('Handling notification message:', msg);

                // Example: Respond to the notification message
                await sock.sendMessage(msg.key.remoteJid, { text: 'Handling notification message!', quoted: msg });
            }

            // Handle other message types or conditions here
            if (msg.message && msg.message.extendedTextMessage) {
                const messageText = msg.message.extendedTextMessage.text;
                console.log('Received a text message:', messageText);

                // Example: Respond to the text message
                await sock.sendMessage(msg.key.remoteJid, { text: `You sent: ${messageText}`, quoted: msg });
            }
        }
    });

    // Handle connection updates
    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reconnecting:', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('Connected');
        }
    });

    // Handle contact updates
    sock.ev.on('contacts.update', async (update) => await contact.saveContacts(update, sock));

    // Handle group participants update
    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;

        if (action === 'add') {
            const logo = fs.readFileSync('./media/group_add.png');
            for (const participant of participants) {
                await sock.sendMessage(id, {
                    text: `Welcome @${participant.split('@')[0]}!`,
                    mentions: [participant],
                    image: { 
                        url: './media/group_add.png', 
                        caption: `Welcome @${participant.split('@')[0]}!`
                    }
                });
            }
        } else if (action === 'remove') {
            const logo = fs.readFileSync('./media/group_left.png');
            for (const participant of participants) {
                await sock.sendMessage(id, {
                    text: `Goodbye @${participant.split('@')[0]}!`,
                    mentions: [participant],
                    image: { 
                        url: './media/group_left.png', 
                        caption: `Goodbye @${participant.split('@')[0]}!`
                    }
                });
            }
        } else if (action === 'promote') {
            for (const participant of participants) {
                await sock.sendMessage(id, { 
                    text: `Congratulations @${participant.split('@')[0]}, you have been promoted to admin!`,
                    mentions: [participant]
                });
            }
        } else if (action === 'demote') {
            for (const participant of participants) {
                await sock.sendMessage(id, { 
                    text: `@${participant.split('@')[0]} has been demoted from admin.`,
                    mentions: [participant]
                });
            }
        }
    });

    // Gracefully handle interruptions
    process.on('SIGINT', () => {
        console.log('Closing...');
        sock.end(new Error('Process terminated'));
        process.exit(0);
    });

    return sock; // Return the socket object
}

module.exports = connectToWhatsApp; 
