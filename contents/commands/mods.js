const { defineCommand } = require('../../lib/commands');
const config = require('../../config');

defineCommand({
    pattern: 'mods',
    category: 'misc',
    handler: async (sock, msg) => {
        try {
             const modz = config.MODS.map(mod => `- ${mod}`).join('\n');
             const Content = `
*🌟 Moderators List 🌟*

${modz}
`;
            await sock.sendMessage(msg.chat, {
                text: Content,
                quoted: msg,
            });

        } catch (error) {
            console.error(error);
        }
    }
});
      
