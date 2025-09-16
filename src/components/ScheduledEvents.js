/**
 * @class ScheduledEvents
 * @description Represents a queue for scheduled events in the animation.
 * 
 * This class visualizes a box that holds scheduled events waiting to be processed.
 * It's responsible for drawing the container, displaying the number of queued events,
 * and providing methods to add and retrieve actions from the queue.
 */
export class ScheduledEvents {
    constructor(x, y) {
        this.width = 180;
        this.height = 120;
        this.y = y; // Positioned above the block processor for now
        this.x = x;
        this.centerX = this.x + this.width / 2;
        this.centerY = this.y + this.height / 2;
        
        this.actions = [];
    }

    draw(ctx) {
        const boxX = this.x;
        const boxY = this.y;
        const boxWidth = this.width;
        const boxHeight = this.height;
        const nowPosition = this.centerX;

        ctx.save();

        // Draw the main box
        ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 1;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw title
        ctx.fillStyle = '#3498db';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Scheduled Events', this.centerX, boxY + 20);
        
        // Display number of scheduled events
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(`Queued: ${this.actions.length}`, this.centerX, boxY + 100);

        ctx.restore();
    }

    isInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    getTooltipData() {
        return {
            title: 'Scheduled Events',
            content: 'A queue of events scheduled to be processed by the Block Processor.',
            data: `Event count: ${this.actions.length}`
        };
    }
    
    // Method to add actions
    addAction(action) {
        this.actions.push(action);
    }

    // Method to get and remove the next action
    getNextAction() {
        return this.actions.shift();
    }
}
