const { Meta } = require('../lib');

Meta({
  command: 'flipcoin',
  category: 'games',
  filename: __filename,
  handler: async (sock, message, args) => {
    const { from } = message;

    let board = [
      ['⚪', '⚪', '⚪'],
      ['⚪', '⚪', '⚪'],
      ['⚪', '⚪', '⚪']
    ];
    const set_hearder = {
      heads: "🔴",  
      tails: "🔵"   
    };
  const no_idea_cn = {
      heads: "🪙 Heads",
      tails: "🪙 Tails"
    };  const flipCoin = () => Math.random() < 0.5 ? 'heads' : 'tails';
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
      board[i][j] = set_hearder[result];
    };
    const res_dec = (board) => board.map(row => row.join(' ')).join('\n');
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
      const result = flipCoin();
        const no_idea = no_idea_cn[result];
        str_cbord(board, i, j, result);
        await sock.sendMessage(from, { text: `*🕹️FLIP_COIN*: ${no_idea}\n\n${res_dec(board)}` });
        if (get_win(board)) {
          const winner_then = result === 'heads' ? 'Player 1 (🔴)' : 'Player 2 (🔵)';
          await sock.sendMessage(from, { text: `Game Over ${winner_then} wins\n\n${res_dec(board)}` });
          return;
        }
      }
    }
    await sock.sendMessage(from, { text: `It's a draw!\n\n${formatBoard(board)}` });
  }
});
