const { commands, Meta } = require('../lib');
const fs = require('fs');
const path = require('path');
const { MessageType } = require('@whiskeysockets/baileys');

Meta({
  command: 'exe',
  category: 'owner',
  filename: __filename,
  handler: async (sock, message, args) => {
    const { from } = message;
    const [Ext] = args;
    if (!Ext) {
      return sock.sendMessage(from, { text: 'Please provide a filename\n naxor.js' }, { quoted: message });
    }   const fileExt = path.extname(Ext);
    if (fileExt !== '.js') {
      return sock.sendMessage(from, { text: '*Only .js files*' }, { quoted: message });
    }   const filePath = path.join(__dirname, Ext);
      try {
      if (!fs.existsSync(filePath)) {
        return sock.sendMessage(from, { text: '*_File not found_*' }, { quoted: message });
      } const code = fs.readFileSync(filePath, 'utf8');
      const sandbox = { sock, from, console, require };
      const func = new Function('sandbox', 'with (sandbox) { ' + code + ' }');
      func(sandbox);
    } catch (error) {
      console.error(error);
          }
  },
});
