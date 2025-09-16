import { actionConfig } from '../config.js';

export class Action {
    constructor(x, y, scheduledTime, index) {
        this.x = x;
        this.y = y;
        this.scheduledTime = scheduledTime; // When this action should execute
        this.index = index;
        this.width = actionConfig.width;
        this.height = actionConfig.height;
        this.color = actionConfig.color;
        this.opacity = 1.0;
        this.isActive = true;
        this.isExecuted = false;
        this.events = []; // Store events that target this action
        
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
    }
    
    update(currentTime) {
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
}
