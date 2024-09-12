const { Meta } = require('../lib/');
const config = require('../config');

Meta({
    command: 'echo',
    category: 'fun',
    handler: async (sock, args, message) => {
        const { from } = message;
        const [text, repeatCount] = args.join(' ').split('|').map(str => str.trim());

        if (!text || !repeatCount) {
            await sock.sendMessage(from, { text: `Usage : ${config.prefix}echo [texte] | [nombre de répétitions]` }, { quoted: message });
            return;
        }

        const count = parseInt(repeatCount, 10);
        if (isNaN(count) || count <= 0) {
            await sock.sendMessage(from, { text: 'Veuillez spécifier un nombre de répétitions valide.' }, { quoted: message });
            return;
        }

        let repeatedText = '';
        for (let i = 0; i < count; i++) {
            repeatedText += `${text}\n`;
        }

        await sock.sendMessage(from, { text: repeatedText }, { quoted: message });
    }
});
