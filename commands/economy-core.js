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
  category: 'games',
  filename: 'slot.js',
  handler: async (sock, message, args, author) => {
    const { from } = message;
    const slot_str = ['🍒', '🍋', '🍉', '🍇', '🔔', '⭐', '7️⃣'];
    if (args.length === 0) {
      await sock.sendMessage(from, { text: 'Please specify the amount of points to bet\nUsage: slot [points]' });
      return;
    }
    const seck_mone = parseInt(args[0], 10);
    if (isNaN(seck_mone) || seck_mone <= 0) {
      await sock.sendMessage(from, { text: 'Invalid points: Please enter a valid points' });
      return;
    }
    if (!cent_xp(author, seck_mone)) {
      const currents = get_Points(author);
      await sock.sendMessage(from, { text: `_You do not have enough points_` });
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
        uwubani = 'Diamond';
      } else {
        multi_winner = 50;
        uwubani = 'Gold';
      }
    } else if (slots.flat().some((val, i) => (val === slots[0][i % 3] && val === slots[1][i % 3]) || (val === slots[1][i % 3] && val === slots[2][i % 3]))) {
      multi_winner = 25;
      uwubani = 'Silver';
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
      if (uwubani === 'Diamond') {
        diamonds_str = 1;  
      } else if (uwubani === 'Gold') {
        gold_str = 1;  
      }
    }
    update_eco(author, changed, diamonds_str, gold_str);
    const ama_points = get_Points(author);
    const wayiwayi = get_Diamonds(author);
    const magolide = get_Gold(author);
    const naxor_ser = `
*🎰 Slot Machine 🎰*
${naxors}
${multi_winner > 0 
      ? `🎉 Congrats won _${changed}_,earned ${diamonds_str ? '1 Diamond' : gold_str ? '1 Gold' : ''}` 
      : `😢 Sorry, lost _${seck_mone} p_`}
      
*💰 Bank Balance*: _${ama_points} p_
*💎 Diamonds*: _${wayiwayi}_
*🏆 Gold*: _${magolide}_
    `;
await sock.sendMessage(from, { text: naxor_ser });
  },
});
