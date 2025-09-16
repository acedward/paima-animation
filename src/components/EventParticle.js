import { EventTypes, EventColors } from './EventTypes.js';

/**
 * @class EventParticle
 * @description Represents a particle that visualizes an event traveling from a block to a scheduled action.
 * 
 * This class manages the animation and state of an event particle. It moves from a source block
 * to a target `Action` (referred to as `targetBlock` in the code for legacy reasons). Once it reaches
 * its destination, it follows the action and can pulse or fade out. The particle's appearance,
 * including its color and glow, is determined by the type of event it represents.
 */
export class EventParticle {
    constructor(startX, startY, endX, endY, event, targetBlock, index, duration = 2000) {
        this.startX = startX;
        this.startY = startY;
        this.initialEndX = endX; // Store initial target position
        this.initialEndY = endY;
        this.currentX = startX;
        this.currentY = startY;
        this.event = event;
        this.targetBlock = targetBlock; // Store reference to target block
        this.index = index;
        this.duration = duration;
        this.startTime = Date.now();
        this.isActive = true;
        this.hasReached = false;
        this.opacity = 1.0;
        this.isFadingOut = false;
        this.fadeStartTime = 0;
        this.fadeDuration = 500;
        
        // Calculate offset from block position
        this.offsetX = endX - targetBlock.x; // Offset from block's left edge
        this.offsetY = endY - targetBlock.y; // Offset from block's top edge

        this.lastPosition = { x: startX, y: startY };
    }

    startFadingOut() {
        this.isFadingOut = true;
        this.fadeStartTime = Date.now();
    }
    
    update(engine) {
        if (!this.isActive) return;

        if (this.isFadingOut) {
            const elapsed = Date.now() - this.fadeStartTime;
            this.opacity = Math.max(0, 1.0 - elapsed / this.fadeDuration);
            if (this.opacity <= 0) {
                this.isActive = false;
                return;
            }
        }
        
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        
        // Calculate current target position based on block position
        const currentEndX = this.targetBlock.x + this.offsetX;
        const currentEndY = this.targetBlock.y + this.offsetY;
        
        if (!this.hasReached) {
            // Ease-out animation to block-relative position
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // Update position towards block-relative coordinates
            this.currentX = this.startX + (currentEndX - this.startX) * easeProgress;
            this.currentY = this.startY + (currentEndY - this.startY) * easeProgress;
            
            // When animation completes, mark as reached
            if (progress >= 1) {
                this.hasReached = true;
            }
        } else {
            // Particle has reached destination, follow the block
            this.currentX = currentEndX;
            this.currentY = currentEndY;
            if (this.currentX === this.lastPosition.x && this.currentY === this.lastPosition.y) {
                if (!this.isFadingOut) {
                    // This is to prevent the particle from being stuck in the same position
                    this.isFadingOut = true;
                    this.fadeStartTime = Date.now();
                }
            }
            this.lastPosition = { x: this.currentX, y: this.currentY };
        }
    }
    
    render(ctx) {
        if (!this.isActive) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // Draw event particle as a small glowing circle
        const color = EventColors[this.event.type] || '#fff';
        
        // Different rendering based on state
        if (this.hasReached) {
            // Particle has reached destination - make it slightly larger and more visible
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(this.currentX, this.currentY, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add a subtle ring effect
            ctx.shadowBlur = 0;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.currentX, this.currentY, 6, 0, 2 * Math.PI);
            ctx.stroke();
        } else {
            // Particle is moving - original rendering
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(this.currentX, this.currentY, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw small trail
            ctx.shadowBlur = 0;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(this.currentX - 2, this.currentY, 1, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
