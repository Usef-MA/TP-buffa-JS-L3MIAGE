import GameState from './GameState.js';
import Player from '../entities/Player.js';
import Obstacle from '../entities/Obstacle.js';
import ObstacleFlying from '../entities/ObstacleFlying.js';

export default class PlayState extends GameState {
    constructor(game) {
        super(game);
        
        // Entités
        this.player = null;
        this.obstacles = [];
        
        // Gameplay
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.baseSpeed = 280;
        this.currentSpeed = this.baseSpeed;
        
        // Spawn d'obstacles
        this.timeSinceLastObstacle = 0;
        this.minSpawnDelay = 1.2; // Réduit pour plus d'action
        this.maxSpawnDelay = 2.2;
        this.nextSpawnDelay = this.getRandomSpawnDelay();
        
        // Background scrolling
        this.backgroundSpeed = 120;
        
        // Scoring
        this.distanceTraveled = 0;
        this.pointsPerMeter = 1;
    
        // Backgrounds par niveau - NOUVEAU SYSTÈME
        this.backgroundImages = {
            1: new Image(),
            2: new Image(),
            3: new Image()
        };
        
        this.backgroundImages[1].src = 'assets/level1-bg.png';
        this.backgroundImages[2].src = 'assets/level2-bg.png';
        this.backgroundImages[3].src = 'assets/level3-bg.png';
        
        this.backgroundsLoaded = {
            1: false,
            2: false,
            3: false
        };
        
        this.backgroundImages[1].onload = () => {
            this.backgroundsLoaded[1] = true;
            console.log('✅ Level 1 background chargé');
        };
        this.backgroundImages[2].onload = () => {
            this.backgroundsLoaded[2] = true;
            console.log('✅ Level 2 background chargé');
        };
        this.backgroundImages[3].onload = () => {
            this.backgroundsLoaded[3] = true;
            console.log('✅ Level 3 background chargé');
        };
        
        this.backgroundX1 = 0;
        this.backgroundX2 = 800; // Double background pour scroll infini
    }

    enter() {
        console.log('🎮 Play State activé - Niveau', this.level);
        this.reset();
    }

    reset() {
        // Reset du joueur
        this.player = new Player(100, 320);
        
        // Reset obstacles
        this.obstacles = [];
        
        // Reset score (mais pas le niveau si on continue)
        this.game.scoreManager.reset();
        this.score = 0;
        this.lives = 3;
        
        // Reset vitesse selon niveau
        this.currentSpeed = this.baseSpeed + (this.level - 1) * 50;
        
        // Reset background
        this.backgroundX1 = 0;
        this.backgroundX2 = 800;
        this.distanceTraveled = 0;
        
        // Premier obstacle
        this.timeSinceLastObstacle = 0;
        this.nextSpawnDelay = this.getRandomSpawnDelay();
    }

    getRandomSpawnDelay() {
        // Délai aléatoire entre obstacles, diminue avec le niveau
        const min = Math.max(1.0, this.minSpawnDelay - (this.level - 1) * 0.1);
        const max = Math.max(2.0, this.maxSpawnDelay - (this.level - 1) * 0.2);
        return min + Math.random() * (max - min);
    }

