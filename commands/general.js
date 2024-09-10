const { commands, Meta, Unicode } = require('../lib/');
const config = require('../config');

Meta({
    command: 'menu',
    category: 'utility',
    handler: async (sock, args, message, author) => {
        const { from } = message;
      
        const text = args.join(' ');
        if (text.startsWith(`${config.PREFIX}list`)) {
            let list_str = '𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬 𝐋𝐢𝐬𝐭:\n';
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
                const details_str = `✦ 𝐂𝐨𝐦𝐦𝐚𝐧𝐝: ${Unicode(command_name)}\n` +
                                    `✦ 𝐅𝐢𝐥𝐞𝐧𝐚𝐦𝐞: ${filename}\n` +
                                    `✦ 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐲: ${Unicode(category)}\n` +
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

        let menu_str = `╭───╼〔 𝐗-𝐀𝐒𝐓𝐑𝐀𝐋 〕\n`;
        menu_str += `┃ ✦ ${Unicode('Owner')} : ${config.OWNER}\n`;
        menu_str += `┃ ✦ ${Unicode('User')} : ${author}\n`;
        menu_str += `┃ ✦ ${Unicode('Mode')} : ${config.MODE}\n`;
        menu_str += `┃ ✦ ${Unicode('Version')} : ${config.VERSION}\n`;
        menu_str += `╰──────────╼\n`;

        Object.keys(cmd_str).forEach(category => {
            menu_str += `╭───╼〔 ${Unicode(category.toUpperCase())} 〕\n`;
            cmd_str[category].forEach(cmd => {
                const { command } = cmd;
                menu_str += `┃ ∘ ${Unicode(command)}\n`;
            });
            menu_str += `╰──────────╼\n`;
        });

        await sock.sendMessage(from, { text: menu_str });
    }
});

Meta({
    command: 'alive',
    category: 'utility',
    handler: async (sock, args, message) => {
        const { from } = message;
        const alive_str = `
╭───╼〔*Bot Status*〕
            
🟢 *Bot is Alive*
🕒 *Time:* ${new Date().toLocaleTimeString()}
📅 *Date:* ${new Date().toLocaleDateString()}

╰──────────╼
`; await sock.sendMessage(from, { image: 'https://f.uguu.se/BuFAPRQO.jpg'{ text: alive_str }});
    }
});
               
