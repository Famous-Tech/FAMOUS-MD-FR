const { commands, Meta } = require('../lib/');
const X_TicTacToe = require('../data_store/tic-tac-toe.d.js');

Meta({
    command: 'tictac',
    category: 'jeux',
    filename: 'tic-tac-toe.js',
    handler: async (sock, message, mentionedJid, author, args) => {
        const { from } = message;

        if (args.length < 1 || mentionedJid.length < 1) {
            await sock.sendMessage(from, { text: 'Veuillez mentionner un utilisateur à défier au Tic-Tac-Toe' });
            return;
        }
        
        const playerX = author;
        const playerO = mentionedJid[0];
        let game = X_TicTacToe.findGame(playerX);

        if (!game) {
            game = new X_TicTacToe(playerX, playerO);
            X_TicTacToe.saveGame([...X_TicTacToe.loadGame(), game]);
            await sock.sendMessage(from, { text: `Partie créée: En attente de @${playerO.split('@')[0]}`, mentions: [playerO] });

            sock.ev.on('messages.upsert', async ({ messages }) => {
                const msg = messages[0];
                if (msg.body === `${config.PREFIX}accept ttt` && msg.sender === playerO) {
                    game.OAccepted = true;
                    X_TicTacToe.updateGame(game);
                    const msgStr = game.startGame();
                    if (msgStr) {
                        await sock.sendMessage(from, { text: msgStr });
                    }
                }
            });
        } else {
            await sock.sendMessage(from, { text: 'Vous avez déjà une partie en cours' });
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
                } else {
                    await sock.sendMessage(from, { text: 'Mouvement invalide: Veuillez choisir un nombre entre 1 et 9' });
                }
            }

            const TIMEOUT = 30000;
            if (!game.gameOver && Date.now() - (game.lastMoveTime || 0) > TIMEOUT) {
                game.gameOver = true;
                X_TicTacToe.addPoints(game.currentTurn === playerX ? playerO : playerX, 1);
                await sock.sendMessage(from, { text: `Partie terminée🙃 @${game.currentTurn.split('@')[0]} a pris trop de temps. @${(game.currentTurn === playerX ? playerO : playerX).split('@')[0]} gagne.`, mentions: [playerX, playerO] });
                X_TicTacToe.updateGame(game);
            }
        });
    }
});
