import * as COLORS from '../colors.js';

/**
 * @class EventLegend
 * @description Manages and displays a legend for the different event types in the animation.
 * 
 * This class is responsible for dynamically tracking the types of events that appear in the simulation
 * and assigning a unique color to each. It then renders a legend on the canvas, showing the color-coded
 * list of event types, which helps the user to visually identify the different kinds of events
 * as they move across the screen.
 */
export class EventLegend {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.events = [];
        this.eventColorMap = {};
        this.colorPalette = COLORS.MERGE_COLORS;
        this.nextColorIndex = 0;
    }

    addEventType(eventName) {
        if (!this.eventColorMap[eventName]) {
            this.eventColorMap[eventName] = this.colorPalette[this.nextColorIndex % this.colorPalette.length];
            this.nextColorIndex++;
            this.events.push({ name: eventName, color: this.eventColorMap[eventName] });
        }
    }

    getColorForEvent(eventName) {
        return this.eventColorMap[eventName] || COLORS.WHITE;
    }

    draw(ctx, eventParticles) {
        // Automatically add new event types from particles
        eventParticles.forEach(particle => {
            this.addEventType(particle.event.type);
        });

        const legendX = this.x;
        const legendY = this.y;
        const itemHeight = 20;
        const padding = 10;
        const width = 130;

        // Draw legend background
        ctx.fillStyle = COLORS.BLACK;
        ctx.fillRect(legendX - 10, legendY - 15, width, this.events.length * itemHeight + 30);
        
        // Draw legend border
        ctx.strokeStyle = COLORS.DARK_GREY;
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX - 10, legendY - 15, width, this.events.length * itemHeight + 30);

        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = COLORS.WHITE;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Event Types:', legendX, legendY);
        
        this.events.forEach((event, index) => {
            const yPos = legendY + 20 + index * itemHeight;
            
            ctx.fillStyle = event.color;
            ctx.fillRect(legendX, yPos - 5, 10, 10);
            
            ctx.fillStyle = COLORS.WHITE;
            ctx.font = '9px Arial';
            ctx.fillText(event.name, legendX + 20, yPos);
        });
    }
}
