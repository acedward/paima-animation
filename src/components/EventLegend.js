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

    draw(ctx) {
        const legendX = this.x;
        const legendY = this.y;
        const itemHeight = 20;
        const padding = 10;

        ctx.font = '12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        this.events.forEach((event, index) => {
            const yPos = legendY + index * itemHeight;
            
            ctx.fillStyle = event.color;
            ctx.fillRect(legendX, yPos - 5, 10, 10);
            
            ctx.fillStyle = 'white';
            ctx.fillText(event.name, legendX + 20, yPos);
        });
    }
}
