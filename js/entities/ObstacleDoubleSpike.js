import Entity from './Entity.js';

export default class ObstacleDoubleSpike extends Entity {
    constructor(x, y, speed) {
        super(x, y, 40, 80);
        this.velocityX = -speed;
        this.pulseAnimation = 0;
        this.pulseSpeed = 4;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.pulseAnimation += this.pulseSpeed * deltaTime;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const scale = 1 + Math.sin(this.pulseAnimation) * 0.08;
        ctx.scale(scale, scale);
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(0, 0, 40, 40);
        ctx.fillRect(0, 45, 40, 40);
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 36, 36);
        ctx.strokeRect(2, 47, 36, 36);
        
        ctx.restore();
    }
}
