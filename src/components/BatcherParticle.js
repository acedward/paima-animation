import { blockHeight } from '../config.js';
import { EventTypes, EventColors } from './EventTypes.js';

/**
 * @class BatcherParticle
 * @description Represents a particle that travels from the batcher to a target blockchain in the animation.
 * 
 * This class manages the movement and state of a particle, which represents a batch of events.
 * The particle moves from its starting point to a waiting position near the target chain, waits for a block,
 * and then travels into the block. It's rendered as a colored circle with a glow effect.
 */
export class BatcherParticle {
    constructor(startX, startY, targetChain, event, engine, duration = 1000) {
        this.startX = startX;
        this.startY = startY;
        this.currentX = startX;
        this.currentY = startY;
        
        this.targetChain = targetChain; // Store the whole chain object
        this.engine = engine;
        this.event = event;
        this.targetBlock = null;
        
        this.duration = duration;
        this.startTime = Date.now();
        this.isActive = true;
        
        this.state = 'TRAVELING_TO_WAIT_POINT'; // TRAVELING_TO_WAIT_POINT, WAITING, TRAVELING_TO_BLOCK
        
        this.color = EventColors[event.type] || '#e67e22';
        this.opacity = 1.0;
    }

    update() {
        if (!this.isActive) return;

        const nowPosition = this.engine.blockProcessor.nowPosition;
        const waitPositionX = nowPosition + 10;
        // Target Y is the middle of the chain's row
        const targetY = this.targetChain.yPosition + blockHeight / 2; 

        if (this.state === 'TRAVELING_TO_WAIT_POINT') {
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            
            const easeProgress = 1 - Math.pow(1 - progress, 2);
            this.currentX = this.startX + (waitPositionX - this.startX) * easeProgress;
            this.currentY = this.startY + (targetY - this.startY) * easeProgress;

            if (progress >= 1) {
                this.state = 'WAITING';
                this.currentX = waitPositionX;
                this.currentY = targetY;
            }
        } else if (this.state === 'WAITING') {
            // Just wait at the position
            this.currentX = waitPositionX;
            this.currentY = targetY;
        } else if (this.state === 'TRAVELING_TO_BLOCK' && this.targetBlock) {
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 2);

            const targetX = this.targetBlock.x + this.targetBlock.width / 2;
            const targetY = this.targetBlock.y + this.targetBlock.height / 2;

            this.currentX = this.startX + (targetX - this.startX) * easeProgress;
            this.currentY = this.startY + (targetY - this.startY) * easeProgress;

            if (progress >= 1) {
                this.isActive = false;
            }
        }
    }

    draw(ctx) {
        if (!this.isActive) return;
        ctx.save();
        ctx.globalAlpha = this.opacity || 1.0;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.currentX, this.currentY, 3, 0, 2 * Math.PI); // A bit larger
        
        // Add a glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.restore();
    }
}
