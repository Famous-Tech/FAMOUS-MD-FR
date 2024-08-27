const Battleship = require('../data_store/Battleship.d.js');
const { commands, Meta } = require('../lib/');
const gameInstances = {};

Meta({
  command: 'battleship',
  category: 'games',
  filename: 'Battleships.js',
  handler: async(sock, args, message) => {
  const { from } = message;
  
  let game = instances[from];
  if (!game) {
    game = new Battleship('Player 1', true);
    instances[from] = game;
    sock.sendMessage(from, { text: `Battleship game started\n\nPlayer 1 vs XAstarl\n\n${game.renderBoard(game.boards['player1'])}` });
  } else if (game.isGameOver) {
    sock.sendMessage(from, { text: `Game over Please start a new game` });
  } else {
    if (game.x_astral) {
      if (game.getCurrentPlayer().name === 'Bot') {
        const [botRow, botCol] = game.botMove();
        const hit = game.attack('player2', botRow, botCol);
        sock.sendMessage(from, { text: `Bot attacks at (${botRow + 1}, ${botCol + 1}) and its a ${hit ? 'hit' : 'miss'}\n\n${game.renderBoard(game.boards['player1'])}` });
        game.nextPlayer();
      }
    }

    const [row, col] = args.map(n => parseInt(n, 10) - 1);
    if (!game.isValidMove(row, col)) {
      sock.sendMessage(from, { text: `Invalid move: Please choose again` });
      return;
    }
    const hit = game.attack('player1', row, col);
    sock.sendMessage(from, { text: `Player attacks at (${row + 1} ${col + 1}) and its a ${hit ? 'hit' : 'miss'}\n\n${game.renderBoard(game.boards['player2'])}` });
    game.nextPlayer();
  }
};
