export class UserRequestParticle {
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
}
