const { commands, Meta } = require('../lib');
const fs = require('fs');
const config = require('../config');
const path = require('path');
const { MessageType } = require('@whiskeysockets/baileys');

Meta({
  command: 'exe',
  category: 'propriétaire',
  filename: __filename,
  handler: async (sock, message, args, author, languages) => {
    const { from } = message;
    if(!author) {
      return sock.sendMessage(from, { text: languages[config.LANGUAGE].OWNER_MSG}, MessageType.text);
    const [Ext] = args;
    if (!Ext) {
      return sock.sendMessage(from, { text: 'Veuillez fournir un nom de fichier\n naxor.js' }, { quoted: message });
    }   const fileExt = path.extname(Ext);
    if (fileExt !== '.js') {
      return sock.sendMessage(from, { text: '*Seulement les fichiers .js*' }, { quoted: message });
    }   const filePath = path.join(__dirname, Ext);
      try {
      if (!fs.existsSync(filePath)) {
        return sock.sendMessage(from, { text: '*_Fichier non trouvé_*' }, { quoted: message });
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
  category: 'propriétaire',
  filename: __filename,
  handler: async (sock, message, args, author, languages) => {
    const { from } = message;
if(!author){
return sock.sendMessage(from,{text: languages[config.LANGUAGE].OWNER_MSG});
    if (!args.length) {
      await sock.sendMessage(from, { text: `langues: en, sn, ml, zu` });
      return;
    }
    const newLang = args[0].toLowerCase();
    if (!['en', 'sn', 'ml', 'zu'].includes(newLang)) {
      await sock.sendMessage(from, { text: 'Veuillez choisir parmi: en, sn, ml, zu' });
      return;
    } config.LANGUAGE = newLang;
    await sock.sendMessage(from, { text: `Langue changée:${newLang}` });
  },
});

Meta({
  command: 'cmd',
  category: 'propriétaire',
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
      return sock.sendMessage(from, { text: "*cmd* <enable|disable> <nom_commande>" });
    } const action = args[0].toLowerCase();
    const cmd_naxor = args[1].toLowerCase();
const toggle_cmd = commands.find(cmd => cmd.command === cmd_naxor);
    if (!toggle_cmd) {
      return sock.sendMessage(from, { text: `"${cmd_naxor}" non trouvé` });
    }
if (action === 'enable') {
      toggle_cmd.enabled = true;
      toggle_cmd.get_time = null;
      sock.sendMessage(from, { text: `"${cmd_naxor}" a été activé` });
    } else if (action === 'disable') {
      toggle_cmd.enabled = false;
      toggle_cmd.get_time = new Date();
      sock.sendMessage(from, { text: `"${cmd_naxor}" a été désactivé` });
    } else {
      sock.sendMessage(from, { text: "*utilisez* 'enable' ou 'disable'" });
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
    const x_astral_cn = `*Commande:* ${command.command}_désactivée_\n*Heure:* _${get_time}_\n*Catégorie:* _${command.category}_`;
    return sock.sendMessage(from, { text: x_astral_cn });
  }  if (typeof command.handler === 'function') {
    await command.handler(sock, message, args);
  }
});

Meta({
  command: 'status',
  category: 'propriétaire',
  filename: __filename,
  handler: async (sock, message, args, author, languages) => {
    const { from } = message;
    if (!author) {
      return sock.sendMessage(from, { text: languages[config.LANGUAGE].OWNER_MSG });
    }   if (args.length < 1) {
      return sock.sendMessage(from, { text: "*status* <nom_commande>" });
    }   const naxors = args[0].toLowerCase();
    const command = commands.find(cmd => cmd.command === naxors);
    const str_z = `*CMD:* ${command.command}\n*Statut:* ${command.enabled ? 'Activé' : 'Désactivé'}\n${command.get_time ? '*Heure:* ' + command.get_time.toLocaleString() : ''}`;
    return sock.sendMessage(from, { text: str_z});
  }
});

Meta({
    command: 'antilink ?(*)',
    category: 'groupe',
    handler: async (sock, args, message, isGroup, author) => {
        const { from } = message;

      if (!isGroup) {
            await sock.sendMessage(from, { text: 'Cette commande ne peut être utilisée que dans un groupe' });
            return;
        } if (!author) {
            await sock.sendMessage(from, { text: 'désolé mais Vous n\'êtes pas autorisé' });
            return;
         } if (!config.antilink) {
            config.antilink = {};
        } const enableCmd = ['on', 'enable'];
        const disableCmd = ['off', 'disable'];
        const Cmd = ['info'];
        if (enableCmd.includes(args[0])) {
            if (config.antilink[from]) {
                await sock.sendMessage(from, { text: 'Antilink est déjà activé' });
            } else {
                config.antilink[from] = true;
                await sock.sendMessage(from, { text: 'Antilink a été activé' });
            }
        } else if (disableCmd.includes(args[0])) {
            if (!config.antilink[from]) {
                await sock.sendMessage(from, { text: 'Antilink est déjà désactivé' });
            } else {
                config.antilink[from] = false;
                await sock.sendMessage(from, { text: 'Antilink a été désactivé' });
            } } else if (Cmd.includes(args[0])) {
            const status = config.antilink[from] ? 'ON' : 'OFF';
            const footer = `*GESTIONNAIRE ANTILINK*\nStatut: ${status}`;
            await sock.sendMessage(from, { text: footer });
        } else {
            await sock.sendMessage(from, { text: `${config.PREFIX}antilink "on", "off", "enable", "disable", ou "info"` });
        }
    }
});
