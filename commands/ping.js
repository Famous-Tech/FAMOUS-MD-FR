const { command, Meta } = require('../lib/'); 

Meta({
    command: 'ping',
    category: 'mics',
    handler: async (sock, matchedCommand, message) => {
        
        const start = new Date().getTime();
        const edited = await sock.sendMessage(message.chat, { text: '🏓 Pinging...' }, { quoted: message });

        const end = new Date().getTime();
        const TripTime = end - start;
        await sock.sendMessage(message.chat, {
            text: `🏓 Pong!: \`${TripTime} ms`,
            edit: edited.key 
        });
    }
});
