const { commands, Meta } = require('../lib/'); 
const config = require('../config'); // Adjust the path as needed

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
┃ ✦ Owner : ${config.OWNER}
┃ ✦ User : 
┃ ✦ Mode : ${config.MODE}
┃ ✦ Version : ${config.VERSION}
╰──────────╼\n';
        
        Object.keys(cmd_str).forEach(category => {
            menu_str += `╭───╼〔 ${category.toUpperCase()} 〕\n`;
            cmd_str[category].forEach(cmd => {
                const { command, filename, description } = cmd;
                menu_str += `┃ ∘ ${command}\n`;
            });
        });

        menu_str += `╰──────────╼`;
        
        await sock.sendMessage(from, { text: menu_str });
    }
});
  
