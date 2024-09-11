class XenoStr {
    constructor() {
        this.bomDB = new Map();
        this.classement = new Map();
    }

    creer(joueur) {
        const plateau = Array(9).fill().map((_, i) => `${i + 1}️⃣`);
        const nombreBombes = 1;  
        const bombes = Array(nombreBombes).fill().map(() => Math.floor(Math.random() * 9));      
        this.bomDB.set(joueur, {
            plateau,
            bombes,
            actif: true,
            points: 100,
            tour: 1,
            minuteur: null,
            heureDebut: Date.now(),
            bonus: { reveler: 1, passer: 1 }  
        });

        return this.bomDB.get(joueur);
    }
    get_xeno(joueur) {
        return this.bomDB.get(joueur);
    }
    finPartie(joueur, sock, from) {
        const partie = this.bomDB.get(joueur);
        if (partie) {
            clearTimeout(partie.minuteur);
            this.classement.set(joueur, (this.classement.get(joueur) || 0) + partie.points);
            sock.sendMessage(from, { text: `💥 Score: ${partie.points}\n*CLASSEMENT*:\n${this.getClassement()}` });
            this.bomDB.delete(joueur);
        }
    }
    getClassement() {
        const classementTrie = Array.from(this.classement.entries()).sort((a, b) => b[1] - a[1]);
        return classementTrie.map(([joueur, points], index) => `${index + 1}. ${joueur}: ${points} points`).join('\n');
    }
}

module.exports = XenoStr;
