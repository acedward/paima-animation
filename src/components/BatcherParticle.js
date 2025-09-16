import { blockHeight } from '../config.js';

export class BatcherParticle {
    constructor(startX, startY, targetChain, event, engine, duration = 1000) {
        this.startX = startX;
        this.startY = startY;
        this.currentX = startX;
        this.currentY = startY;
        
        this.targetChain = targetChain; // Store the whole chain object
        this.engine = engine;
        this.event = event;
        
        this.duration = duration;
        this.startTime = Date.now();
        this.isActive = true;
        
        this.state = 'TRAVELING_TO_WAIT_POINT'; // TRAVELING_TO_WAIT_POINT, WAITING
        
        const eventColors = {
            'erc20_transfer': '#f39c12',
            'erc721_transfer': '#9b59b6',
            'game_move': '#3498db',
            'account_created': '#2ecc71'
        };
        this.color = eventColors[event.type] || '#e67e22';
        this.opacity = 1.0;
    }

    update() {
        if (!this.isActive) return;

        const nowPosition = this.engine.blockProcessor.nowPosition;
        const waitPositionX = nowPosition + 100;
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
        }
    }
}
