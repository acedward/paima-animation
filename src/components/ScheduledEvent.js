import { actionConfig } from '../config.js';

import { SCHEDULED_EVENT_COLORS } from '../colors.js';

/**
 * @class ScheduledEvent
 * @description Represents a scheduled event in the animation, which is triggered at a specific time.
 * This class is also aliased as `ScheduledEvent`.
 * 
 * An `Action` is created from events within a block and is scheduled for future execution.
 * It manages its own state, including waiting at the "NOW" line, transitioning its shape,
 * and traveling to a target SQL table. It's responsible for its own rendering and for
 * providing detailed tooltip information.
 */
export class ScheduledEvent {
    constructor(x, y, scheduledTime, index, block) {
        this.x = x;
        this.y = y;
        this.scheduledTime = scheduledTime; // When this action should execute
        this.index = index;
        this.width = actionConfig.width;
        this.height = actionConfig.height;
        this.color = SCHEDULED_EVENT_COLORS.MAIN;
        this.opacity = 1.0;
        this.isActive = true;
        this.isExecuted = false;
        this.events = []; // Store events that target this action
        this.block = block;
        this.targetTable = null;
        this.targetPaimaBlock = null;
        
        // Travel to table state
        this.isTravelingToTable = false;
        this.travelStartTime = 0;
        this.travelDuration = 2000; // 2 seconds - faster travel
        this.startX = 0;
        this.startY = 0;
        this.targetTable = null;
        this.targetX = 0;
        this.targetY = 0;
        
        // Shape transformation
        this.shapes = ['circle', 'triangle', 'square', 'diamond'];
        this.currentShape = 'square'; // Start as square
        this.targetShape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
        this.shapeTransitionProgress = 0;
        this.lastProgressLogged = -1; // For debugging travel
        
        // Waiting state after execution
        this.isWaitingAtNow = false;
        this.waitStartTime = 0;
        this.waitDuration = 0; // 1 second wait at NOW line
        
        // Fading out state
        this.isFadingOut = false;
        this.fadeStartTime = 0;
        this.fadeDuration = 500; // ms
        this.hasFadeoutCompleted = false;
    }
    
    startFadingOut() {
        this.isFadingOut = true;
        this.fadeStartTime = Date.now();
    }
    
    update(currentTime) {
        if (this.isFadingOut) {
            const elapsed = Date.now() - this.fadeStartTime;
            this.opacity = Math.max(0, 1.0 - elapsed / this.fadeDuration);
            if (this.opacity === 0) {
                this.isActive = false;
                this.hasFadeoutCompleted = true;
        
                // There is a where events are still visible after the action has faded out
                setTimeout(() => {
                    this.events.forEach(event => {
                        event.opacity = 0;
                    });  
                }, 500);
            }
            return false;
        }
        
        if (this.isWaitingAtNow) {
            // Handle waiting at NOW line
            const elapsed = Date.now() - this.waitStartTime;
            if (elapsed >= this.waitDuration) {
                // Wait complete, ready to travel
                this.isWaitingAtNow = false;
                return { readyToTravel: true };
            }
            return false;
        } else if (this.isTravelingToTable) {
            // This part is no longer used, but we keep it to avoid breaking things if referenced.
            // It will be cleaned up in a future refactor.
        } else {
            // Action is executed when current time reaches or passes scheduled time
            if (currentTime >= this.scheduledTime && !this.isExecuted) {
                this.isExecuted = true;
                this.isWaitingAtNow = true;
                this.waitStartTime = Date.now();
                return true; // Signal that action should be executed
            }
        }
        return false;
    }
    
