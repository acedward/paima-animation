import * as COLORS from '../colors.js';

/**
 * @class NowLine
 * @description Renders the "NOW" line indicator on the canvas.
 */
export class NowLine {
    constructor(canvas) {
        this.canvas = canvas;
        this.nowPosition = this.canvas.width * 0.8;
    }

    draw(ctx) {
        // Draw "now" indicator line
        ctx.strokeStyle = COLORS.PRIMARY;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(this.nowPosition, 360); // Start below the actions row
        ctx.lineTo(this.nowPosition, this.canvas.height - 40);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash pattern

        // Draw "NOW" label
        ctx.fillStyle = COLORS.PRIMARY;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NOW', this.nowPosition, this.canvas.height - 27);
    }
}
