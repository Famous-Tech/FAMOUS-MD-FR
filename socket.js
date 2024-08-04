const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const chalk = require('chalk');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const SESSION_FILE = path.join(__dirname, 'auth_info_baileys', 'creds.json');
async function Connect_Session() {
    if (fs.existsSync(SESSION_FILE)) return;

    const sessionId = config.sessionName.replace(/Socket;;;/g, "");
    let sessionData = sessionId;

    if (sessionId.length < 30) {
        const { data } = await axios.get(`https://privatebin.net/${sessionId}`);
        sessionData = Buffer.from(data, 'base64').toString('utf8');
    }

    fs.writeFileSync(SESSION_FILE, sessionData, 'utf8');
}

const { serialised, decodeJid } = require('./lib/serialize');

async function startBot() {
    await Connect_Session(); 

    const { state, saveCreds } = useSingleFileAuthState(SESSION_FILE);
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
        await serialied(msg, sock);

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
            
