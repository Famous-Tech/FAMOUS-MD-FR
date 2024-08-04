const { downloadContentFromMessage, proto, getContentType, jidDecode } = require('@whiskeysockets/baileys');

const decodeJid = (jid) => {
    if (!jid) return null;

    const decoded = jidDecode(jid) || {};
    const user = decoded.user || jid.split('@')[0];
    const server = decoded.server || jid.split('@')[1];
    
    return `${user}@${server}`.trim();
};

const downloadMedia = async (message) => {
    const messageType = Object.keys(message)[0];
    const content = message[messageType];
    const stream = await downloadContentFromMessage(content, messageType.replace('Message', ''));
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
};

const serialised = (message, sock) => {
    message.id = message.key.id;
    message.chatId = decodeJid(message.key.remoteJid);
    message.sender = message.key.participant ? decodeJid(message.key.participant) : decodeJid(sock.user.id);
    message.isGroup = message.key.remoteJid.endsWith('@g.us');
    message.isSelf = message.key.fromMe;
    message.type = null;
    message.body = null;
    message.quoted = null;

    if (message.message) {
        message.type = getContentType(message.message);
        const msgContent = message.message[message.type];

        message.body = msgContent?.conversation || 
                      msgContent?.text || 
                      msgContent?.caption || 
                      '';

        if (message.message.contextInfo && message.message.contextInfo.quotedMessage) {
            const quoted = message.message.contextInfo.quotedMessage;
            message.quoted = {
                type: getContentType(quoted),
                id: message.message.contextInfo.stanzaId,
                participant: decodeJid(message.message.contextInfo.participant),
                message: quoted,
            };
        }
    }

    message.reply = (text) =>
        sock.sendMessage(
            message.chatId,
            { text },
            { quoted: message }
        );

    return message;
};

module.exports = {
    decodeJid,
    downloadMedia,
    serialised
};
    
