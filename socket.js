require('config.js');
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const chalk = require('chalk');

const { state, saveCreds } = useSingleFileAuthState('./auth_info.json');

async function startBot() {
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
    });

    sock.ev.on('creds.update', saveCreds);

    const store = { contacts: {} };
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return; 
        if (msg.key.fromMe) return; 

        const from = msg.key.remoteJid;
        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;

 });

    sock.ev.on('group-participants.update', async (event) => {
        const { id, participants, action } = event;
        const groupMetadata = await sock.groupMetadata(id);
        const groupName = groupMetadata.subject;
        const time = new Date().toLocaleString();        

        for (let participant of participants) {
            const Name = participant.split('@')[0];

            let message;
            if (action === 'add') {
                message = `┌────\n` +
                          `│ *Welcome* @${Name}\n` +
                          `│ *Group*: ${groupName}\n` +
                          `│ *Time*: ${time}\n` +
                          `│ *We are excited X3*\n` +
                          `└─────────────┘`;
            } else if (action === 'remove') {
                message = `┌────\n` +
                          `│ *Goodbye*, @${Name}\n` +
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

    function decodeJid(jid) {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let parts = jid.split(':');
            return parts.length === 3 ? parts[1] : jid;
        } else return jid;
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode === DisconnectReason.loggedOut) {
                console.log(chalk.red('Connection closed=>Logged out'));
            } else {
                console.log(chalk.red('Connection closed=>Reconnecting...'));
                startBot();
            }
        } else if (connection === 'open') {
            console.log(chalk.magenta('Connected'));
        }
    });
}

startBot();
    
