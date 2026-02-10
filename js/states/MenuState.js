import GameState from './GameState.js';

export default class MenuState extends GameState {
    constructor(game) {
        super(game);
        this.titleAnimation = 0;
        this.selectedOption = 0;
        
        // Background 
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'assets/menu-bg.png';
        this.backgroundImageLoaded = false;
        this.backgroundImage.onload = () => {
            this.backgroundImageLoaded = true;
            console.log('✅ Menu background chargé');
        };
    }

    enter() {
        console.log('📜 Menu State activé');
        this.titleAnimation = 0;
    }

    update(deltaTime) {
        // Animation du titre
        this.titleAnimation += deltaTime * 2;
    }

    draw(ctx) {
        const canvas = ctx.canvas;
        
        // Background avec image si chargée
        if (this.backgroundImageLoaded) {
            ctx.drawImage(this.backgroundImage, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback : gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#4a1a4a');
            gradient.addColorStop(0.5, '#2d1b3d');
            gradient.addColorStop(1, '#8b6f47');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Overlay semi-transparent pour lisibilité du texte
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Titre avec animation - POLICE AMÉLIORÉE
        ctx.save();
        ctx.textAlign = 'center';
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        
        const titleY = 100 + Math.sin(this.titleAnimation) * 10;
        
        // ← POLICE MODERNE ET GRANDE
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 56px "Exo 2", Arial';
        ctx.fillText('MAROC RUNNER', canvas.width / 2, titleY);
        
        ctx.shadowBlur = 0;
        ctx.restore();

        // Instructions
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px "Exo 2", Arial';
        
        const instructionsY = canvas.height / 2 + 20;
        ctx.fillText('Appuie sur ESPACE ou CLIC pour commencer', canvas.width / 2, instructionsY);
        
        // Animation clignotante
        const alpha = (Math.sin(this.titleAnimation * 3) + 1) / 2;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 28px "Exo 2", Arial';
        ctx.fillText('▶ JOUER ◀', canvas.width / 2, instructionsY + 50);
        ctx.globalAlpha = 1;
        
        ctx.restore();

        // High Score
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d4af37';
        ctx.font = '20px "Exo 2", Arial';
        ctx.fillText(
            `Meilleur Score: ${Math.floor(this.game.scoreManager.getHighScore())}`, // ← Math.floor
            canvas.width / 2,
            canvas.height - 40
        );
        ctx.restore();

        // Contrôles
        ctx.save();
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '14px "Exo 2", Arial';
        ctx.fillText('Contrôles: ESPACE / ↑ / CLIC pour sauter', 20, canvas.height - 20);
        ctx.restore();
    }
    drawStar(ctx, x, y, size) {
        // Dessin d'une étoile marocaine simple
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const radius = i % 2 === 0 ? size : size / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    handleInput(inputManager) {
        // Démarrer le jeu si ESPACE, CLIC ou TOUCH
        if (inputManager.isKeyPressed(' ') || 
            inputManager.isKeyPressed('ArrowUp') || 
            inputManager.mouseClicked) {
            
            this.game.changeState('play');
            inputManager.resetClick();
        }
    }
}