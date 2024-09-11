const { commands, Meta } = require('../lib/'); 

Meta({
    command: 'ping',
    category: 'mics',
    handler: async (sock, args, message) => {
        const { from } = message;
        const start = new Date().getTime();
        const edited = await sock.sendMessage(from, { text: '_*Calcul de la vitesse...*_' }, { quoted: message });

        const end = new Date().getTime();
        const TripTime = end - start;
        await sock.sendMessage(from, {
            text: `Vitesss : \`${TripTime} ms`,
            edit: edited.key 
        });
    }
});
