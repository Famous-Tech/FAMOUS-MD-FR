const fs = require('fs');
const { proto, getContentType, jidDecode, downloadContentFromMessage } = require('@whiskeysockets/baileys');

const decodeJid = (jid) => {
    const atIndex = jid.indexOf('@');
    if (atIndex !== -1) {
        const user = jid.slice(0, atIndex);
        const server = jid.slice(atIndex + 1);
        return { user, server };
    }
    return { user: jid, server: '' };
};

const serialize = {
    downloadMedia: async (message) => {
        try {
            let messageType = Object.keys(message)[0];
            let messageContent = message[messageType];

            if (messageType === 'buttonsMessage' || messageType === 'viewOnceMessageV2') {
                if (messageType === 'viewOnceMessageV2') {
                    messageContent = message.viewOnceMessageV2.message;
                    messageType = Object.keys(messageContent)[0];
                } else {
                    messageType = Object.keys(messageContent)[1];
                }
                messageContent = messageContent[messageType];
            }

            const stream = await downloadContentFromMessage(messageContent, messageType.replace('Message', ''));
            const buffer = [];

            for await (const chunk of stream) {
                buffer.push(chunk);
            }

            return Buffer.concat(buffer);
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    MessageKeys: (message, sock) => {
        try {
            if (!message || !message.key) {
                throw new Error('Invalid message format');
            }

            const { remoteJid, fromMe, id, participant } = message.key;
            const isSelf = fromMe || false;
            const isGroup = remoteJid.endsWith('@g.us');
            const from = jidDecode(remoteJid);
            const sender = isGroup ? jidDecode(participant || '') : isSelf ? jidDecode(sock.user.jid) : from;

            return sender;

        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    MessageContent: (message) => {
        try {
            const contentType = getContentType(message);
            console.log(contentType);
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    EphemeralMessage: (message) => {
        try {
            if (proto.WebMessageInfo && proto.WebMessageInfo.is(message.message)) {
                const ephemeralMessage = proto.WebMessageInfo.get(message.message);
                console.log(ephemeralMessage);
                const contentType = getContentType(ephemeralMessage);
                console.log(contentType);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    OnceMessage: (message) => {
        try {
            if (message.message && message.message.contextInfo && message.message.contextInfo.quotedMessage) {
                const quotedMessage = message.message.contextInfo.quotedMessage;
                const contentType = getContentType(quotedMessage);
                console.log(contentType);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    QuotedMessage: async (message) => {
        try {
            if (message.message && message.message.extendedTextMessage && message.message.extendedTextMessage.contextInfo) {
                const { quotedMessage } = message.message.extendedTextMessage.contextInfo;
                if (quotedMessage) {
                    const buffer = await serialize.downloadMedia(quotedMessage);
                    console.log(buffer);
                    const contentType = getContentType(quotedMessage);
                    console.log(contentType);
                }
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    extractMentions: (message) => {
        try {
            if (message.message && message.message.extendedTextMessage && message.message.extendedTextMessage.contextInfo) {
                const { mentionedJidList } = message.message.extendedTextMessage.contextInfo;
                console.log(mentionedJidList);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    extractMessage: (message) => {
        try {
            if (message.message && message.message.extendedTextMessage) {
                const messageBody = message.message.extendedTextMessage.text;
                console.log(messageBody);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
    incomingMessage: async (msg, chat, sock) => {
        try {
            msg.reply = async (text) => {
                try {
                    await sock.sendMessage(msg.chat, {
                        text: text,
                        quoted: msg
                    });
                    console.log(text);
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            };

        } catch (error) {
            console.error(error);
        }
    }
};

const generateForwardMessageContent = (message) => {
    try {
        if (!message) {
            throw new Error('Message object is required');
        }

        const { key, message: msgContent } = message;

        if (!key || !msgContent) {
            throw new Error('Invalid message format');
        }

        if (msgContent.imageMessage || msgContent.videoMessage || msgContent.audioMessage || msgContent.documentMessage || msgContent.stickerMessage) {
            const type = Object.keys(msgContent)[0];
            const content = msgContent[type];
            const mediaMessage = {
                [type]: content,
                key: {
                    remoteJid: key.remoteJid,
                    fromMe: false,
                    id: 'forward' + Math.floor(Math.random() * 10000000).toString(16).toUpperCase()
                }
            };
            return mediaMessage;
        }

        if (msgContent.conversation) {
            const textMessage = {
                extendedTextMessage: {
                    text: msgContent.conversation
                },
                key: {
                    remoteJid: key.remoteJid,
                    fromMe: false,
                    id: 'forward' + Math.floor(Math.random() * 10000000).toString(16).toUpperCase()
                }
            };
            return textMessage;
        }

        throw new Error('Unsupported type');
    } catch (error) {
        console.error(error);
        throw error;
    }
};

module.exports = {
    decodeJid,
    generateForwardMessageContent,
    serialize,
};
    
