const { commands, Meta } = require('../lib/');
const X_TicTacToe = require('../data_store/tic-tac-toe.d.js');

Meta({
    command: 'tictac',
    category: 'games',
    filename: 'tic-tac-toe.js',
    handler: async (sock, message, author, args) => {
        const { from, mentionedJid } = message;

        if (args.length < 1 || mentionedJid.length < 1) {
            await sock.sendMessage(from, { text: 'Please mention a user to challenge for Tic-Tac-Toe' });
            return;
        }
        const playerX = author;
        const playerO = mentionedJid[0];
        let game = X_TicTacToe.findGame(playerX);

        if (!game) {
            game = new X_TicTacToe(playerX, playerO);
            X_TicTacToe.saveGame([...X_TicTacToe.loadGame(), game]);
            await sock.sendMessage(from, { text: `Game created: Waiting for @${playerO.split('@')[0]}`, mentions: [playerO] });

          sock.ev.on('messages.upsert', async ({ messages }) => {
                const msg = messages[0];
                if (msg.body === `${config.PREFIX}accept ttt` && msg.sender === playerO) {
                    game.playerOAccepted = true;
                    X_TicTacToe.updateGame(game);
                    const Msg_str = game.startGame();
                    if (Msg_str) {
                        await sock.sendMessage(from, { text: Msg_str });
                    }
                }
            });
        } else {
            await sock.sendMessage(from, { text: 'You already have an ongoing game' });
        }
      
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!game.gameOver && msg.sender === game.currentTurn) {
                const move = parseInt(msg.body.trim());
                if (move >= 1 && move <= 9) {
                    const result = game.makeMove(msg.sender, move);
                    X_TicTacToe.updateGame(game);
                    if (result.status) {
                        await sock.sendMessage(from, { text: result.message });
                        if (!game.gameOver) {
                            await sock.sendMessage(from, { text: game.displayBoard() });
                        }
                    } else {
                        await sock.sendMessage(from, { text: result.message });
                    }
                }
            }

            const TIMEOUT = 30000; 
            if (!game.gameOver && Date.now() - game.lastMoveTime > TIMEOUT) {
                game.gameOver = true;
                X_TicTacToe.addPoints(game.currentTurn === playerX ? playerO : playerX, 1);
                await sock.sendMessage(from, { text: `Game over🙃 @${game.currentTurn.split('@')[0]} took too long @${(game.currentTurn === playerX ? playerO : playerX).split('@')[0]} wins`, mentions: [playerX, playerO] });
                X_TicTacToe.updateGame(game);
            }
        });
    }
});
