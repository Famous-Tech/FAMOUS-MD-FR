const fs = require('fs');
const { exec } = require('child_process');

const getCommands = () => {
    const commandsDirectory = '../contents/commands';
    fs.readdir(commandsDirectory, (err, files) => {
        if (err) {
            console.error(`${err}`);
            return;
        }
        files.filter(file => file.endsWith('.js')).forEach(file => {
            const filePath = `${commandsDirectory}/${file}`;
            const commands = fs.readFileSync(filePath, 'utf8').split('\n');
            commands.forEach(command => {
                if (command.trim().startsWith('start')) {
                    console.log(`Executing command: ${command.trim()}`);
                    exec(command.trim(), (error, stdout, stderr) => {
                        if (error) {
                            console.error(`${error}`);
                            return;
                        }
                        if (stderr) {
                            console.error(`stderr: ${stderr}`);
                            return;
                        }
                        console.log(`stdout: ${stdout}`);
                    });
                }
            });
        });
    });
};

module.exports = { getCommands };
                    
