const { Meta } = require('../lib');
const config = require('../config');

Meta({
  command: 'flipcoin',
  category: 'games',
  filename: __filename,
  handler: async (sock, message, args, mentionedJidList) => {
    const { from, body } = message;

    const str_inv = new Map(); 
     const pend = new Set(); 
    if (body.startsWith(config.PREFIX)) {
      const command = body.slice(config.PREFIX.length).trim().split(/ +/)[0];
      if (command === 'accept' || command === 'reject') {
        const initiator = str_inv.get(from);
        if (!initiator) {
          await sock.sendMessage(from, { text: '*' });
          return;
        }
        if (command === 'accept') {
          pend.delete(from);
          str_inv.delete(from);
          await startGame(sock, initiator, from);
        } else if (command === 'reject') {
          await sock.sendMessage(initiator, { text: `${from} *rejected*` });
          pend.delete(from);
          str_inv.delete(from);
        }
        return;
      }
    }

    if (mentionedJidList.length === 0) {
      await sock.sendMessage(from, { text: 'Please tag a user to start the game' });
      return;
    }
    const taggo = mentionedJidList[0]; 
    if (pend.has(taggo)) {
      await sock.sendMessage(from, { text: `${taggo} _already has a_ *pending*` });
      return;
    }
    str_inv.set(taggo, from);
    pend.add(taggo);
    await sock.sendMessage(taggo, { text: `Reply: ${config.PREFIX}accept to accept or ${config.PREFIX}reject to decline` });
  }
});
async function startGame(sock, player1, player2) {
  let board = [
    ['⚪', '⚪', '⚪'],
    ['⚪', '⚪', '⚪'],
    ['⚪', '⚪', '⚪']
  ];
  const set_header = {
    heads: "🔴",
    tails: "🔵"
  };
  const no_idea_cn = {
    heads: "🪙 Heads",
    tails: "🪙 Tails"
  };
  const flipCoin = () => Math.random() < 0.5 ? 'heads' : 'tails';
  const get_win = (board) => {
    for (let i = 0; i < 3; i++) {
      if (board[i][0] === board[i][1] && board[i][1] === board[i][2] && board[i][0] !== '⚪') return true;
      if (board[0][i] === board[1][i] && board[1][i] === board[2][i] && board[0][i] !== '⚪') return true;
    }
    if (board[0][0] === board[1][1] && board[1][1] === board[2][2] && board[0][0] !== '⚪') return true;
    if (board[0][2] === board[1][1] && board[1][1] === board[2][0] && board[0][2] !== '⚪') return true;
    return false;
  };
  const str_cbord = (board, i, j, result) => {
    board[i][j] = set_header[result];
  };
  const res_dec = (board) => board.map(row => row.join(' ')).join('\n');
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const result = flipCoin();
      const no_idea = no_idea_cn[result];
      str_cbord(board, i, j, result);
      await sock.sendMessage(player1, { text: `*🕹️ FLIP_COIN*: ${no_idea}\n\n${res_dec(board)}` });
      await sock.sendMessage(player2, { text: `*🕹️ FLIP_COIN*: ${no_idea}\n\n${res_dec(board)}` });
      if (get_win(board)) {
        const winner_then = result === 'heads' ? 'Player 1 (🔴)' : 'Player 2 (🔵)';
        await sock.sendMessage(player1, { text: `Game Over ${winner_then} wins\n\n${res_dec(board)}` });
        await sock.sendMessage(player2, { text: `Game Over ${winner_then} wins\n\n${res_dec(board)}` });
        return;
      }
    }
  }
  await sock.sendMessage(player1, { text: `Draw\n\n${res_dec(board)}` });
  await sock.sendMessage(player2, { text: `Draw\n\n${res_dec(board)}` });
}
sock.on('message', async (message) => {
  const { from, body } = message;
  if (body.startsWith(config.PREFIX)) {
    const command = body.slice(config.PREFIX.length).trim().split(/ +/)[0];
    if (command === 'accept' || command === 'reject') {
      const initiator = str_inv.get(from);
      if (initiator) {
        if (command === 'accept') {
          pend.delete(from);
          str_inv.delete(from);
          await startGame(sock, initiator, from);
        } else if (command === 'reject') {
          await sock.sendMessage(initiator, { text: `${from}_*rejected*_` });
          pend.delete(from);
          str_inv.delete(from);
        }
      }
    }
  }
});          
