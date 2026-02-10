import Game from './Game.js';

// Point d'entrée du jeu
window.addEventListener('load', () => {
    console.log('🚀 Démarrage de Maroc Runner...');
    
    const game = new Game('gameCanvas');
    game.init();
    
    // Rendre le jeu accessible globalement (pour debug dans console)
    window.game = game;
});