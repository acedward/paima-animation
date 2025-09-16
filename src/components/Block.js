import { baseBlockWidth, blockHeight } from '../config.js';

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
}
