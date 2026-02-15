import ParticleSystem from '../effects/ParticleSystem.js';
import Entity from './Entity.js';

export default class Player extends Entity {
    constructor(x, y, audioManager = null) {
        super(x, y, 40, 40); 
        
        this.audioManager = audioManager; // Référence au gestionnaire audio
        
        this.isJumping = false;
        this.jumpForce = -700; // Saut normal
        this.chargedJumpForce = -950; // Saut chargé
        this.gravity = 2200;
        this.groundY = 320;
        
        this.rotation = 0;
        this.rotationSpeed = 8;
        
        this.image = new Image();
        this.image.src = 'assets/carre.png';
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        
        this.isDead = false;

        this.particleSystem = new ParticleSystem();
        this.particleEmitTimer = 0;
        this.particleEmitInterval = 0.05;
        
        // Pour le saut chargé
        this.isCharging = false;
    }

    // Saut simple (appui court)
    jump() {
        if (!this.isJumping && !this.isDead) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
            
            // Jouer le son de saut
            if (this.audioManager) {
                this.audioManager.playJumpSound();
            }
            
            console.log('🔵 Saut normal');
        }
    }

    // Commence à charger le saut
    startCharging() {
        if (!this.isJumping && !this.isDead) {
            this.isCharging = true;
        }
    }

    // Saut chargé (appui long)
    chargedJump(chargeRatio) {
        if (!this.isJumping && !this.isDead) {
            // Interpole entre saut normal et saut chargé
            const force = this.jumpForce + (this.chargedJumpForce - this.jumpForce) * chargeRatio;
            this.velocityY = force;
            this.isJumping = true;
            this.isCharging = false;
            
            // Jouer le son de saut
            if (this.audioManager) {
                this.audioManager.playJumpSound();
            }
            
            console.log(`🟢 Saut chargé ${Math.round(chargeRatio * 100)}% (force: ${Math.round(force)})`);
        }
    }

    update(deltaTime) {
        if (this.isDead) return;

        this.velocityY += this.gravity * deltaTime;
        
        super.update(deltaTime);
        
        if (this.isJumping) {
            this.rotation += this.rotationSpeed * deltaTime;
        }
        
        // Collision avec le sol/plafond
        if (this.gravity > 0) {
            if (this.y >= this.groundY) {
                this.y = this.groundY;
                this.velocityY = 0;
                this.isJumping = false;
                this.isCharging = false;
                this.rotation = 0;
            }
        } else {
            if (this.y <= this.groundY) {
                this.y = this.groundY;
                this.velocityY = 0;
                this.isJumping = false;
                this.isCharging = false;
                this.rotation = 0;
            }
        }

        this.particleEmitTimer += deltaTime;
        if (this.particleEmitTimer >= this.particleEmitInterval) {
            const particleX = this.x + this.width / 2 - 15;
            const particleY = this.y + this.height / 2;
            
            const count = this.isJumping ? 5 : 3;
            this.particleSystem.emit(particleX, particleY, count, '#d4af37');
            
            this.particleEmitTimer = 0;
        }
        
        this.particleSystem.update(deltaTime);
    }

    draw(ctx) {
        this.particleSystem.draw(ctx);
        
        ctx.save();
        
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        if (this.gravity < 0) {
            ctx.scale(1, -1);
        }
        
        if (this.imageLoaded) {
            ctx.drawImage(
                this.image,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            ctx.fillStyle = '#9b59b6';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        
        // Indicateur de charge
        if (this.isCharging) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(-this.width / 2 - 5, -this.height / 2 - 5, this.width + 10, this.height + 10);
        }
        
        ctx.restore();
    }

    die() {
        this.isDead = true;
        this.velocityY = -400;
    }

    reset() {
        this.x = 100;
        this.y = this.groundY;
        this.velocityY = 0;
        this.rotation = 0;
        this.isJumping = false;
        this.isCharging = false;
        this.isDead = false;
        this.gravity = 2200;
        this.groundY = 320;
        this.particleSystem.clear();
        this.particleEmitTimer = 0;
    }
}