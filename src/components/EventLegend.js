export class EventLegend {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.events = [];
        this.eventColorMap = {};
        this.colorPalette = [
            '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#f1c40f',
            '#e67e22', '#e74c3c', '#ecf0f1', '#7f8c8d'
        ];
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
        return this.eventColorMap[eventName] || '#ffffff';
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(legendX - 10, legendY - 15, width, this.events.length * itemHeight + 30);
        
        // Draw legend border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX - 10, legendY - 15, width, this.events.length * itemHeight + 30);

        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Event Types:', legendX, legendY);
        
        this.events.forEach((event, index) => {
            const yPos = legendY + 20 + index * itemHeight;
            
            ctx.fillStyle = event.color;
            ctx.fillRect(legendX, yPos - 5, 10, 10);
            
            ctx.fillStyle = 'white';
            ctx.font = '9px Arial';
            ctx.fillText(event.name, legendX + 20, yPos);
        });
    }
}
