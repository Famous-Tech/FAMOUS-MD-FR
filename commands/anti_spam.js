const { commands } = require('../lib/');
const message_count = {};

commands.messagesUpsert = async (sock, message) => {
  const { key, from, sender } = message[0];
  const sender_m = sender;

  if (!message_count[from]) message_count[from] = {};
  if (!message_count[from][sender_m]) message_count[from][sender_m] = 0;
  message_count[from][sender_m] += 1;
  setTimeout(() => {
    message_count[from][sender_m] -= 1;
  }, 10000); 

  if (message_count[from][sender_m] > 5) {
    await sock.groupRemove(from, [sender_m]);
    await sock.sendMessage(from, { text: `User @${sender_m.split('@')[0]} has been removed for spamming`, mentions: [sender_m] });
  }
};
  
