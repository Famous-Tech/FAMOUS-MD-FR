class PuissanceQuatre {
  constructor(joueur1, gun_man = false) {
    this.largeurPlateau = 7;
    this.hauteurPlateau = 6;
    this.plateau = this.creerPlateau();
    this.joueurs = [{ nom: joueur1, pion: '🟥' }]; 
    if (gun_man) {
      this.joueurs.push({ nom: 'Bot', pion: '🟧' }); 
      this.gun_man = true;
    } else {
      this.joueurs.push({ nom: 'Joueur 2', pion: '🟧' }); 
      this.gun_man = false;
    }
    this.indiceJoueurActuel = 0;
    this.partieActive = true;
  }

  creerPlateau() {
    return Array.from({ length: this.hauteurPlateau }, () => Array(this.largeurPlateau).fill('⬜')); 
  }
  afficherPlateau() {
    return this.plateau.map(ligne => ligne.join(' ')).join('\n');
  }
  estCoupValide(colonne) {
    return colonne >= 0 && colonne < this.largeurPlateau && this.plateau[0][colonne] === '⬜';
  }
  lacherPion(colonne) {
    for (let ligne = this.hauteurPlateau - 1; ligne >= 0; ligne--) {
      if (this.plateau[ligne][colonne] === '⬜') {
        this.plateau[ligne][colonne] = this.joueurs[this.indiceJoueurActuel].pion;
        return ligne;
      }
    }
    return -1;
  }

  verifierVictoire(pion) {
    for (let ligne = 0; ligne < this.hauteurPlateau; ligne++) {
      for (let colonne = 0; colonne < this.largeurPlateau; colonne++) {
        if (
          (colonne <= this.largeurPlateau - 4 && this.plateau[ligne][colonne] === pion && this.plateau[ligne][colonne + 1] === pion && this.plateau[ligne][colonne + 2] === pion && this.plateau[ligne][colonne + 3] === pion) || 
          (ligne <= this.hauteurPlateau - 4 && this.plateau[ligne][colonne] === pion && this.plateau[ligne + 1][colonne] === pion && this.plateau[ligne + 2][colonne] === pion && this.plateau[ligne + 3][colonne] === pion) ||
          (ligne <= this.hauteurPlateau - 4 && colonne <= this.largeurPlateau - 4 && this.plateau[ligne][colonne] === pion && this.plateau[ligne + 1][colonne + 1] === pion && this.plateau[ligne + 2][colonne + 2] === pion && this.plateau[ligne + 3][colonne + 3] === pion) ||
          (ligne >= 3 && colonne <= this.largeurPlateau - 4 && this.plateau[ligne][colonne] === pion && this.plateau[ligne - 1][colonne + 1] === pion && this.plateau[ligne - 2][colonne + 2] === pion && this.plateau[ligne - 3][colonne + 3] === pion) 
        ) {
          return true;
        }
      }
    }
    return false;
  }
  prochainJoueur() {
    this.indiceJoueurActuel = this.indiceJoueurActuel === 0 ? 1 : 0;
  }
  getJoueurActuel() {
    return this.joueurs[this.indiceJoueurActuel];
  }
  coupBot() {
    let colonne;
    do {
      colonne = Math.floor(Math.random() * this.largeurPlateau);
    } while (!this.estCoupValide(colonne));
    return colonne;
  }

  reinitialiserPartie() {
    this.plateau = this.creerPlateau();
    this.indiceJoueurActuel = 0;
    this.partieActive = true;
  }
}

module.exports = PuissanceQuatre;
