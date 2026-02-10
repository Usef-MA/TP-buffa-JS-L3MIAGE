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

        // Transition de niveau - NOUVEAU
        this.isLevelTransition = false;
        this.transitionTimer = 0;
        this.transitionDuration = 2.5; // 2.5 secondes
        this.nextLevel = 1;
        
        // Transition de background - NOUVEAU
        this.backgroundTransitionProgress = 0;
        this.backgroundTransitioning = false;
        this.backgroundTransitionDuration = 1.5; // 1.5 secondes
        this.previousLevel = 1;
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
        // Niveau EXTRÊME : spawn ultra rapide
        if (this.level === 4) {
            return 0.6 + Math.random() * 0.4; // Entre 0.6 et 1.0 secondes
        }
        
        const min = Math.max(1.0, this.minSpawnDelay - (this.level - 1) * 0.1);
        const max = Math.max(2.0, this.maxSpawnDelay - (this.level - 1) * 0.2);
        return min + Math.random() * (max - min);
    }

    update(deltaTime) {
        if (!this.player) return;

        // Gérer la transition de niveau - NOUVEAU
        if (this.isLevelTransition) {
            this.transitionTimer += deltaTime;
            
            // Pas de spawn d'obstacles pendant la transition
            // Pas de update des entités pendant la transition
            
            if (this.transitionTimer >= this.transitionDuration) {
                // Fin de la transition
                this.isLevelTransition = false;
                this.level = this.nextLevel;
                this.transitionTimer = 0;
                console.log('✅ Niveau', this.level, 'activé !');
            }
            
            // On continue quand même à update le joueur et les obstacles existants
            this.player.update(deltaTime);
            this.obstacles.forEach(obstacle => {
                obstacle.velocityX = -this.currentSpeed;
                obstacle.update(deltaTime);
            });
            
            // Background scrolling continue
            this.backgroundX1 -= this.backgroundSpeed * deltaTime;
            this.backgroundX2 -= this.backgroundSpeed * deltaTime;
            
            if (this.backgroundX1 <= -800) this.backgroundX1 = 800;
            if (this.backgroundX2 <= -800) this.backgroundX2 = 800;
            
            return; // Skip le reste de l'update
        }

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

        let newLevel;
        if (this.score < 500) {
            newLevel = 1;
        } else if (this.score < 1000) {
            newLevel = 2;
        } else if (this.score < 1500) {
            newLevel = 3;
        } else {
            newLevel = 4; // NIVEAU EXTREME
        }
        
        if (newLevel > this.level && newLevel <= 4) {
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

        // Transition fluide entre backgrounds - NOUVEAU SYSTÈME
        if (this.backgroundTransitioning) {
            this.backgroundTransitionProgress += 0.016 / this.backgroundTransitionDuration; // ~60fps
            if (this.backgroundTransitionProgress >= 1) {
                this.backgroundTransitioning = false;
                this.backgroundTransitionProgress = 0;
            }
        }

        // Dessiner les backgrounds avec transition
        const currentLevel = this.isLevelTransition ? this.previousLevel : this.level;
        const currentBg = this.backgroundImages[currentLevel];
        const currentBgLoaded = this.backgroundsLoaded[currentLevel];
        
        if (currentBgLoaded && currentBg) {
            ctx.drawImage(currentBg, this.backgroundX1, 0, 800, 400);
            ctx.drawImage(currentBg, this.backgroundX2, 0, 800, 400);
            
            // Overlay du nouveau background en fade-in
            if (this.backgroundTransitioning && this.nextLevel <= 3) {
                const nextBg = this.backgroundImages[this.nextLevel];
                const nextBgLoaded = this.backgroundsLoaded[this.nextLevel];
                
                if (nextBgLoaded && nextBg) {
                    ctx.save();
                    ctx.globalAlpha = this.backgroundTransitionProgress;
                    ctx.drawImage(nextBg, this.backgroundX1, 0, 800, 400);
                    ctx.drawImage(nextBg, this.backgroundX2, 0, 800, 400);
                    ctx.restore();
                }
            }
        } else {
            // Fallback gradients...
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            
            if (currentLevel === 1) {
                gradient.addColorStop(0, '#4a1a4a');
                gradient.addColorStop(0.5, '#2d1b3d');
                gradient.addColorStop(1, '#8b6f47');
            } else if (currentLevel === 2) {
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
            this.drawScrollingBackground(ctx);
        }

        // Sol, entités, etc.
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(0, 360, canvas.width, 40);
        
        ctx.strokeStyle = '#6b5437';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
            const x = (this.backgroundX1 % 100) + i * 100;
            ctx.beginPath();
            ctx.moveTo(x, 365);
            ctx.lineTo(x + 50, 365);
            ctx.stroke();
        }

        this.obstacles.forEach(obstacle => obstacle.draw(ctx));
        if (this.player) {
            this.player.draw(ctx);
        }

        // HUD
        this.drawHUD(ctx);
        
        // Animation de transition de niveau - NOUVEAU
        if (this.isLevelTransition) {
            this.drawLevelTransition(ctx);
        }
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
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, 50);

        ctx.save();
        ctx.font = 'bold 24px "Exo 2", Arial';
        
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Score: ${Math.floor(this.score)}`, 20, 32);
        
        ctx.textAlign = 'center';
        
        // Niveau avec style spécial pour niveau 4
        if (this.level === 4) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 26px "Exo 2", Arial';
            ctx.fillText(`💀 EXTRÊME 💀`, canvas.width / 2, 32);
        } else {
            ctx.fillStyle = '#d4af37';
            ctx.fillText(`Niveau ${this.level}`, canvas.width / 2, 32);
        }
        
        ctx.textAlign = 'right';
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 24px "Exo 2", Arial';
        ctx.fillText(`❤️ × ${this.lives}`, canvas.width - 20, 32);
        
        ctx.restore();
    }

    spawnObstacle() {
        const x = 800 + 50;
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
            
        } else if (this.level === 3) {
            // Niveau 3 : chaos ! (50% sol, 50% air)
            if (random < 0.5) {
                const obstacle = new Obstacle(x, 300, this.currentSpeed);
                this.obstacles.push(obstacle);
            } else {
                const obstacleFlying = new ObstacleFlying(x, 180 + Math.random() * 60, this.currentSpeed);
                this.obstacles.push(obstacleFlying);
            }
            
        } else if (this.level === 4) {
            // NIVEAU EXTRÊME : CHAOS TOTAL - NOUVEAU
            // 40% sol, 60% air avec variations de hauteur
            if (random < 0.4) {
                const obstacle = new Obstacle(x, 300, this.currentSpeed);
                this.obstacles.push(obstacle);
            } else {
                const obstacleFlying = new ObstacleFlying(x, 150 + Math.random() * 100, this.currentSpeed);
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
        console.log('🎉 Transition vers niveau', newLevel, '!');
        
        // Démarrer la transition
        this.isLevelTransition = true;
        this.transitionTimer = 0;
        this.nextLevel = newLevel;
        this.previousLevel = this.level;
        
        // Démarrer transition de background
        this.backgroundTransitioning = true;
        this.backgroundTransitionProgress = 0;
        
        // Bonus de vie tous les 2 niveaux
        if (newLevel % 2 === 0 && this.lives < 5) {
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

    drawLevelTransition(ctx) {
        const canvas = ctx.canvas;
        const progress = this.transitionTimer / this.transitionDuration;
        
        // Overlay semi-transparent
        ctx.save();
        
        // Fade in puis fade out
        let alpha;
        if (progress < 0.3) {
            // Fade in rapide
            alpha = progress / 0.3;
        } else if (progress > 0.7) {
            // Fade out
            alpha = (1 - progress) / 0.3;
        } else {
            alpha = 1;
        }
        
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Texte "NIVEAU X"
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Effet de scale (zoom in/out)
        const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        
        // Ombre
        ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
        ctx.shadowBlur = 20;
        
        // Texte principal
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 72px "Exo 2", Arial';
        
        let levelText = `NIVEAU ${this.nextLevel}`;
        if (this.nextLevel === 4) {
            levelText = 'NIVEAU EXTRÊME';
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        }
        
        ctx.fillText(levelText, 0, -30);
        
        // Sous-texte
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px "Exo 2", Arial';
        
        const messages = {
            2: 'Obstacles volants !',
            3: 'Ça chauffe !',
            4: '💀 SURVIE 💀'
        };
        
        ctx.fillText(messages[this.nextLevel] || '', 0, 30);
        
        ctx.restore();
        ctx.restore();
    }
}