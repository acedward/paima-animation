/**
 * @class BlockProcessorParticle
 * @description Represents a particle traveling from the Block Processor to the Batcher.
 * 
 * This class animates a particle's movement between two fixed points: the Block Processor
 * and the Batcher. It's a simple, fire-and-forget particle that deactivates itself upon
 * reaching its destination, signaling that the batcher has received a new input.
 */
export class BlockProcessorParticle {
    constructor(startX, startY, endX, endY, duration = 1500) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.currentX = startX;
        this.currentY = startY;
        this.duration = duration;
        this.startTime = Date.now();
        this.isActive = true;
        this.hasReached = false;
    }

    update() {
        if (!this.isActive) return;

        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        if (!this.hasReached) {
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            this.currentX = this.startX + (this.endX - this.startX) * easeProgress;
            this.currentY = this.startY + (this.endY - this.startY) * easeProgress;

            if (progress >= 1) {
                this.hasReached = true;
                this.isActive = false; // Deactivate when it reaches the batcher
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#f39c12'; // A different color to distinguish
        ctx.beginPath();
        ctx.arc(this.currentX, this.currentY, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
}
