const config = require('../config');
const commands = [];

function Meta({ command, category, locked, filename }, handler) {
  const syt = [config.PREFIX];

  if (!syt.some(prefix => command.startsWith(prefix))) {
  }

  commands.push({
    command,
    category,
    filename,
    handler,
  });
}

module.exports = {
  Meta,
  commands,
};
