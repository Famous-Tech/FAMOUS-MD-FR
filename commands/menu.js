const { commands, Meta } = require('../lib/'); 
const config = require('../config'); // Adjust the path as needed

Meta({
    command: 'menu',
    category: 'mics',
    handler: async (sock, args, message) => {
        const { from } = message;

        const groupedCommands = commands.reduce((acc, cmd) => {
            const { category, command, filename, description } = cmd;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({ command, filename, description });
            return acc;
        }, {});

        
        let menuText = 'Menu:\n';
        
        Object.keys(groupedCommands).forEach(category => {
            menuText += `\n${category.toUpperCase()}:\n`;
            groupedCommands[category].forEach(cmd => {
                const { command, filename, description } = cmd;
                menuText += `- ${command}: ${description || 'No description'}\n`;
            });
        });

        await sock.sendMessage(from, { text: menuText });
    }
});
  
