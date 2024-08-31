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

const get_Backstory = (role) => {
    const backstories = {
        "🌾 Farmer": "A humble individual who tends the fields, ensuring the guild is well-fed.",
        "🛡️ Squire": "An aspiring knight, learning the art of combat and honor.",
        "🏹 Ranger": "A skilled scout with an uncanny ability to navigate and survive in the wild.",
        "⚔️ Knight": "A seasoned warrior with a strong sense of duty and protection.",
        "🐉 Dragon Rider": "One of the elite few who has tamed a dragon and commands its power.",
        "🧙‍♂️ Archmage": "A master of arcane arts, wielding powerful spells and ancient knowledge.",
        "👑 High King": "A revered leader with the wisdom and strength to rule and guide the guild.",
        "🌠 Celestial": "A mystical being with cosmic influence, transcending ordinary existence.",
        "⚔️ Grandmaster": "The ultimate leader, revered by all, with unmatched skill and respect.",
        "🌌 Eternal": "A legendary figure who has transcended time and space, embodying the essence of eternity."
    };
    return backstories[role] || "No";
};

const determineRole = (Activit) => {
    if (Activit <= 10) {
        return "🌾 Farmer";
    } else if (Activit <= 20) {
        return "🛡️ Squire";
    } else if (Activit <= 30) {
        return "🏹 Ranger";
    } else if (Activit <= 40) {
        return "⚔️ Knight";
    } else if (Activit <= 50) {
        return "🐉 Dragon Rider";
    } else if (Activit <= 60) {
        return "🧙‍♂️ Archmage";
    } else if (Activit <= 70) {
        return "👑 High King";
    } else if (Activit <= 80) {
        return "🌠 Celestial";
    } else if (Activit <= 90) {
        return "⚔️ Grandmaster";
    } else {
        return "🌌 Eternal";
    }
};
Meta({
    command: 'profile',
    category: 'mics',
    filename: 'user',
    handler: async (sock, message, args, author, mentionedJid) => {
        const { from } = message;
        const target_str = mentionedJid.length > 0 ? mentionedJid[0] : author;
        const Activit = Math.floor(Math.random() * 100);
        const role_str = determineRole(Activit);
        const Backstory = get_Backstory(role_str);
         try{ const profilePictureUrl = await sock.profilePictureUrl(target_str, 'image').catch(() => 'No PP');
            const contact = await sock.onWhatsApp(target_str);
        if (contact && contact[0]) {
            const capo_menu = `
         *Name:* ${contact[0].notify || ''}
         *Bio:* ${contact[0].status || ''}
         *Role:* ${role_str}
         *Backstory:* ${Backstory}
              `; 
         await sock.sendMessage(from, { 
           image: { url: profilePictureUrl },
           text: capo_menu });
            } else {
            }
        } catch (error) {
            console.error(error);
        }
    }
});
