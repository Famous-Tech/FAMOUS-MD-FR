const config = require('../config'); // FAMOUS-TECH🌐
const commands = [];

function Meta({ command, category, filename }, handler) {
  const syt = [config.PREFIX];
  if (!syt.some(prefix => command.startsWith(prefix))) {
    return;
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
