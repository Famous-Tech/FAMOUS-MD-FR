const { commands, Meta } = require('../lib/');

const economy_store = {};
const get_Points = (userId) => {
  return economy_store[userId] ? economy_store[userId].points : 0;
};
const get_Diamonds = (userId) => {
  return economy_store[userId] ? economy_store[userId].diamonds : 0;
};
const get_Gold = (userId) => {
  return economy_store[userId] ? economy_store[userId].gold : 0;
};
const update_eco = (userId, points = 0, diamonds = 0, gold = 0) => {
  if (!economy_store[userId]) {
    economy_store[userId] = { points: 0, diamonds: 0, gold: 0 };
  }
  economy_store[userId].points += points;
  economy_store[userId].diamonds += diamonds;
  economy_store[userId].gold += gold;
};
const cent_xp = (userId, points) => {
  return get_Points(userId) >= points;
};
const Get_XP = () => {
  return Math.floor(Math.random() * (500 - 50 + 1)) + 50;
};
const soccer_table = (slots) => {
  return `
-----------------------
|  ${slots[0][0]}  |  ${slots[0][1]}  |  ${slots[0][2]}  |
-----------------------
|  ${slots[1][0]}  |  ${slots[1][1]}  |  ${slots[1][2]}  |
-----------------------
|  ${slots[2][0]}  |  ${slots[2][1]}  |  ${slots[2][2]}  |
-----------------------
`;
};

Meta({
  command: 'slot',
  category: 'jeux',
  filename: 'slot.js',
  handler: async (sock, message, args, author) => {
    const { from } = message;
    const slot_str = ['🍒', '🍋', '🍉', '🍇', '🔔', '⭐', '7️⃣'];
    if (args.length === 0) {
      await sock.sendMessage(from, { text: 'Veuillez spécifier le montant de points à parier\nUtilisation: slot [points]' });
      return;
    }
    const seck_mone = parseInt(args[0], 10);
    if (isNaN(seck_mone) || seck_mone <= 0) {
      await sock.sendMessage(from, { text: 'Points invalides: Veuillez entrer un nombre de points valide' });
      return;
    }
    if (!cent_xp(author, seck_mone)) {
      const currents = get_Points(author);
      await sock.sendMessage(from, { text: `_Vous n'avez pas assez de points_` });
      return;
    }
    const x_ser = () => slot_str[Math.floor(Math.random() * slot_str.length)];
    const slots = [
      [x_ser(), x_ser(), x_ser()],
      [x_ser(), x_ser(), x_ser()],
      [x_ser(), x_ser(), x_ser()],
    ];
    const naxors = soccer_table(slots);
    let milti_winner= 0;
    let uwubani = '';
    if (slots[0].every((val, i) => val === slots[1][i] && val === slots[2][i])) {
      if (slots[0][0] === '7️⃣') {
        multi_winner = 100;
        uwubani = 'Diamant';
      } else {
        multi_winner = 50;
        uwubani = 'Or';
      }
    } else if (slots.flat().some((val, i) => (val === slots[0][i % 3] && val === slots[1][i % 3]) || (val === slots[1][i % 3] && val === slots[2][i % 3]))) {
      multi_winner = 25;
      uwubani = 'Argent';
    } else {
      multi_winner = -1;
    }
    let changed = 0;
    let diamonds_str = 0;
    let gold_str = 0;

    if (multi_winner === -1) {
      changed = seck_mone;
    } else {
      changed = seck_mone * multi_winner;
      if (uwubani === 'Diamant') {
        diamonds_str = 1;  
      } else if (uwubani === 'Or') {
        gold_str = 1;  
      }
    }
    update_eco(author, changed, diamonds_str, gold_str);
    const ama_points = get_Points(author);
    const wayiwayi = get_Diamonds(author);
    const magolide = get_Gold(author);
    const naxor_ser = `
*🎰 Machine à Sous 🎰*
${naxors}
${multi_winner > 0 
      ? `🎉 Félicitations, vous avez gagné _${changed}_, gagné ${diamonds_str ? '1 Diamant' : gold_str ? '1 Or' : ''}` 
      : `😢 Désolé, vous avez perdu _${seck_mone} p_`}
      
*💰 Solde Bancaire*: _${ama_points} p_
*💎 Diamants*: _${wayiwayi}_
*🏆 Or*: _${magolide}_
    `;
await sock.sendMessage(from, { text: naxor_ser });
  },
});

Meta({
  command: 'spin',
  category: 'jeux',
  filename: 'spin.js',
  handler: async (sock, message, author) => {
    const { from } = message;

    const xps = Get_XP();
    update_eco(author, xps);
    const str_cs = get_Points(author);
    const spun = `
      *🎉 Vous avez gagné:* _${xps} p_
      *💰 Votre solde est de:* _${str_cs} p_
    `;
    await sock.sendMessage(from, { text: spun });
  },
});
