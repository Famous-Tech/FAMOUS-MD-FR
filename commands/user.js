const { commands, Meta } = require('../lib/');
const config = require('../config');

Meta({
  command: 'owner',
  category: 'mics',
  filename: 'contact.js',
  handler: async (sock, message, args) => {
    const { from } = message;

    const owner_name = config.OWNER_NAME;
    const owner_num = config.MODS[0];
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${owner_name}
TEL;type=CELL;type=VOICE;waid=${owner_num}:${owner_num}
END:VCARD`;
   const message_str = {
      contacts: {
        displayName: owner_name,
        contacts: [{ vcard }],
      },
      contextInfo: {
        externalAdReply: {
          title: "Owners_Num",
          body: "save_owners_contact",
          mediaType: 2,
          thumbnailUrl: "https://i.imgur.com/jQWY9mm.jpeg",
          mediaUrl: "https://x-astral.com", 
          sourceUrl: "https://x-astral.com", 
        },
      },
    };

    await sock.sendMessage(from, message_str);
  },
});
