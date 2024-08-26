const { commands, Meta, Unicode } = require('../lib/'); 
const config = require('../config'); 

Meta({
    command: 'menu',
    category: 'mics',
    handler: async (sock, args, message) => {
        const { from } = message;

        const cmd_str = commands.reduce((acc, cmd) => {
            const { category, command, filename, description } = cmd;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({ command, filename, description });
            return acc;
        }, {});

        
        let menu_str = '╭───╼〔 𝐗-𝐀𝐒𝐓𝐑𝐀𝐋 𝐁𝐎𝐓 〕
┃ ✦ ${Unicode('Owner')} : ${config.OWNER}
┃ ✦ ${Unicode('User')} : 
┃ ✦ ${Unicode('Mode')} : ${config.MODE}
┃ ✦ ${Unicode('Version')} : ${config.VERSION}
╰──────────╼\n';
        
        Object.keys(cmd_str).forEach(category => {
            menu_str += `╭───╼〔 ${Unicode(category.toUpperCase())} 〕\n`;
            cmd_str[category].forEach(cmd => {
                const { command, filename, description } = cmd;
                menu_str += `┃ ∘ ${Unicode(command)}\n`;
            });
        });

        menu_str += `╰──────────╼`;
        
        await sock.sendMessage(from, { text: menu_str });
    }
});
  
