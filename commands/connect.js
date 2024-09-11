const { commands, Meta } = require('../lib/');
const connect_four = require('../data_store/Connect.d.js');
const games = {};

Meta({
  command: 'connect',
  category: 'jeux',
  handler: async (sock, args, message, author) => {
    const { from, sender } = message;
    
    if (!games[from]) {
      const gun_man = args[0] && args[0].toLowerCase() === 'bot';
      games[from] = new connect_four(author, gun_man);
      await sock.sendMessage(from, { text: `Démarrage d'une nouvelle partie : Puissance 4\n\n${games[from].renderBoard()}\n\nC'est au tour de ${games[from].getCurrentPlayer().name}` });
      return;
    }
    
    const game = games[from];
    const player = game.getCurrentPlayer();
    if (sender !== player.name) {
      await sock.sendMessage(from, { text: `Ce n'est pas à votre tour ${author}` });
      return;
    }
    let col;
    if (game.gun_man && player.name === 'Bot') {
      col = game.botMove();
    } else {
      col = parseInt(args[0], 10) - 1;
      if (isNaN(col) || !game.isValidMove(col)) {
        await sock.sendMessage(from, { text: 'Veuillez fournir un numéro de colonne valide (1-7)' });
        return;
      }
    }

    game.dropDisc(col);
    const boardRender = game.renderBoard();
    if (game.checkWin(player.disc)) {
      await sock.sendMessage(from, { text: `${player.name} gagne\n\n${boardRender}` });
      delete games[from];
      return;
    }
    game.nextPlayer();

    if (game.isSinglePlayer && game.getCurrentPlayer().name === 'Bot') {
      col = game.botMove();
      game.dropDisc(col);
      if (game.checkWin(game.getCurrentPlayer().disc)) {
        await sock.sendMessage(from, { text: `${game.getCurrentPlayer().name} gagne\n\n${game.renderBoard()}` });
        delete games[from];
        return;
      }
      game.nextPlayer();
    }
    await sock.sendMessage(from, { text: `${game.renderBoard()}\n\nC'est au tour de ${game.getCurrentPlayer().name}` });
  }
});
