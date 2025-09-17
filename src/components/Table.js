import { tableConfig } from '../config.js';
import * as COLORS from '../colors.js';

/**
 * @class Table
 * @description Represents an SQL table in the animation.
 * 
 * This class is responsible for visualizing a database table, including its header,
 * columns, and rows of data. It handles the display of data, with features like
 * alternating row colors and highlighting the newest entry. It also has a blinking
 * effect to indicate when it's being updated.
 */
export class Table {
    constructor(name, columns, x, y) {
        this.name = name;
        this.columns = columns;
        this.x = x;
        this.y = y;
        this.width = tableConfig.width;
        this.height = tableConfig.height;
        this.data = []; // Start empty
        this.isBlinking = false;
        this.blinkStartTime = 0;
        this.lastModified = 0;
    }

    updateData(rowData, timestamp) {
        const newRow = { row: rowData, timestamp };
        this.data.push(newRow);
        this._maintainTableSize();
        this._triggerBlink(timestamp);
    }

    _maintainTableSize() {
        this.data.sort((a, b) => b.timestamp - a.timestamp);
        if (this.data.length > tableConfig.maxRows) {
            this.data = this.data.slice(0, tableConfig.maxRows);
        }
    }

    _triggerBlink(timestamp) {
        this.isBlinking = true;
        this.blinkStartTime = Date.now();
        this.lastModified = timestamp;
    }

    update() {
        const currentTime = Date.now();
        if (this.isBlinking && (currentTime - this.blinkStartTime) > tableConfig.blinkDuration) {
            this.isBlinking = false;
        }
    }

    draw(ctx) {
        const config = tableConfig;
        
        // Draw table background with subtle blinking effect
        if (this.isBlinking) {
            // Subtle oscillating opacity for blink effect
            const blinkProgress = (Date.now() - this.blinkStartTime) / config.blinkDuration;
            const blinkOpacity = 0.15 + 0.1 * Math.abs(Math.sin(blinkProgress * Math.PI * 3)); // Reduced intensity and frequency
            ctx.fillStyle = `rgba(25, 177, 123, ${blinkOpacity})`;
        } else {
            ctx.fillStyle = COLORS.LIGHTEST_GREY;
        }
        ctx.fillRect(this.x, this.y, config.width, config.height);
        
        // Draw table border (slightly brighter when blinking)
        if (this.isBlinking) {
            ctx.strokeStyle = COLORS.PRIMARY; // Subtle green instead of bright
            ctx.lineWidth = 2.5;
        } else {
            ctx.strokeStyle = COLORS.PRIMARY_ALT;
            ctx.lineWidth = 2;
        }
        ctx.strokeRect(this.x, this.y, config.width, config.height);
        
        // Draw table header
        ctx.fillStyle = COLORS.PRIMARY;
        ctx.fillRect(this.x, this.y, config.width, config.headerHeight);
        
        // Draw table title
        ctx.fillStyle = COLORS.WHITE;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + config.width / 2, this.y + config.headerHeight / 2 + 4);
        
        // Draw column headers
        const columnWidth = config.width / this.columns.length;
        ctx.fillStyle = COLORS.LIGHTER_GREY;
        ctx.font = '10px Arial';
        
        this.columns.forEach((column, index) => {
            const columnX = this.x + index * columnWidth;
            const columnCenterX = columnX + columnWidth / 2;
            ctx.fillText(column, columnCenterX, this.y + config.headerHeight + 15);
        });
        
        // Draw separator line after headers
        ctx.strokeStyle = COLORS.DARK_GREY_2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + config.headerHeight + 20);
        ctx.lineTo(this.x + config.width, this.y + config.headerHeight + 20);
        ctx.stroke();
        
        // Draw table data (already sorted by timestamp in engine)
        this.data.forEach((rowData, rowIndex) => {
            const row = rowData.row;
            const rowY = this.y + config.headerHeight + 35 + (rowIndex * config.rowHeight);
            
            // Alternate row background - inset by 1px to stay inside border
            if (rowIndex % 2 === 1) {
                ctx.fillStyle = COLORS.DARK_GREY;
                ctx.fillRect(this.x + 1, rowY - 10, config.width - 2, config.rowHeight);
            }
            
            // Highlight newest row (index 0) with subtle glow - inset by 1px to stay inside border
            if (rowIndex === 0) {
                ctx.fillStyle = 'rgba(25, 177, 123, 0.08)'; // More subtle
                // ctx.fillStyle = COLORS.BACKGROUND_LIGHT_GREEN; // More subtle
                ctx.fillRect(this.x + 1, rowY - 10, config.width - 2, config.rowHeight);
            }
            
            // Draw row data
            ctx.fillStyle = rowIndex === 0 ? COLORS.PRIMARY : COLORS.WHITE; // Subtle green for newest
            ctx.font = '9px Arial';
            row.forEach((cell, cellIndex) => {
                const cellX = this.x + cellIndex * columnWidth;
                const cellCenterX = cellX + columnWidth / 2;
                ctx.fillText(cell, cellCenterX, rowY);
            });
        });
        
        // Draw column separator lines
        ctx.strokeStyle = COLORS.DARK_GREY_2;
        ctx.lineWidth = 1;
        for (let i = 1; i < this.columns.length; i++) {
            const lineX = this.x + i * columnWidth;
            ctx.beginPath();
            ctx.moveTo(lineX, this.y + config.headerHeight);
            ctx.lineTo(lineX, this.y + config.height);
            ctx.stroke();
        }
    }

    isInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    getTooltipData() {
        const lastUpdate = this.lastModified ? new Date(this.lastModified) : null;
        
        return {
            title: `SQL Table: ${this.name}`,
            content: `Rows: ${this.data.length}<br>
                     Columns: ${this.columns.join(', ')}<br>
                     ${this.isBlinking ? `<span style="color: ${COLORS.PRIMARY};">UPDATING</span>` : 'Idle'}`,
            data: `Last update: ${lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}<br>
                   Latest data: ${this.data.length > 0 ? this.data[0].row.join(' | ') : 'None'}`
        };
    }
}
