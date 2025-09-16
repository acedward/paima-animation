import { baseBlockWidth, blockHeight } from '../config.js';
import { EventTypes, EventColors } from './EventTypes.js';

/**
 * @class Block
 * @description Represents a single block in a blockchain for the animation.
 * 
 * This class is responsible for the visual representation of a block, including its appearance,
 * animations (like fading in and color changes), and displaying information such as the block number,
 * duration, and event indicators. It also handles the layout of accumulated events within the block.
 * Blocks can be of variable width and contain multiple events.
 */
export class Block {
    constructor(x, y, color, index, width = baseBlockWidth, height = blockHeight, speed = 0, startTime = 0, endTime = 0, blockchain = null) {
        this.x = x;
        this.y = y;
        this.originalColor = color;
        this.color = color;
        this.index = index;
        this.width = width;
        this.height = height;
        this.speed = speed; // Keep for compatibility but won't be used for positioning
        this.opacity = 0;
        this.scale = 0.5;
        this.startTime = startTime;
        this.endTime = endTime;
        this.duration = endTime - startTime;
        this.events = []; // Store blockchain events
        this.blockchain = blockchain; // Reference to the blockchain this block belongs to
        this.eventsProcessed = false; // Track if events from this block have been processed
        this.accumulatedEvents = [];
        this.colorAnimation = {
            isAnimating: false,
            startTime: 0,
            duration: 1000, // 1 second fade
            originalColor: null,
            targetColor: null,
            currentColor: null
        };
    }
    
    update(deltaTime) {
        // Animate appearance
        if (this.opacity < 1) {
            this.opacity += 0.05;
        }
        if (this.scale < 1) {
            this.scale += 0.02;
        }
        
        // Update color animation
        if (this.colorAnimation.isAnimating) {
            const elapsed = Date.now() - this.colorAnimation.startTime;
            const progress = Math.min(elapsed / this.colorAnimation.duration, 1);
            
            // Interpolate between original and target colors
            this.colorAnimation.currentColor = this.interpolateColor(
                this.colorAnimation.originalColor,
                this.colorAnimation.targetColor,
                progress
            );
            
            if (progress >= 1) {
                this.colorAnimation.isAnimating = false;
                this.color = this.colorAnimation.targetColor; // Final color
            }
        }
        if (this.accumulatedEvents.length > 0) {
            this.layoutAccumulatedEvents();
        }
    }
    
    addAccumulatedEvent(event) {
        if (!this.accumulatedEvents.includes(event)) {
            this.accumulatedEvents.push(event);
            this.layoutAccumulatedEvents();
        }
    }

    removeAccumulatedEvent(event) {
        const index = this.accumulatedEvents.indexOf(event);
        if (index > -1) {
            this.accumulatedEvents.splice(index, 1);
            this.layoutAccumulatedEvents();
        }
    }

    layoutAccumulatedEvents() {
        const startXInsideBlock = 5;
        const startYInsideBlock = this.height - 5;
        const spacing = 8;
        const rowHeight = 8;
        const eventsPerRow = Math.floor((this.width - startXInsideBlock * 2) / spacing);

        if (eventsPerRow <= 0) return;

        this.accumulatedEvents.forEach((event, index) => {
            const row = Math.floor(index / eventsPerRow);
            const col = index % eventsPerRow;

            event.x = this.x + startXInsideBlock + col * spacing;
            event.y = this.y + startYInsideBlock - row * rowHeight;
            event.radius = 3;
        });
    }

    startColorAnimation(targetColor) {
        this.colorAnimation.isAnimating = true;
        this.colorAnimation.startTime = Date.now();
        this.colorAnimation.originalColor = this.color;
        this.colorAnimation.targetColor = targetColor;
        this.colorAnimation.currentColor = this.color;
    }
    
