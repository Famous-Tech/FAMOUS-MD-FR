const Battleship = require('../data_store/Battleship.d.js');
const { commands, Meta } = require('../lib/');
const instances = {};

Meta({
  command: 'battleship',
  category: 'jeux',
  filename: 'Battleships.js',
  handler: async(sock, args, message) => {
  const { from } = message;
  
  let game = instances[from];
  if (!game) {
    game = new Battleship('Joueur 1', true);
    instances[from] = game;
    sock.sendMessage(from, { text: `Partie de Bataille Navale démarrée\n\nJoueur 1 vs XAstarl\n\n${game.renderBoard(game.boards['player1'])}` });
  } else if (game.isGameOver) {
    sock.sendMessage(from, { text: `Partie terminée. Veuillez démarrer une nouvelle partie` });
  } else {
    if (game.x_astral) {
      if (game.getCurrentPlayer().name === 'Bot') {
        const [botRow, botCol] = game.botMove();
        const hit = game.attack('player2', botRow, botCol);
        sock.sendMessage(from, { text: `Bot attaque à (${botRow + 1}, ${botCol + 1}) et c'est un ${hit ? 'coup' : 'raté'}\n\n${game.renderBoard(game.boards['player1'])}` });
        game.nextPlayer();
      }
    }

    const [row, col] = args.map(n => parseInt(n, 10) - 1);
    if (!game.isValidMove(row, col)) {
      sock.sendMessage(from, { text: `Mouvement invalide: Veuillez choisir à nouveau` });
      return;
    }
    const hit = game.attack('player1', row, col);
    sock.sendMessage(from, { text: `Joueur attaque à (${row + 1} ${col + 1}) et c'est un ${hit ? 'coup' : 'raté'}\n\n${game.renderBoard(game.boards['player2'])}` });
    game.nextPlayer();
  }
};
