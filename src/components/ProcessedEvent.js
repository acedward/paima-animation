import { Block } from './Block.js';

/**
 * @class ProcessedEvent
 * @description Represents an event that has been processed by the `BlockProcessor` and is being animated towards its final destination.
 * 
 * This class manages the multi-stage journey of a processed event. It visualizes the event's
 * path from an `Action` to the `BlockProcessor`, and then from the processor to either an
 * SQL table or a Paima Engine block. The particle's movement is defined by a series of
 * path segments with specific durations, creating a guided animation through the system.
 */
export class ProcessedEvent {
    constructor(action, target, engine, startPos = null) {
        this.engine = engine;
        this.action = action;
        this.x = action.x;
        this.y = action.y;
        this.target = target;
        this.events = action.events;
        
        this.path = [];
        this.pathDurations = [];
        this.currentPathSegment = 0;
        this.segmentStartTime = Date.now();
        this.hasReached = false;
        this.addedToBlock = false;

        const bp = this.engine.blockProcessor;
        const start = startPos || { x: action.x, y: action.y };
        const center = { x: bp.centerX, y: bp.centerY };
        
        let finalTargetPos;

        if (target instanceof Block) { // target is a block (Paima)
            finalTargetPos = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
            const bottomExit = { x: bp.bottomExitX, y: bp.bottomExitY };
            if (startPos) {
                this.path = [start, bottomExit, finalTargetPos];
                this.pathDurations = [300, 600]; // ms for each segment
            } else {
                this.path = [start, center, bottomExit, finalTargetPos];
                this.pathDurations = [500, 300, 600]; // ms for each segment
            }
            this.color = '#006400'; // Darker green
        } else if (target.hasOwnProperty('nowPosition')) { // Target is the Block Processor
            finalTargetPos = { x: action.x, y: bp.centerY };
            this.path = [start, finalTargetPos];
            this.pathDurations = [500];
            this.color = '#3498db'; // A distinct blue color
        } else { // target is a table (SQL)
            finalTargetPos = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
            const leftExit = { x: bp.leftExitX, y: bp.leftExitY };
            if (startPos) {
                this.path = [start, leftExit, finalTargetPos];
                this.pathDurations = [300, 1200];
            } else {
                this.path = [start, center, leftExit, finalTargetPos];
                this.pathDurations = [500, 300, 1200];
            }
            this.color = '#138a5e'; // Original Paima green
        }

        this.startTime = Date.now();
        this.duration = this.pathDurations.reduce((a, b) => a + b, 0);
        this.isActive = true;
        this.radius = 6;
        this.alpha = 1;
    }

    update() {
        if (!this.isActive) return;

        if (this.hasReached) {
            if (this.target instanceof Block) {
                if (!this.addedToBlock) {
                    this.target.addAccumulatedEvent(this);
                    this.addedToBlock = true;
                }
                if (this.target.x + this.target.width < -100) {
                    this.isActive = false;
                    this.target.removeAccumulatedEvent(this);
                }
            } else {
                this.isActive = false;
            }
            return;
        }

        const segmentElapsed = Date.now() - this.segmentStartTime;
        let progress = Math.min(segmentElapsed / this.pathDurations[this.currentPathSegment], 1);

        const segmentStart = this.path[this.currentPathSegment];
        const segmentEnd = this.path[this.currentPathSegment + 1];

        // If last segment and target is a block, update target position dynamically
        if (this.currentPathSegment === this.path.length - 2 && this.target instanceof Block) {
            segmentEnd.x = this.target.x + this.target.width / 2;
            segmentEnd.y = this.target.y + this.target.height / 2;
        }

        this.x = segmentStart.x + (segmentEnd.x - segmentStart.x) * progress;
        this.y = segmentStart.y + (segmentEnd.y - segmentStart.y) * progress;

        if (progress >= 1) {
            this.currentPathSegment++;
            this.segmentStartTime = Date.now();
            if (this.currentPathSegment >= this.pathDurations.length) {
                this.hasReached = true;

                if (this.target.hasOwnProperty('nowPosition')) {
                    this.engine.triggerBlockProcessorAnimation();

                    if (this.action.targetTable) {
                        const eventToSql = new ProcessedEvent(this.action, this.action.targetTable, this.engine, { x: this.x, y: this.y });
                        this.engine.processedEvents.push(eventToSql);
                    }
                    if (this.action.targetPaimaBlock) {
                        const eventToPaima = new ProcessedEvent(this.action, this.action.targetPaimaBlock, this.engine, { x: this.x, y: this.y });
                        this.engine.processedEvents.push(eventToPaima);
                    }
                }

                if (!(this.target instanceof Block)) {
                    if (!this.target.hasOwnProperty('nowPosition')) {
                        this.engine.processActionEvents(this.action);
                    }
                    this.isActive = false;
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
}
