const fs = require('fs');

class X_TicTacToe {
    constructor(playerX, playerO) {
        this.playerX = playerX;
        this.playerO = playerO;
        this.currentTurn = playerX;
        this.board = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
        this.turns = 0;
        this.gameOver = false;
        this.XAccepted = false;
        this.OAccepted = false;
        
        this.init_data();
    }

    static emojiMap = {
        X: "❌",
        O: "⭕",
        1: "1️⃣",
        2: "2️⃣",
        3: "3️⃣",
        4: "4️⃣",
        5: "5️⃣",
        6: "6️⃣",
        7: "7️⃣",
        8: "8️⃣",
        9: "9️⃣",
    };

    init_data() {
        if (!fs.existsSync('tic-tac-toe.json')) {
            fs.writeFileSync('tic-tac-toe.json', JSON.stringify([]));
        }
        if (!fs.existsSync('tac-points.json')) {
            fs.writeFileSync('tac-points.json', JSON.stringify({}));
        }
    }

    static loadGame() {
        try {
            const data = fs.readFileSync('tic-tac-toe.json', 'utf8');
            return JSON.parse(data);
        } catch (err) {
            return [];
        }
    }

    static saveGame(games) {
        fs.writeFileSync('tic-tac-toe.json', JSON.stringify(games, null, 2));
    }

    static findGame(player) {
        const games = X_TicTacToe.loadGame();
        return games.find(game => game.playerX === player || game.playerO === player);
    }

    static updateGame(updatedGame) {
        const games = X_TicTacToe.loadGame();
        const tac_Index = games.findIndex(game => game.playerX === updatedGame.playerX && game.playerO === updatedGame.playerO);
        if (tac_Index !== -1) {
            games[tac_Index] = updatedGame;
            X_TicTacToe.saveGame(games);
        }
    }

    static addPoints(player, points) {
        let X_Y_DATA = {};
        try {
            X_Y_DATA = JSON.parse(fs.readFileSync('tac-points.json', 'utf8'));
        } catch (err) {
            X_Y_DATA = {};
        }
        if (!X_Y_DATA[player]) {
            X_Y_DATA[player] = 0;
        }
        X_Y_DATA[player] += points;
        fs.writeFileSync('tac-points.json', JSON.stringify(X_Y_DATA, null, 2));
    }

    startGame() {
        if (this.XAccepted && this.OAccepted) {
            return this.displayBoard();
        }
        return 'Waiting for player to accept';
    }

    displayBoard() {
        const rows = [
            [this.board[0], this.board[1], this.board[2]],
            [this.board[3], this.board[4], this.board[5]],
            [this.board[6], this.board[7], this.board[8]]
        ];

        const boardString = rows.map(row =>
            row.map(cell => X_TicTacToe.emojiMap[cell]).join(' | ')
        ).join('\n---------\n');

        const current_str = this.currentTurn === this.playerX ? '❌' : '⭕';
        const turn_syt = `Player ${current_str}s turn (@${this.currentTurn})`;
        return `*Tic-Tac-Toe Game* 🎮\n\n${boardString}\n\n${turn_syt}`;
    }

    makeMove(player, position) {
        if (this.currentTurn !== player || this.gameOver) {
            return { status: false, message: 'Not your turn or game is over' };
        }
        if (this.board[position - 1] === 'X' || this.board[position - 1] === 'O') {
            return { status: false, message: 'Position already taken' };
        }
        this.board[position - 1] = player === this.playerX ? 'X' : 'O';
        this.turns += 1;
        this.currentTurn = player === this.playerX ? this.playerO : this.playerX;

        if (this.checkWin()) {
            this.gameOver = true;
            X_TicTacToe.addPoints(player, 1);
            return { status: true, message: `Player ${player} wins✌️` };
        } else if (this.turns >= 9) {
            this.gameOver = true;
            return { status: true, message: 'Game over. It\'s a tie!' };
        } else {
            return { status: true, message: 'Move accepted. Next turn' };
        }
    }

    checkWin() {
        const cn_winner = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        for (const condition of cn_winner) {
            const [a, b, c] = condition;
            if (this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return true;
            }
        }

        return false;
    }
}

module.exports = X_TicTacToe;
