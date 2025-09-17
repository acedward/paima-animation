import * as COLORS from '../colors.js';

/**
 * @class BlockProcessor
 * @description Represents the block processor in the animation, which processes events from merged blocks.
 * 
 * This class visualizes a state machine for block processing, including states for pending,
 * processing, and outputting to SQL and Paima. It handles the drawing of the processor box,
 * the states as circles, and the transitions as arrows. It also provides tooltip information
 * about its status.
 */
export class BlockProcessor {
    constructor(nowPosition, canvasWidth, canvasHeight) {
        this.nowPosition = nowPosition;
        this.width = 180;
        this.height = 120;
        this.y = 230;
        this.x = this.nowPosition - this.width;
        this.centerX = this.x + this.width / 2;
        this.centerY = this.y + this.height / 2;
        this.leftExitX = this.x;
        this.leftExitY = this.y + this.height / 2;
        this.bottomExitX = this.x + this.width / 2;
        this.bottomExitY = this.y + this.height;
        
        // Animation state
        this.isAnimating = false;
        this.animationStartTime = 0;
        this.animationDuration = 500; // ms
        this.highlightedStateKey = null;
        this.highlightedArrowKey = null;
    }

    draw(ctx) {
        const boxX = this.x;
        const boxY = this.y;
        const boxWidth = this.width;
        const boxHeight = this.height;
        const nowPosition = this.centerX;

        ctx.save();

        // Draw the main box
        ctx.fillStyle = COLORS.BACKGROUND_LIGHT_GREEN;
        ctx.strokeStyle = COLORS.PRIMARY;
        ctx.lineWidth = 1;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw title
        ctx.fillStyle = COLORS.PRIMARY;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Block Processor', nowPosition, boxY + 20);

        // State machine diagram elements
        const states = {
            pending: { x: boxX + 40, y: boxY + 50, label: 'A\'' },
            processing: { x: boxX + 140, y: boxY + 50, label: 'B' },
            toSql: { x: boxX + 40, y: boxY + 100, label: 'C' },
            toPaima: { x: boxX + 140, y: boxY + 100, label: 'D' }
        };

        const { isAnimating, highlightedStateKey, highlightedArrowKey } = this;

        // Draw states (circles)
        ctx.fillStyle = COLORS.WHITE;
        ctx.font = '10px Arial';
        Object.entries(states).forEach(([key, state]) => {
            ctx.beginPath();
            ctx.arc(state.x, state.y, 15, 0, 2 * Math.PI);
            ctx.fillStyle = COLORS.DARK_GREY;
            ctx.fill();

            if (isAnimating && key === highlightedStateKey) {
                ctx.strokeStyle = COLORS.BLUE;
                ctx.lineWidth = 2;
            } else {
                ctx.strokeStyle = COLORS.PRIMARY;
                ctx.lineWidth = 1;
            }
            ctx.stroke();

            if (isAnimating && key === highlightedStateKey) {
                ctx.fillStyle = COLORS.BLUE;
            } else {
                ctx.fillStyle = COLORS.WHITE;
            }
            ctx.fillText(state.label, state.x, state.y);
        });

        // Draw arrows
        this._drawArrow(ctx, states.pending, states.processing, isAnimating && highlightedArrowKey && highlightedArrowKey[0] === 'pending' && highlightedArrowKey[1] === 'processing');
        this._drawArrow(ctx, states.processing, states.toSql, isAnimating && highlightedArrowKey && highlightedArrowKey[0] === 'processing' && highlightedArrowKey[1] === 'toSql');
        this._drawArrow(ctx, states.processing, states.toPaima, isAnimating && highlightedArrowKey && highlightedArrowKey[0] === 'processing' && highlightedArrowKey[1] === 'toPaima');

        ctx.restore();
    }

    _drawArrow(ctx, from, to, isHighlighted = false) {
        const headlen = 10; // length of head in pixels
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);

        // Adjust start and end points to be on the edge of the circles
        const startX = from.x + 15 * Math.cos(angle);
        const startY = from.y + 15 * Math.sin(angle);
        const endX = to.x - 15 * Math.cos(angle);
        const endY = to.y - 15 * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));

        if (isHighlighted) {
            ctx.strokeStyle = COLORS.BLUE;
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = COLORS.PRIMARY;
            ctx.lineWidth = 1;
        }
        ctx.stroke();
    }

    isInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    getTooltipData() {
        return {
            title: 'Block Processor',
            content: 'Processes events from merged blocks, validates and transforms contents into SQL data and generates Paima L2 Blocks.',
            data: `Status: ${this.isAnimating ? 'Applying State Transformations' : 'Idle'}`
        };
    }
}
