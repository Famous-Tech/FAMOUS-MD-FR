const { defineCommand } = require('../../lib/commands');
const config = require('../../config');

defineCommand({
    pattern: /^add-mod (.+)/i,
    category: 'admin',
    handler: async (sock, msg, match, {isDev}) => {
        try {
            if(!isDev) {
              return msg.reply('This is for my owner');
            }
            const mentioned = msg.mentions.map(mention => mention.split('@')[0]);
            const new_Mods = [];

            for (const user of mentioned) {
                if (!config.MODS.includes(user)) {
                    config.MODS.push(user); 
                    new_Mods.push(user);
                }
            }

            if (new_Mods.length > 0) {
                const message = `
Successfully added:
${new_Mods.map(mod => `- ${mod}`).join('\n')}
`;

                await sock.sendMessage(msg.chat, {
                    text: message,
                    quoted: msg,
                });
            } else {
                await sock.sendMessage(msg.chat, {
                    text: 'No moderator added',
                    quoted: msg,
                });
            }

        } catch (error) {
            console.error(error);
        }
    }
});
                                                    