    update(deltaTime) {
        if (!this.player) return;

        // Update joueur
        this.player.update(deltaTime);

        // Update obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.velocityX = -this.currentSpeed;
            obstacle.update(deltaTime);
        });

        // Spawn nouveaux obstacles
        this.timeSinceLastObstacle += deltaTime;
        if (this.timeSinceLastObstacle >= this.nextSpawnDelay) {
            this.spawnObstacle();
            this.timeSinceLastObstacle = 0;
            this.nextSpawnDelay = this.getRandomSpawnDelay();
        }

        // Nettoyage obstacles hors écran
        this.obstacles = this.obstacles.filter(obstacle => {
            if (obstacle.isOffScreen(800)) {
                // Point bonus pour avoir évité l'obstacle
                this.addScore(50); // Augmenté pour progression plus rapide
                return false;
            }
            return true;
        });

        // Collisions
        this.checkCollisions();

        // Background scrolling - DOUBLE pour scroll infini
        this.backgroundX1 -= this.backgroundSpeed * deltaTime;
        this.backgroundX2 -= this.backgroundSpeed * deltaTime;
        
        // Reset positions pour loop infini
        if (this.backgroundX1 <= -800) {
            this.backgroundX1 = 800;
        }
        if (this.backgroundX2 <= -800) {
            this.backgroundX2 = 800;
        }

        // Calcul distance et score
        this.distanceTraveled += this.currentSpeed * deltaTime;
        this.addScore(this.currentSpeed * deltaTime * 0.05); // Score continu

        // Augmentation progressive de la vitesse
        this.currentSpeed += deltaTime * 5;

        // Changement de niveau tous les 500 points
        const newLevel = Math.floor(this.score / 500) + 1;
        if (newLevel > this.level && newLevel <= 3) {
            this.levelUp(newLevel);
        }

        // Game Over si plus de vies
        if (this.lives <= 0 && !this.player.isDead) {
            this.player.die();
            setTimeout(() => {
                this.game.changeState('gameover');
            }, 1000);
        }
    }

    draw(ctx) {
        const canvas = ctx.canvas;

        // Background avec image selon le niveau - NOUVEAU
        const currentBg = this.backgroundImages[this.level];
        const bgLoaded = this.backgroundsLoaded[this.level];
        
        if (bgLoaded && currentBg) {
            // Double background pour scroll infini
            ctx.drawImage(currentBg, this.backgroundX1, 0, 800, 400);
            ctx.drawImage(currentBg, this.backgroundX2, 0, 800, 400);
        } else {
            // Fallback : gradient selon niveau
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            
            if (this.level === 1) {
                gradient.addColorStop(0, '#4a1a4a');
                gradient.addColorStop(0.5, '#2d1b3d');
                gradient.addColorStop(1, '#8b6f47');
            } else if (this.level === 2) {
                gradient.addColorStop(0, '#2d1b5e');
                gradient.addColorStop(0.5, '#5a3d7a');
                gradient.addColorStop(1, '#d4691a');
            } else {
                gradient.addColorStop(0, '#8b1a1a');
                gradient.addColorStop(0.5, '#2a0a2a');
                gradient.addColorStop(1, '#d4691a');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Motif de fond défilant (fallback)
            this.drawScrollingBackground(ctx);
        }

        // Sol
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(0, 360, canvas.width, 40);
        
        // Décoration sol (lignes)
        ctx.strokeStyle = '#6b5437';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            const x = (this.backgroundX1 % 100) + i * 100;
            ctx.beginPath();
            ctx.moveTo(x, 365);
            ctx.lineTo(x + 50, 365);
            ctx.stroke();
        }

        // Draw entités
        this.obstacles.forEach(obstacle => obstacle.draw(ctx));
        if (this.player) {
            this.player.draw(ctx);
        }

        // HUD
        this.drawHUD(ctx);
    }

    drawScrollingBackground(ctx) {
        // Étoiles/motifs qui défilent (fallback si pas d'image)
        ctx.save();
        ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
        
        for (let i = -1; i < 6; i++) {
            const x = (this.backgroundX1 * 0.5 % 200) + i * 200;
            this.drawStar(ctx, x, 100, 15);
            this.drawStar(ctx, x + 100, 200, 12);
        }
        
        ctx.restore();
    }

    drawStar(ctx, x, y, size) {
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

    drawHUD(ctx) {
        const canvas = ctx.canvas;
        
        // Panel HUD semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, 50);

        ctx.save();
        
        ctx.font = 'bold 24px "Exo 2", Arial';
        
        // Score (SANS VIRGULE)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Score: ${Math.floor(this.score)}`, 20, 32);
        
        // Niveau
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d4af37';
        ctx.fillText(`Niveau ${this.level}`, canvas.width / 2, 32);
        
        // Vies
        ctx.textAlign = 'right';
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`❤️ × ${this.lives}`, canvas.width - 20, 32);
        
        ctx.restore();
    }

    spawnObstacle() {
        const x = 800 + 50;
        
        // Varier les types d'obstacles selon le niveau
        const random = Math.random();
        
        if (this.level === 1) {
            // Niveau 1 : seulement obstacles au sol
            const obstacle = new Obstacle(x, 300, this.currentSpeed);
            this.obstacles.push(obstacle);
            
        } else if (this.level === 2) {
            // Niveau 2 : mélange sol + air (70% sol, 30% air)
            if (random < 0.7) {
                const obstacle = new Obstacle(x, 300, this.currentSpeed);
                this.obstacles.push(obstacle);
            } else {
                const obstacleFlying = new ObstacleFlying(x, 200, this.currentSpeed);
                this.obstacles.push(obstacleFlying);
            }
            
        } else {
            // Niveau 3 : chaos ! (50% sol, 50% air)
            if (random < 0.5) {
                const obstacle = new Obstacle(x, 300, this.currentSpeed);
                this.obstacles.push(obstacle);
            } else {
                const obstacleFlying = new ObstacleFlying(x, 180 + Math.random() * 60, this.currentSpeed);
                this.obstacles.push(obstacleFlying);
            }
        }
    }

    checkCollisions() {
        if (!this.player || this.player.isDead) return;

        this.obstacles.forEach(obstacle => {
            if (this.player.collidesWith(obstacle)) {
                this.hitObstacle(obstacle);
            }
        });
    }

    hitObstacle(obstacle) {
        // Retirer l'obstacle
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
            this.obstacles.splice(index, 1);
        }

        // Perdre une vie
        this.lives--;
        
        // Feedback visuel (flash rouge)
        this.flashScreen();

        console.log('💥 Collision ! Vies restantes:', this.lives);
    }

    flashScreen() {
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    addScore(points) {
        this.score += points;
        this.game.scoreManager.addPoints(points);
    }

    levelUp(newLevel) {
        this.level = newLevel;
        console.log('🎉 NIVEAU', this.level, '! Nouveau background chargé');
        
        // Bonus de vie tous les 2 niveaux
        if (this.level % 2 === 0 && this.lives < 5) {
            this.lives++;
            console.log('❤️ Vie bonus !');
        }
    }

    handleInput(inputManager) {
        if (!this.player || this.player.isDead) return; 

        // Saut
        if (inputManager.isKeyPressed(' ') || 
            inputManager.isKeyPressed('ArrowUp') ||
            inputManager.mouseClicked) {
            
            this.player.jump();
            inputManager.resetClick();
        }

        // Pause avec ESC (optionnel)
        if (inputManager.isKeyPressed('Escape')) {
            console.log('Pause non implémentée');
        }
    }

    exit() {
        console.log('🚪 Sortie du Play State');
    }
}