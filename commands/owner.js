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

Meta({
  command: 'cmd',
  category: 'owner',
  filename: __filename,
  handler: async (sock, message, args, author, languages) => {
    
    const { from } = message;
commands.forEach(cmd => {
  if (cmd.enabled === undefined) {
    cmd.enabled = true; 
    cmd.get_time = null;
  }
});
    if (!author) {
      return sock.sendMessage(from, { text: languages[config.LANGUAGE].OWNER_MSG });
    } if (args.length < 2) {
      return sock.sendMessage(from, { text: "*cmd* <enable|disable> <command_name>" });
    } const action = args[0].toLowerCase();
    const cmd_naxor = args[1].toLowerCase();
const toggle_cmd = commands.find(cmd => cmd.command === cmd_naxor);
    if (!toggle_cmd) {
      return sock.sendMessage(from, { text: `"${cmd_naxor}" not found` });
    }
if (action === 'enable') {
      toggle_cmd.enabled = true;
      toggle_cmd.get_time = null;
      sock.sendMessage(from, { text: `"${cmd_naxor}" has been enabled` });
    } else if (action === 'disable') {
      toggle_cmd.enabled = false;
      toggle_cmd.get_time = new Date();
      sock.sendMessage(from, { text: `"${cmd_naxor}" has been disabled` });
    } else {
      sock.sendMessage(from, { text: "*use* 'enable' or 'disable'" });
    }
  }
});
sock.on('message', async message => {
  const { from, body } = message;
  const args = body.trim().split(/\s+/);
  const cmd_naxor = args[0].toLowerCase();
  const command = commands.find(cmd => cmd.command === cmd_naxor);
  if (!command) return; 
  if (!command.enabled) {
    const get_time = command.get_time ? command.get_time.toLocaleString() : "";
    const x_astral_cn = `*Command:* ${command.command}_disabled_\n*Time:* _${get_time}_\n*Category:* _${command.category}_`;
    return sock.sendMessage(from, { text: x_astral_cn });
  }  if (typeof command.handler === 'function') {
    await command.handler(sock, message, args);
  }
});

Meta({
  command: 'status',
  category: 'owner',
  filename: __filename,
  handler: async (sock, message, args, author, languages) => {
    const { from } = message;
    if (!author) {
      return sock.sendMessage(from, { text: languages[config.LANGUAGE].OWNER_MSG });
    }   if (args.length < 1) {
      return sock.sendMessage(from, { text: "*status* <command_name>" });
    }   const naxors = args[0].toLowerCase();
    const command = commands.find(cmd => cmd.command === naxors);
    const str_z = `*CMD:* ${command.command}\n*Status:* ${command.enabled ? 'Enabled' : 'Disabled'}\n${command.get_time ? '*Time:* ' + command.get_time.toLocaleString() : ''}`;
    return sock.sendMessage(from, { text: str_z});
  }
});
