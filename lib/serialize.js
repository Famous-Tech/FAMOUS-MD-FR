//
const { proto, getContentType, jidDecode, downloadContentFromMessage, sendMessage } = require('@adiwajshing/baileys');

// Function to decode Jabber ID (JID) into user and server parts
function decodeJid(jid) {
    const atIndex = jid.indexOf('@');
    if (atIndex !== -1) {
        const user = jid.slice(0, atIndex);
        const server = jid.slice(atIndex + 1);
        return { user, server };
    }
    return { user: jid, server: '' }; // If no '@' found, assume whole string is user part
}

// Function to download media from a message
async function downloadMedia(message) {
    try {
        let messageType = Object.keys(message)[0];
        let messageContent = message[messageType];

        // Handling special message types
        if (messageType === 'buttonsMessage' || messageType === 'viewOnceMessageV2') {
            if (messageType === 'viewOnceMessageV2') {
                messageContent = message.viewOnceMessageV2.message;
                messageType = Object.keys(messageContent)[0];
            } else {
                messageType = Object.keys(messageContent)[1];
            }
            messageContent = messageContent[messageType];
        }

        // Download media
        const stream = await downloadContentFromMessage(messageContent, messageType.replace('Message', ''));
        const buffer = [];

        for await (const chunk of stream) {
            buffer.push(chunk);
        }

        return Buffer.concat(buffer);
    } catch (error) {
        console.error('Error downloading media:', error);
        throw error;
    }
}

// Function to handle message keys
function handleMessageKeys(message) {
    try {
        if (!message || !message.key) {
            throw new Error('Invalid message format.');
        }

        const { remoteJid, fromMe, id, participant } = message.key;
        const isSelf = fromMe || false;
        const isGroup = remoteJid.endsWith('@g.us');
        const from = jidDecode(remoteJid);
        const sender = isGroup ? jidDecode(participant || '') : isSelf ? jidDecode(client.user.jid) : from;

        console.log('Message keys:', { remoteJid, fromMe, id, isSelf, isGroup, from, sender });
    } catch (error) {
        console.error('Error handling message keys:', error);
        throw error; // Propagate the error if needed
    }
}

// Function to handle message content
function handleMessageContent(message) {
    try {
        const contentType = getContentType(message);
        console.log('Message content type:', contentType);
        // Handle different content types as needed
    } catch (error) {
        console.error('Error handling message content:', error);
        throw error; // Propagate the error if needed
    }
}

// Function to handle ephemeral messages
function handleEphemeralMessage(message) {
    try {
        if (proto.WebMessageInfo && proto.WebMessageInfo.is(message.message)) {
            const ephemeralMessage = proto.WebMessageInfo.get(message.message);
            console.log('Ephemeral message:', ephemeralMessage);
            // Use getContentType if necessary
            const contentType = getContentType(ephemeralMessage);
            console.log('Ephemeral message content type:', contentType);
        }
    } catch (error) {
        console.error('Error handling ephemeral message:', error);
        throw error; // Propagate the error if needed
    }
}

// Function to handle view-once messages
function handleOnceMessage(message) {
    try {
        if (message.message && message.message.contextInfo && message.message.contextInfo.quotedMessage) {
            const quotedMessage = message.message.contextInfo.quotedMessage;
            console.log('Once message:', quotedMessage);
            // Use getContentType if necessary
            const contentType = getContentType(quotedMessage);
            console.log('Once message content type:', contentType);
        }
    } catch (error) {
        console.error('Error handling once message:', error);
        throw error; // Propagate the error if needed
    }
}

// Function to handle quoted messages
async function handleQuotedMessage(message) {
    try {
        if (message.message && message.message.extendedTextMessage && message.message.extendedTextMessage.contextInfo) {
            const { quotedMessage } = message.message.extendedTextMessage.contextInfo;
            if (quotedMessage) {
                const { url, mimetype } = await downloadMedia(quotedMessage);
                console.log('Quoted message media:', { url, mimetype });
                // Use getContentType if necessary
                const contentType = getContentType(quotedMessage);
                console.log('Quoted message content type:', contentType);
            }
        }
    } catch (error) {
        console.error('Error handling quoted message:', error);
        throw error; // Propagate the error if needed
    }
}

// Function to extract mentions
function extractMentions(message) {
    try {
        if (message.message && message.message.extendedTextMessage && message.message.extendedTextMessage.contextInfo) {
            const { mentionedJidList } = message.message.extendedTextMessage.contextInfo;
            console.log('Mentions:', mentionedJidList);
        }
    } catch (error) {
        console.error('Error extracting mentions:', error);
        throw error; // Propagate the error if needed
    }
}

// Function to extract message body
function extractMessageBody(message) {
    try {
        if (message.message && message.message.extendedTextMessage) {
            const messageBody = message.message.extendedTextMessage.text;
            console.log('Message body:', messageBody);
        }
    } catch (error) {
        console.error('Error extracting message body:', error);
        throw error; // Propagate the error if needed
    }
}

// Example usage
async function handleIncomingMessage(msg, sock) {
    try {
        // Define reply function on msg object
        msg.reply = async (text) => {
            try {
                await sendMessage(sock, { 
                    text: text,
                    quoted: msg 
                });
                console.log('Replied to message:', text);
            } catch (error) {
                console.error('Error replying to message:', error);
                throw error; // Propagate the error if needed
            }
        };

        // Decode JID example
        const { user, server } = decodeJid(msg.key.remoteJid);
        console.log('Sender:', user, 'Server:', server);

        // Example usage of the dynamically defined reply function
        await msg.reply("This is a reply message.");

        // Additional logic as needed
    } catch (error) {
        console.error('Error handling incoming message:', error);
        // Handle or propagate the error as needed
    }
}

// Function to generate forward message content
function generateForwardMessageContent(message) {
    try {
        if (!message) {
            throw new Error('Message object is required.');
        }

        const { key, message: msgContent } = message;

        if (!key || !msgContent) {
            throw new Error('Invalid message format.');
        }

        // Check if it's a media message
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

        // Check if it's a text message
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

        // Handle other types of messages as needed
        throw new Error('Unsupported message type.');
    } catch (error) {
        console.error('Error generating forward message content:', error);
        throw error; // Propagate the error if needed
    }
}

module.exports = {
    downloadMedia,
    handleMessageKeys,
    handleMessageContent,
    handleEphemeralMessage,
    handleOnceMessage,
    extractMentions,
    handleQuotedMessage,
    extractMessageBody,
    generateForwardMessageContent,
    handleIncomingMessage // Export the handleIncomingMessage function
};