    interpolateColor(color1, color2, progress) {
        // Helper function to parse hex color
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        // Helper function to convert RGB to hex
        const rgbToHex = (r, g, b) => {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        };
        
        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        
        if (!rgb1 || !rgb2) return color2; // Fallback if parsing fails
        
        const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * progress);
        const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * progress);
        const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * progress);
        
        return rgbToHex(r, g, b);
    }

    draw(ctx) {
        ctx.save();
        
        ctx.globalAlpha = this.opacity;
        
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(this.scale, this.scale);
        ctx.translate(-this.width/2, -this.height/2);
        
        // Draw block shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(2, 2, this.width, this.height);
        
        // Draw main block - use interpolated color during merge animation
        let currentColor = this.color;
        if (this.colorAnimation && this.colorAnimation.isAnimating) {
            currentColor = this.colorAnimation.currentColor;
            this.color = currentColor;
        }
        ctx.fillStyle = currentColor;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw block border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, this.width, this.height);
        

        // Draw event indicators (within transformation context)
        this._drawEventIndicators(ctx);
        
        // Always draw block number and timing info
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        
        if (this.width >= 60) {
            // Full info for wider blocks
            ctx.font = 'bold 12px Arial';
            ctx.fillText("#" + this.index, this.width/2, this.height/2 - 8);
            
            // Show duration below block number
            ctx.font = '10px Arial';
            ctx.fillText(`${(this.duration / 1000).toFixed(1)}s`, this.width/2, this.height/2 + 2);
            
            const eventCount = this.events.length + (this.accumulatedEvents || []).reduce((sum, pe) => sum + (pe.events ? pe.events.length : 0), 0);
            // Show event data info if block has events
            if (eventCount > 0) {
                ctx.font = 'bold 8px Arial';
                ctx.fillStyle = '#ffeb3b'; // Yellow for visibility
                ctx.fillText(`${eventCount} event${eventCount !== 1 ? 's' : ''}`, this.width/2, this.height/2 + 12);
            }
        } else if (this.width >= 30) {
            // Medium blocks - show number and duration
            ctx.font = 'bold 10px Arial';
            ctx.fillText("#" + this.index, this.width/2, this.height/2 - 8);
            ctx.font = '8px Arial';
            ctx.fillText(`${(this.duration / 1000).toFixed(1)}s`, this.width/2, this.height/2 + 8);
        } else {
            // Narrow blocks - just show block number
            ctx.font = 'bold 9px Arial';
            ctx.fillText("#" + this.index, this.width/2, this.height/2);
        }
        ctx.restore();
    }

    _drawEventIndicators(ctx) {
        const allEvents = [...this.events, ...(this.accumulatedEvents || []).flatMap(pe => pe.events || [])];
        if (allEvents.length === 0) return;

        // Only draw if block is wide enough
        if (this.width < 30) return;

        const dotSize = 6; // Increased from 3
        const spacing = dotSize + 2; // Spacing between dots
        const margin = 5; // Margin from the block edges

        const eventsPerRow = Math.floor((this.width - margin * 2) / spacing);
        if (eventsPerRow <= 0) return;

        allEvents.forEach((event, index) => {
            const row = Math.floor(index / eventsPerRow);
            const col = index % eventsPerRow;

            const eventX = margin + col * spacing + dotSize / 2;
            const eventY = this.height - margin - (row * spacing) - dotSize / 2;

            // Don't draw if it would go outside the block's top edge
            if (eventY - dotSize / 2 < margin) return;

            // Draw event indicator dot
            if (this.blockchain.name === 'Paima Engine') {
                // darker green for paima engine
                ctx.fillStyle = '#006400';
            } else {
                ctx.fillStyle = EventColors[event.type] || '#fff';
            }
            ctx.beginPath();
            ctx.arc(eventX, eventY, dotSize / 2, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    isInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    getTooltipData(engineStartTime) {
        const startTime = new Date(engineStartTime + this.startTime);
        const endTime = new Date(engineStartTime + this.endTime);
        const allEvents = [...this.events, ...(this.accumulatedEvents || []).flatMap(pe => pe.events || [])];
        
        return {
            title: `${this.blockchain.name} Block #${this.index}`,
            content: `Duration: ${(this.duration / 1000).toFixed(1)}s<br>
                     Events: ${allEvents.length}`,
            data: `Start: ${startTime.toLocaleTimeString()}<br>
                   End: ${endTime.toLocaleTimeString()}<br>
                   ${allEvents.length > 0 ? `Events: ${allEvents.map(e => e.type).join(', ')}` : ''}`
        };
    }
}
