const config = require('../config');
const commands = [];

function defineCommand(commandInfo) {
  const defaultOptions = {
    category: "core",
  };

  const command = { ...defaultOptions, ...commandInfo };

  if (command.pattern) {
    command.pattern = new RegExp(`^${config.PREFIX}${command.pattern}`, "is");
  }

  commands.push(command);
  return command;
}

async function pushCommand(userInput) {
  for (let command of commands) {
    const match = userInput.match(command.pattern);
    if (match) {
      const parameters = match.slice(1);
      await command.handler(...parameters);
      return;
    }
  }

console.log(pushCommand);
}

module.exports = {
  defineCommand,
  pushCommand,
  commands,
};
      
