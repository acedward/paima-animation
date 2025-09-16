import { Block } from './Block.js';

export class ProcessedEvent {
    constructor(action, target, engine) {
        this.engine = engine;
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
        const start = { x: action.x, y: action.y };
        const center = { x: bp.centerX, y: bp.centerY };
        
        let finalTargetPos;

        if (target instanceof Block) { // target is a block (Paima)
            finalTargetPos = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
            const bottomExit = { x: bp.bottomExitX, y: bp.bottomExitY };
            this.path = [start, center, bottomExit, finalTargetPos];
            this.pathDurations = [500, 300, 600]; // ms for each segment
            this.color = '#006400'; // Darker green
        } else { // target is a table (SQL)
            finalTargetPos = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
            const leftExit = { x: bp.leftExitX, y: bp.leftExitY };
            this.path = [start, center, leftExit, finalTargetPos];
            this.pathDurations = [500, 300, 1200];
            this.color = '#138a5e'; // Original Paima green
        }

        this.startTime = Date.now();
        this.duration = this.pathDurations.reduce((a, b) => a + b, 0);
        this.isActive = true;
        this.radius = 6;
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
            if (this.currentPathSegment === 0) {
                this.engine.triggerBlockProcessorAnimation();
            }
            this.currentPathSegment++;
            this.segmentStartTime = Date.now();
            if (this.currentPathSegment >= this.pathDurations.length) {
                this.hasReached = true;
                if (!(this.target instanceof Block)) {
                    this.isActive = false;
                }
            }
        }
    }
}
