const { commands, Meta, Unicode } = require('../lib/');
const config = require('../config');

Meta({
    command: 'menu', // FAMOUS-MD MENU commande du menu🙂
    handler: async (sock, args, message, author) => {
        const { from } = message;
      
        const text = args.join(' ');
        if (text.startsWith(`${config.PREFIX}list`)) {
            let list_str = '𝐋𝐢𝐬𝐭𝐞 𝐝𝐞𝐬 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐞𝐬:\n';
            commands.forEach(cmd => {
                list_str += `- ${Unicode(cmd.command)}\n`;
            });

            await sock.sendMessage(from, { text: list_str });
            return;
        }

        const [prefix, filename, command_name] = text.split(' ');
        if (prefix === config.PREFIX && filename && command_name) {
            const cmd = commands.find(cmd => cmd.command === command_name);
            if (cmd) {
                const { category, description } = cmd;
                const details_str = `✦ 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐞: ${Unicode(command_name)}\n` +
                                    `✦ 𝐅𝐢𝐜𝐡𝐢𝐞𝐫: ${filename}\n` +
                                    `✦ 𝐂𝐚𝐭é𝐠𝐨𝐫𝐢𝐞: ${Unicode(category)}\n` +
                                    `✦ 𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧: ${Unicode(description)}`;

                await sock.sendMessage(from, { text: details_str });
                return;
            } else {
                await sock.sendMessage(from, { text: '3ccr' });
                return;
            }
        }

        const cmd_str = commands.reduce((acc, cmd) => {
            const { category, command, description } = cmd;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({ command, description });
            return acc;
        }, {});
        let menu_str = `╭───╼〔 *_FAMOUS-MD_* 〕\n`;
        menu_str += `┃ ✦ ${Unicode('Propriétaire')} : ${config.OWNER}\n`;
        menu_str += `┃ ✦ ${Unicode('Utilisateur')} : ${author}\n`;
        menu_str += `┃ ✦ ${Unicode('Mode')} : ${config.MODE}\n`;
        menu_str += `┃ ✦ ${Unicode('Version')} : ${config.VERSION}\n`;
        menu_str += `┃ ✦ ${Unicode('Développeur')} : FAMOUS-TECH 💫`;
        menu_str += `╰──────────╼\n`;

        Object.keys(cmd_str).forEach(category => {
            menu_str += `╭───╼〔 ${Unicode(category.toUpperCase())} 〕\n`;
            cmd_str[category].forEach(cmd => {
                const { command } = cmd;
                menu_str += `┃ ∘ ${Unicode(command)}\n`;
            });
            menu_str += `╰──────────╼\n`;
        });
        await sock.sendMessage(from, { image: 'https://telegra.ph/file/1d083f2cc089db688a191.jpg', text: menu_str });
    }
});

Meta({
    command: 'alive',
    category: 'utilitaire',
    handler: async (sock, args, message) => {
        const { from } = message;
        const alive_str = `
╭───╼〔*Statut du Bot*〕
            
🟢 *Bot en ligne*
🕒 *Heure:* ${new Date().toLocaleTimeString()}
📅 *Date:* ${new Date().toLocaleDateString()}

╰──────────╼
`; await sock.sendMessage(from, { image: 'https://telegra.ph/file/1d083f2cc089db688a191.jpg', text: alive_str });
    }
});
