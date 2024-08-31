const { commands, Meta } = require('../lib');
const fs = require('fs');
const config = require('../config');
const path = require('path');
const { MessageType } = require('@whiskeysockets/baileys');

Meta({
  command: 'exe',
  category: 'owner',
  filename: __filename,
  handler: async (sock, message, args, author, languages) => {
    const { from } = message;
    if(!author) {
      return sock.sendMessage(from, { text: languages[config.LANGUAGE].OWNER_MSG}, MessageType.text);
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

Meta({
  command: 'lang',
  category: 'owner',
  filename: __filename,
  handler: async (sock, message, args, author, languages) => {
    const { from } = message;
if(!author){
return sock.sendMessage(from,{text: languages[config.LANGUAGE].OWNER_MSG});
    if (!args.length) {
      await sock.sendMessage(from, { text: `languages: en, sn, ml, zu` });
      return;
    }
    const newLang = args[0].toLowerCase();
    if (!['en', 'sn', 'ml', 'zu'].includes(newLang)) {
      await sock.sendMessage(from, { text: 'Please choose from: en, sn, ml, zu' });
      return;
    } config.LANGUAGE = newLang;
    await sock.sendMessage(from, { text: `Language changed:${newLang}` });
  },
});