            startTravelToTable(targetTable) {
        this.isTravelingToTable = true;
        this.travelStartTime = Date.now();
        this.startX = this.x;
        this.startY = this.y;
        this.targetTable = targetTable;
        
        // Calculate target position using the table's configured position
        this.targetX = targetTable.x + targetTable.width / 2;
        this.targetY = targetTable.y + targetTable.height / 2;
        
        // Keep original color, don't change to orange
        this.lastProgressLogged = -1; // Reset progress logging
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        if (this.isTravelingToTable || this.isFadingOut) {
            // Draw clean traveling/fading action - slightly bigger than normal
            const size = 12; // Slightly bigger than normal (20px width -> 12px radius)
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            ctx.fillStyle = this.color;
            ctx.strokeStyle = SCHEDULED_EVENT_COLORS.BORDER;
            ctx.lineWidth = 1;
            
            // Smooth shape transition based on progress
            if (this.shapeTransitionProgress < 0.3) {
                // Early travel: show current shape only
                this._renderShape(ctx, this.currentShape, centerX, centerY, size);
            } else if (this.shapeTransitionProgress > 0.7) {
                // Late travel: show target shape only
                this._renderShape(ctx, this.targetShape, centerX, centerY, size);
            } else {
                // Middle travel: blend both shapes
                const blendProgress = (this.shapeTransitionProgress - 0.3) / 0.4; // 0 to 1 over the 0.3-0.7 range
                
                // Draw current shape with decreasing opacity
                ctx.globalAlpha = this.opacity * (1 - blendProgress);
                this._renderShape(ctx, this.currentShape, centerX, centerY, size);
                
                // Draw target shape with increasing opacity
                ctx.globalAlpha = this.opacity * blendProgress;
                this._renderShape(ctx, this.targetShape, centerX, centerY, size);
                
                // Reset alpha
                ctx.globalAlpha = this.opacity;
            }
        } else if (this.isWaitingAtNow) {
            // Draw action waiting at NOW line - same as normal but at NOW position
            // Draw action shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(this.x + 1, this.y + 1, this.width, this.height);
            
            // Draw main action square
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw action border
            ctx.strokeStyle = SCHEDULED_EVENT_COLORS.BORDER;
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Draw action number
            ctx.fillStyle = SCHEDULED_EVENT_COLORS.TEXT;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.index.toString(), this.x + this.width/2, this.y + this.height/2 + 3);
        } else {
            // Draw normal scheduled action
            // Draw action shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(this.x + 1, this.y + 1, this.width, this.height);
            
            // Draw main action square
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Draw action border
            ctx.strokeStyle = SCHEDULED_EVENT_COLORS.BORDER;
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            
            // Draw action number
            ctx.fillStyle = SCHEDULED_EVENT_COLORS.TEXT;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.index.toString(), this.x + this.width/2, this.y + this.height/2 + 3);
        }
        
        ctx.restore();
    }

    _renderShape(ctx, shape, x, y, size) {
        ctx.beginPath();
        
        switch (shape) {
            case 'triangle':
                ctx.moveTo(x, y - size);
                ctx.lineTo(x - size, y + size);
                ctx.lineTo(x + size, y + size);
                ctx.closePath();
                break;
            case 'square':
                ctx.rect(x - size, y - size, size * 2, size * 2);
                break;
            case 'diamond':
                ctx.moveTo(x, y - size);
                ctx.lineTo(x + size, y);
                ctx.lineTo(x, y + size);
                ctx.lineTo(x - size, y);
                ctx.closePath();
                break;
            case 'circle':
                ctx.arc(x, y, size, 0, 2 * Math.PI);
                break;
            default:
                ctx.rect(x - size, y - size, size * 2, size * 2);
                break;
        }
        
        ctx.fill();
    }

    isInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    getTooltipData(engineStartTime) {
        const scheduledTime = new Date(engineStartTime + this.scheduledTime);
        let status = 'Scheduled';
        if (this.isExecuted) status = 'Executed';
        if (this.isWaitingAtNow) status = 'Waiting at NOW';
        if (this.isTravelingToTable) status = 'Traveling to table';
        
        return {
            title: `Scheduled Event #${this.index}`,
            content: `Status: ${status}<br>
                     Events: ${this.events.length}<br>
                     ${this.targetTable ? `Target: ${this.targetTable.name}` : ''}`,
            data: `Scheduled: ${scheduledTime.toLocaleTimeString()}<br>
                   Shape: ${this.currentShape} → ${this.targetShape}<br>
                   ${this.events.length > 0 ? `Event types: ${this.events.map(e => e.type).join(', ')}` : ''}`
        };
    }
}
