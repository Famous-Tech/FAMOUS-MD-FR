const { commands, Meta } = require('../lib/');
const connect_four = require('../data_store/Connect.d.js');
const games = {};

Meta({
  command: 'connect',
  category: 'games',
  handler: async (sock, args, message, author) => {
    const { from, sender } = message;
    
    if (!games[from]) {
      const gun_man = args[0] && args[0].toLowerCase() === 'bot';
      games[from] = new connect_four(author, gun_man);
      await sock.sendMessage(from, { text: `Starting a new game: Connect Four\n\n${games[from].renderBoard()}\n\nIts ${games[from].getCurrentPlayer().name}s turn` });
      return;
    }
    
    const game = games[from];
    const player = game.getCurrentPlayer();
    if (sender !== player.name) {
      await sock.sendMessage(from, { text: `Its not your turn ${author}` });
      return;
    }
    let col;
    if (game.gun_man && player.name === 'Bot') {
      col = game.botMove();
    } else {
      col = parseInt(args[0], 10) - 1;
      if (isNaN(col) || !game.isValidMove(col)) {
        await sock.sendMessage(from, { text: 'Please provide a valid column number (1-7)' });
        return;
      }
    }

    game.dropDisc(col);
    const boardRender = game.renderBoard();
    if (game.checkWin(player.disc)) {
      await sock.sendMessage(from, { text: `${player.name} wins\n\n${boardRender}` });
      delete games[from];
      return;
    }
    game.nextPlayer();

    if (game.isSinglePlayer && game.getCurrentPlayer().name === 'Bot') {
      col = game.botMove();
      game.dropDisc(col);
      if (game.checkWin(game.getCurrentPlayer().disc)) {
        await sock.sendMessage(from, { text: `${game.getCurrentPlayer().name} wins\n\n${game.renderBoard()}` });
        delete games[from];
        return;
      }
      game.nextPlayer();
    }
    await sock.sendMessage(from, { text: `${game.renderBoard()}\n\nIts ${game.getCurrentPlayer().name}s turn` });
  }
});
        
