import Entity from './Entity.js';

export default class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40); 
        
        // Propriétés du saut
        this.isJumping = false;
        this.jumpForce = -700; // Force du saut (négatif = vers le haut)
        this.gravity = 2200; // Gravité
        this.groundY = 320; // Position du sol (400 - 40 - marge)
        
        // Animation
        this.rotation = 0;
        this.rotationSpeed = 8; // Vitesse de rotation en rad/s
        
        // Image
        this.image = new Image();
        this.image.src = 'assets/carre.png';
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        
        // États
        this.isDead = false;
    }

    jump() {
        if (!this.isJumping && !this.isDead) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
        }
    }

    update(deltaTime) {
        if (this.isDead) return;

        // Application de la gravité
        this.velocityY += this.gravity * deltaTime;
        
        // Mise à jour position Y
        this.y += this.velocityY * deltaTime;
        
        // Rotation pendant le saut
        if (this.isJumping) {
            this.rotation += this.rotationSpeed * deltaTime;
        }
        
        // Collision avec le sol
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isJumping = false;
            this.rotation = 0; // Reset rotation au sol
        }
    }

    draw(ctx) {
        ctx.save();
        
        // BONNE PRATIQUE : translate vers position puis rotate
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // Dessin en 0,0 (centré grâce au translate)
        if (this.imageLoaded) {
            ctx.drawImage(
                this.image,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // Fallback si image pas chargée
            ctx.fillStyle = '#9b59b6'; // Violet
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        
        ctx.restore();
    }

    die() {
        this.isDead = true;
        this.velocityY = -400; // Petit saut de mort
    }

    reset() {
        this.x = 100;
        this.y = this.groundY;
        this.velocityY = 0;
        this.rotation = 0;
        this.isJumping = false;
        this.isDead = false;
    }
}