/**
 * @class UserRequestParticle
 * @description Represents a particle that visualizes a user request traveling to a target.
 * 
 * This class animates the movement of a small white particle from a user's device to its
 * intended destination, which can be either the `Batcher` or a specific blockchain.
 * The particle follows a simple trajectory and deactivates itself upon reaching the target,
 * signifying the successful delivery of the request.
 */
export class UserRequestParticle {
    constructor(startX, startY, endX, endY, target, duration = 1500) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.target = target;
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
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.currentX, this.currentY, 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
}
