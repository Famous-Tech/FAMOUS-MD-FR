const { defineCommand } = require('../../lib/commands.js'); 

defineCommand({
    pattern: 'ping',
    category: 'mics',
    handler: async (sock, msg) => {
        
        const start = new Date().getTime();
        const edited = await sock.sendMessage(msg.chat, { text: '🏓 Pinging...' }, { quoted: msg });

        const end = new Date().getTime();
        const TripTime = end - start;
        await sock.sendMessage(msg.chat, {
            text: `🏓 Pong!: \`${TripTime} ms`,
            edit: edited.key 
        });
    }
});
