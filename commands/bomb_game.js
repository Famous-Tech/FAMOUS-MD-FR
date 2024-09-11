const XenoStr = require('../data_store/bomb_database');
const xenoStr = new XenoStr();
const { Meta } = require('../lib/');

function startTimer(sock, player, from) {
    const game = xenoStr.get_xeno(player);
    game.timer = setTimeout(() => {
        sock.sendMessage(from, { text: `⏳ Temps écoulé, vous n'avez pas fait de mouvement à temps` });
        xenoStr.endGame(player, sock, from);
    }, 30000); 
}

function PowerUp_str(sock, player, from, powerUp) {
    const game = xenoStr.get_xeno(player);
    if (powerUp === 'reveal' && game.powerUps.reveal > 0) {
        game.powerUps.reveal -= 1;
        const safeSpot = game.board.findIndex((val, idx) => !game.bombs.includes(idx));
        game.board[safeSpot] = '🟢'; 
        const str_board = `${game.board.slice(0, 3).join('')}\n${game.board.slice(3, 6).join('')}\n${game.board.slice(6, 9).join('')}`;
        sock.sendMessage(from, { text: `🔍 Power-Up: emplacement sûr révélé:\n${str_board}` });
    } else if (powerUp === 'skip' && game.powerUps.skip > 0) {
        game.powerUps.skip -= 1;
        const str_board = `${game.board.slice(0, 3).join('')}\n${game.board.slice(3, 6).join('')}\n${game.board.slice(6, 9).join('')}`;
        sock.sendMessage(from, { text: `⏭️ Tour sauté: Nouveau tour:\n${str_board}` });
        game.round += 1;
        startTimer(sock, player, from);
    } else {
        sock.sendMessage(from, { text: `Aucun tel power-up` });
    }
}

Meta({
    command: 'bomb',
    category: 'jeux',
    handler: async (sock, message, args, author) => {
        const { from } = message;
        const player = author;
        let game = xenoStr.get_xeno(player);
        if (!game) {
            game = xenoStr.create(player);
            const str_board = `${game.board.slice(0, 3).join('')}\n${game.board.slice(3, 6).join('')}\n${game.board.slice(6, 9).join('')}`;
            await sock.sendMessage(from, { text: `*💥_B O M B_💥* \nTour ${game.round} - Choisissez un nombre _1_ - _9_:\n${str_board}\nVous avez 30 secondes pour faire un mouvement` });
            startTimer(sock, player, from);
            return;
        }
        if (args[0] === 'use') {
            PowerUp_str(sock, player, from, args[1]);
            return;
        }
        if (game.active) {
            clearTimeout(game.timer); 
            const mek_index = parseInt(args[0], 10) - 1;
            if (isNaN(mek_index) || mek_index < 0 || mek_index >= game.board.length) {
                await sock.sendMessage(from, { text: `*Numéro invalide*: choisissez: *_1_ - _9_*` });
                startTimer(sock, player, from); 
                return;
            }
            if (game.bombs.includes(mek_index)) {
                game.points -= 50; 
                await sock.sendMessage(from, {
                    text: `💥 Boom_vous avez touché la bombe`,
                    externalAdReply: {
                        previewType: 'image',
                        title: 'Boom',
                        body: 'Vous avez perdu',
                        thumbnail: { url: 'https://i.imgur.com/v1fIuNQ.jpeg' }
                    }
                });
                xenoStr.endGame(player, sock, from);
            } else {
                game.board[mek_index] = '✅'; 
                game.points += 10; 
                game.round += 1;
              const nount = Math.min(5, game.round); 
                game.bombs = Array(nount).fill().map(() => Math.floor(Math.random() * 9));
                game.board = game.board.map((val, idx) => (val === '✅' ? '✅' : `${idx + 1}️⃣`));
             if (Math.random() < 0.1) {
                    game.points += 50;
                    await sock.sendMessage(from, { text: `*🎁 Surprise* Vous avez reçu un bonus de 50 points: ${game.points}` });
                }
                const str_board = `${game.board.slice(0, 3).join('')}\n${game.board.slice(3, 6).join('')}\n${game.board.slice(6, 9).join('')}`;
                await sock.sendMessage(from, { text: `*😅 Sûr* Choisissez à nouveau: \n${str_board}\nTour: ${game.round}\nPoints: ${game.points}\nvous avez 30 secondes pour faire votre prochain mouvement` });
                startTimer(sock, player, from);
            }
        }
    }
});
