const fs = require('fs');

class Morpion {
    constructor(joueurX, joueurO) {
        this.joueurX = joueurX;
        this.joueurO = joueurO;
        this.tourActuel = joueurX;
        this.plateau = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
        this.tours = 0;
        this.partieFinie = false;
        this.XAccepte = false;
        this.OAccepte = false;
        
        this.initialiserDonnees();
    }

    static emojiMap = {
        X: "❌",
        O: "⭕", // à terminer demain 
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

    initialiserDonnees() {
        if (!fs.existsSync('tic-tac-toe.json')) {
            fs.writeFileSync('tic-tac-toe.json', JSON.stringify([]));
        }
        if (!fs.existsSync('tac-points.json')) {
            fs.writeFileSync('tac-points.json', JSON.stringify({}));
        }
    }

    static chargerPartie() {
        try {
            const data = fs.readFileSync('tic-tac-toe.json', 'utf8');
            return JSON.parse(data);
        } catch (err) {
            return [];
        }
    }

    static sauvegarderPartie(parties) {
        fs.writeFileSync('tic-tac-toe.json', JSON.stringify(parties, null, 2));
    }

    static trouverPartie(joueur) {
        const parties = Morpion.chargerPartie();
        return parties.find(partie => partie.joueurX === joueur || partie.joueurO === joueur);
    }

    static mettreAJourPartie(partieMiseAJour) {
        const parties = Morpion.chargerPartie();
        const indexPartie = parties.findIndex(partie => partie.joueurX === partieMiseAJour.joueurX && partie.joueurO === partieMiseAJour.joueurO);
        if (indexPartie !== -1) {
            parties[indexPartie] = partieMiseAJour;
            Morpion.sauvegarderPartie(parties);
        }
    }

    static ajouterPoints(joueur, points) {
        let donneesXY = {};
        try {
            donneesXY = JSON.parse(fs.readFileSync('tac-points.json', 'utf8'));
        } catch (err) {
            donneesXY = {};
        }
        if (!donneesXY[joueur]) {
            donneesXY[joueur] = 0;
        }
        donneesXY[joueur] += points;
        fs.writeFileSync('tac-points.json', JSON.stringify(donneesXY, null, 2));
    }

    demarrerPartie() {
        if (this.XAccepte && this.OAccepte) {
            return this.afficherPlateau();
        }
        return 'En attente de l\'acceptation du joueur';
    }

    afficherPlateau() {
        const lignes = [
            [this.plateau[0], this.plateau[1], this.plateau[2]],
            [this.plateau[3], this.plateau[4], this.plateau[5]],
            [this.plateau[6], this.plateau[7], this.plateau[8]]
        ];

        const plateauString = lignes.map(ligne =>
            ligne.map(cellule => Morpion.emojiMap[cellule]).join(' | ')
        ).join('\n---------\n');

        const symboleActuel = this.tourActuel === this.joueurX ? '❌' : '⭕';
        const tourString = `Tour du joueur ${symboleActuel} (@${this.tourActuel})`;
        return `*Jeu du Morpion* 🎮\n\n${plateauString}\n\n${tourString}`;
    }

    jouerCoup(joueur, position) {
        if (this.tourActuel !== joueur || this.partieFinie) {
            return { status: false, message: 'Ce n\'est pas votre tour ou la partie est terminée' };
        }
        if (this.plateau[position - 1] === 'X' || this.plateau[position - 1] === 'O') {
            return { status: false, message: 'Position déjà occupée' };
        }
        this.plateau[position - 1] = joueur === this.joueurX ? 'X' : 'O';
        this.tours += 1;
        this.tourActuel = joueur === this.joueurX ? this.joueurO : this.joueurX;

        if (this.verifierVictoire()) {
            this.partieFinie = true;
            Morpion.ajouterPoints(joueur, 1);
            return { status: true, message: `Le joueur ${joueur} gagne✌️` };
        } else if (this.tours >= 9) {
            this.partieFinie = true;
            return { status: true, message: 'Partie terminée. Égalité !' };
        } else {
            return { status: true, message: 'Coup accepté. Tour suivant' };
        }
    }

    verifierVictoire() {
        const conditionsVictoire = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        for (const condition of conditionsVictoire) {
            const [a, b, c] = condition;
            if (this.plateau[a] === this.plateau[b] && this.plateau[a] === this.plateau[c]) {
                return true;
            }
        }

        return false;
    }
}

module.exports = Morpion;
