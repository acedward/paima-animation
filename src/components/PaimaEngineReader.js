
import * as COLORS from '../colors.js';

/**
 * @class PaimaEngineReader
 * @description Represents the Paima Engine Reader & Processor in the animation.
 * This component symbolizes the layer that reads from different blockchains.
 */
export class PaimaEngineReader {
    constructor(x, y) {
        this.width = 100;
        this.height = 400;
        this.y = y;
        this.x = x
        this.centerX = this.x + this.width / 2;
        this.centerY = this.y + this.height / 2;
        this.isBlinking = false;
        this.blinkState = 0;
    }

    startBlinking() {
        this.isBlinking = true;
    }

    stopBlinking() {
        this.isBlinking = false;
    }

    draw(ctx) {
        const boxX = this.x;
        const boxY = this.y;
        const boxWidth = this.width;
        const boxHeight = this.height;

        ctx.save();

        // Draw the main box
        ctx.fillStyle = COLORS.BACKGROUND_LIGHT_GREEN;
        if (this.isBlinking) {
            this.blinkState += 0.05;
            const sinValue = Math.sin(this.blinkState);
            if (sinValue > 0) {
                ctx.strokeStyle = COLORS.DARK_GREEN;
            } else {
                ctx.strokeStyle = 'rgb(118, 231, 196)';
            }
        } else {
            ctx.strokeStyle = COLORS.PRIMARY;
        }
        ctx.lineWidth = 1;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw title
        ctx.fillStyle = COLORS.WHITE;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Paima Engine ', this.centerX, boxY + boxHeight + 20);

        ctx.font = '12px Arial';
        ctx.fillText('Reader & Processor', this.centerX, boxY + boxHeight + 45);

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        };
    }

    isInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    getTooltipData() {
        return {
            title: 'Paima Engine Reader & Processor',
            content: 'This layer is responsible for reading data from various blockchains and processing it for the Paima Engine.',
            data: 'Status: Idle'
        };
    }
}
