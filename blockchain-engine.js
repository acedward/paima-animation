// Blockchain Engine - Logic only, no UI dependencies
// Compatible with both browser and Node.js environments

(function(global) {
    'use strict';

    // Block properties
    const baseBlockWidth = 100; // Increased for better number visibility
    const blockHeight = 40;
    const blockSpacing = 2;
    const baseTimingMs = 2000;
    const greyColor = '#7f8c8d';
    
    // Flat color palette for merged blocks
    const mergeColors = [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', 
        '#1abc9c', '#e67e22', '#34495e', '#f1c40f', '#16a085'
    ];
    
    // Table configuration
    const tableConfig = {
        width: 220,
        height: 140,
        headerHeight: 25,
        rowHeight: 20,
        maxRows: 5,
        spacing: 30,
        blinkDuration: 1500 // ms - increased for more subtle effect
    };
    
    // Action configuration
    const actionConfig = {
        height: 20, // 1/3 of block height (60px / 3)
        width: 20,  // Square shape
        yPosition: 270, // Between tables and chains
        futureTimeRange: 1000, // Schedule actions up to 1 seconds in the future
        color: '#ffffff'
    };
    
    // Calculate block width based on timing
    function getBlockWidth(timingMs) {
        return baseBlockWidth * (timingMs / baseTimingMs);
    }
    
    // Sample data generators
    function generateRandomAddress() {
        const chars = '0123456789abcdef';
        let address = '0x';
        for (let i = 0; i < 40; i++) {
            address += chars[Math.floor(Math.random() * chars.length)];
        }
        return address.substring(0, 12) + '...'; // Truncate for display
    }
    
    function generateRandomBalance() {
        return (Math.random() * 1000).toFixed(2);
    }
    
    function generateRandomUserId() {
        return Math.floor(Math.random() * 999) + 1;
    }
    
    function generateRandomPosition() {
        return {
            x: Math.floor(Math.random() * 10),
            y: Math.floor(Math.random() * 10)
        };
    }
    
    function generateRandomCharacterId() {
        return Math.floor(Math.random() * 5) + 1;
    }
    
    function generateRandomAssetId() {
        return Math.floor(Math.random() * 9999) + 1;
    }
    
    // Generate blockchain events
    function generateBlockchainEvent(chainName) {
        const eventTypes = ['erc20_transfer', 'erc721_transfer', 'game_move', 'account_created'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        const timestamp = Date.now();
        
        switch (eventType) {
            case 'erc20_transfer':
                return {
                    type: 'erc20_transfer',
                    chain: chainName,
                    timestamp: timestamp,
                    data: {
                        from: generateRandomAddress(),
                        to: generateRandomAddress(),
                        amount: generateRandomBalance()
                    }
                };
            case 'erc721_transfer':
                return {
                    type: 'erc721_transfer',
                    chain: chainName,
                    timestamp: timestamp,
                    data: {
                        tokenId: generateRandomAssetId(),
                        from: generateRandomAddress(),
                        to: generateRandomAddress()
                    }
                };
            case 'game_move':
                const pos = generateRandomPosition();
                return {
                    type: 'game_move',
                    chain: chainName,
                    timestamp: timestamp,
                    data: {
                        userId: generateRandomUserId(),
                        x: pos.x,
                        y: pos.y,
                        characterId: generateRandomCharacterId()
                    }
                };
            case 'account_created':
                return {
                    type: 'account_created',
                    chain: chainName,
                    timestamp: timestamp,
                    data: {
                        userId: generateRandomUserId(),
                        address: generateRandomAddress()
                    }
                };
            default:
                return null;
        }
    }

    class Block {
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
    
    class Action {
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

    class ProcessedEvent {
        constructor(action, target, engine) {
            this.engine = engine;
            this.x = action.x;
            this.y = action.y;
            this.target = target;
            
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


    class EventParticle {
        constructor(startX, startY, endX, endY, event, targetBlock, index, duration = 2000) {
            this.startX = startX;
            this.startY = startY;
            this.initialEndX = endX; // Store initial target position
            this.initialEndY = endY;
            this.currentX = startX;
            this.currentY = startY;
            this.event = event;
            this.targetBlock = targetBlock; // Store reference to target block
            this.index = index;
            this.duration = duration;
            this.startTime = Date.now();
            this.isActive = true;
            this.hasReached = false;
            this.opacity = 1.0;
            
            // Calculate offset from block position
            this.offsetX = endX - targetBlock.x; // Offset from block's left edge
            this.offsetY = endY - targetBlock.y; // Offset from block's top edge
            
            // Event type colors
            this.eventColors = {
                'erc20_transfer': '#f39c12',
                'erc721_transfer': '#9b59b6',
                'game_move': '#3498db',
                'account_created': '#2ecc71'
            };
        }
        
        update(engine) {
            if (!this.isActive) return;
            
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            
            // Calculate current target position based on block position
            const currentEndX = this.targetBlock.x + this.offsetX;
            const currentEndY = this.targetBlock.y + this.offsetY;
            
            if (!this.hasReached) {
                // Ease-out animation to block-relative position
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                
                // Update position towards block-relative coordinates
                this.currentX = this.startX + (currentEndX - this.startX) * easeProgress;
                this.currentY = this.startY + (currentEndY - this.startY) * easeProgress;
                
                // When animation completes, mark as reached
                if (progress >= 1) {
                    this.hasReached = true;
                }
            } else {
                // Particle has reached destination, follow the block
                this.currentX = currentEndX;
                this.currentY = currentEndY;
                
                // Pulse effect
                const pulseTime = Date.now() * 0.003;
                this.opacity = 0.8 + 0.2 * Math.sin(pulseTime);
            }
        }
        
        render(ctx) {
            if (!this.isActive) return;
            
            ctx.save();
            ctx.globalAlpha = this.opacity;
            
            // Draw event particle as a small glowing circle
            const color = this.eventColors[this.event.type] || '#fff';
            
            // Different rendering based on state
            if (this.hasReached) {
                // Particle has reached destination - make it slightly larger and more visible
                ctx.shadowColor = color;
                ctx.shadowBlur = 12;
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(this.currentX, this.currentY, 4, 0, 2 * Math.PI);
                ctx.fill();
                
                // Add a subtle ring effect
                ctx.shadowBlur = 0;
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(this.currentX, this.currentY, 6, 0, 2 * Math.PI);
                ctx.stroke();
            } else {
                // Particle is moving - original rendering
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(this.currentX, this.currentY, 3, 0, 2 * Math.PI);
                ctx.fill();
                
                // Draw small trail
                ctx.shadowBlur = 0;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(this.currentX - 2, this.currentY, 1, 0, 2 * Math.PI);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    class UserRequestParticle {
        constructor(startX, startY, endX, endY, duration = 1500) {
            this.startX = startX;
            this.startY = startY;
            this.endX = endX;
            this.endY = endY;
            this.currentX = startX;
            this.currentY = startY;
            this.duration = duration;
            this.startTime = Date.now();
            this.isActive = true;
            this.hasReached = false;
        }

        update() {
            if (!this.isActive) return;

            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(elapsed / this.duration, 1);

            if (!this.hasReached) {
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                this.currentX = this.startX + (this.endX - this.startX) * easeProgress;
                this.currentY = this.startY + (this.endY - this.startY) * easeProgress;

                if (progress >= 1) {
                    this.hasReached = true;
                    this.isActive = false; // Deactivate when it reaches the batcher
                }
            }
        }
    }

    class BlockProcessorParticle {
        constructor(startX, startY, endX, endY, duration = 1500) {
            this.startX = startX;
            this.startY = startY;
            this.endX = endX;
            this.endY = endY;
            this.currentX = startX;
            this.currentY = startY;
            this.duration = duration;
            this.startTime = Date.now();
            this.isActive = true;
            this.hasReached = false;
        }

        update() {
            if (!this.isActive) return;

            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(elapsed / this.duration, 1);

            if (!this.hasReached) {
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                this.currentX = this.startX + (this.endX - this.startX) * easeProgress;
                this.currentY = this.startY + (this.endY - this.startY) * easeProgress;

                if (progress >= 1) {
                    this.hasReached = true;
                    this.isActive = false; // Deactivate when it reaches the batcher
                }
            }
        }
    }

    class UserDevice {
        constructor(x, y, name = 'User') {
            this.x = x;
            this.y = y;
            this.radius = 5;
            this.color = '#ffffff';
            this.name = name;
            this.lastRequestTime = Date.now();
            this.requestInterval = Math.random() * 4000 + 1000;
    
            this.state = 'FADING_IN'; // FADING_IN, ACTIVE, FADING_OUT
            this.opacity = 0;
            this.fadeDuration = 1000; // 1 second fade
            this.stateChangeTime = Date.now();
            this.isActive = true;
        }
    
        update(engine) {
            const now = Date.now();
            const elapsed = now - this.stateChangeTime;
    
            // Handle state and opacity
            if (this.state === 'FADING_IN') {
                this.opacity = Math.min(1, elapsed / this.fadeDuration);
                if (this.opacity >= 1) {
                    this.state = 'ACTIVE';
                }
            } else if (this.state === 'FADING_OUT') {
                this.opacity = Math.max(0, 1 - (elapsed / this.fadeDuration));
                if (this.opacity <= 0) {
                    this.isActive = false; // Mark for removal
                }
            }
    
            // Only send requests if active
            if (this.state === 'ACTIVE' && now - this.lastRequestTime > this.requestInterval) {
                this.lastRequestTime = now;
                this.requestInterval = Math.random() * 4000 + 1000;
                
                if (engine.batcher) {
                    const particle = new UserRequestParticle(
                        this.x,
                        this.y,
                        engine.batcher.x + engine.batcher.width / 2,
                        engine.batcher.y + engine.batcher.height / 2
                    );
                    engine.userRequestParticles.push(particle);
                }
            }
        }
    
        disappear() {
            if (this.state === 'ACTIVE') {
                this.state = 'FADING_OUT';
                this.stateChangeTime = Date.now();
            }
        }
    }

    class BatcherParticle {
        constructor(startX, startY, targetChain, event, engine, duration = 1000) {
            this.startX = startX;
            this.startY = startY;
            this.currentX = startX;
            this.currentY = startY;
            
            this.targetChain = targetChain; // Store the whole chain object
            this.engine = engine;
            this.event = event;
            
            this.duration = duration;
            this.startTime = Date.now();
            this.isActive = true;
            
            this.state = 'TRAVELING_TO_WAIT_POINT'; // TRAVELING_TO_WAIT_POINT, WAITING
            
            const eventColors = {
                'erc20_transfer': '#f39c12',
                'erc721_transfer': '#9b59b6',
                'game_move': '#3498db',
                'account_created': '#2ecc71'
            };
            this.color = eventColors[event.type] || '#e67e22';
            this.opacity = 1.0;
        }
    
        update() {
            if (!this.isActive) return;
    
            const nowPosition = this.engine.blockProcessor.nowPosition;
            const waitPositionX = nowPosition + 100;
            // Target Y is the middle of the chain's row
            const targetY = this.targetChain.yPosition + blockHeight / 2; 
    
            if (this.state === 'TRAVELING_TO_WAIT_POINT') {
                const elapsed = Date.now() - this.startTime;
                const progress = Math.min(elapsed / this.duration, 1);
                
                const easeProgress = 1 - Math.pow(1 - progress, 2);
                this.currentX = this.startX + (waitPositionX - this.startX) * easeProgress;
                this.currentY = this.startY + (targetY - this.startY) * easeProgress;
    
                if (progress >= 1) {
                    this.state = 'WAITING';
                    this.currentX = waitPositionX;
                    this.currentY = targetY;
                }
            } else if (this.state === 'WAITING') {
                // Just wait at the position
                this.currentX = waitPositionX;
                this.currentY = targetY;
            }
        }
    }

    class Batcher {
        constructor(x, y) {
            this.x = x - 50;
            this.y = y;
            this.width = 120;
            this.height = 100;
            this.color = '#2980b9';
            this.requestsReceived = 0;
        }

        receiveRequest(engine) {
            this.requestsReceived++;
            // Find a random secondary chain
            const secondaryChains = engine.blockchains.filter(bc => bc.name !== 'Paima Engine');

            if (secondaryChains.length > 0) {
                const randomChain = secondaryChains[Math.floor(Math.random() * secondaryChains.length)];
                
                const event = generateBlockchainEvent(randomChain.name);

                if (event) {
                    const particle = new BatcherParticle(
                        this.x + this.width / 2,
                        this.y + this.height / 2,
                        randomChain, // Pass the whole chain object
                        event,
                        engine
                    );
                    engine.batcherParticles.push(particle);
                }
            }
        }
    }
    
    class BlockchainEngine {
        _createNewUserDevice() {
            const x = this.canvasWidth * 0.87 + Math.random() * 80; // Right side of the screen
            const y = Math.random() * 80 + this.canvasHeight * 0.7; // Spread vertically
            const deviceName = `User ${this.userDeviceCounter++}`;
            return new UserDevice(x, y, deviceName);
        }

        constructor(canvasWidth = 1200, canvasHeight = 1000) {
            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;
            this.blockCount = 0;
            this.lastFrameTime = Date.now();
            this.eventParticles = []; // Track animated event particles
            this.actions = []; // Track scheduled actions
            this.processedEvents = []; // Track events after processing
            this.actionCounter = 0; // Track action numbering
            this.currentMergeColorIndex = 0;
            this.userDevices = [];
            this.userDeviceCounter = 0;
            this.batcher = null;
            this.userRequestParticles = [];
            this.batcherParticles = [];
            this.blockProcessorParticles = [];

            this.deviceLifecycleInterval = 2000;
            this.nextDeviceCheck = Date.now() + this.deviceLifecycleInterval;
            this.maxUserDevices = 20;
            this.minUserDevices = 5;

            this.blockProcessorToBatcherChance = 0.005;

            this.blockProcessor = {
                nowPosition: this.canvasWidth * 0.725,
                width: 180,
                height: 120,
                y: 230,
            };
            this.blockProcessor.x = this.blockProcessor.nowPosition - this.blockProcessor.width / 2;
            this.blockProcessor.centerX = this.blockProcessor.x + this.blockProcessor.width / 2;
            this.blockProcessor.centerY = this.blockProcessor.y + this.blockProcessor.height / 2;
            this.blockProcessor.leftExitX = this.blockProcessor.x;
            this.blockProcessor.leftExitY = this.blockProcessor.y + this.blockProcessor.height / 2;
            this.blockProcessor.bottomExitX = this.blockProcessor.x + this.blockProcessor.width / 2;
            this.blockProcessor.bottomExitY = this.blockProcessor.y + this.blockProcessor.height;
            
            // Animation state
            this.blockProcessor.isAnimating = false;
            this.blockProcessor.animationStartTime = 0;
            this.blockProcessor.animationDuration = 500; // ms
            this.blockProcessor.highlightedStateKey = null;
            this.blockProcessor.highlightedArrowKey = null;
            
            // Time tracking - starts at 0 when engine initializes
            this.engineStartTime = Date.now();
            
            // Initialize SQL tables
            this.initializeTables();
            this.initializeBatcherAndDevices();
            
            // Blockchain configuration with consistent spacing - moved down to make room for tables and actions
            // const chainStartY = 310; // Moved down to make room for actions row
            // const chainSpacing = 100; // Decreased from 120 to 100 for better fit
            
            this.blockchains = [
                // {
                //     name: 'Paima Engine',
                //     color: () => '#19b17b',
                //     yPosition: chainStartY,
                //     timing: { type: 'fixed', interval: 1000 },
                //     counter: 0,
                //     blocks: [],
                //     lastBlockTime: 0,
                //     lastBlockEndTime: 0 // Track when the last block ended
                // },
                // {
                //     name: 'Ethereum',
                //     color: () => greyColor,
                //     yPosition: chainStartY + chainSpacing,
                //     timing: { type: 'fixed', interval: 12000 }, // 12 seconds
                //     counter: 0,
                //     blocks: [],
                //     lastBlockTime: 0,
                //     lastBlockEndTime: 0
                // },
                // {
                //     name: 'Arbitrum',
                //     color: () => greyColor,
                //     yPosition: chainStartY + chainSpacing * 2,
                //     timing: { type: 'fixed', interval: 250 }, // ~0.25 seconds
                //     counter: 0,
                //     blocks: [],
                //     lastBlockTime: 0,
                //     lastBlockEndTime: 0
                // },
                // {
                //     name: 'Solana',
                //     color: () => greyColor,
                //     yPosition: chainStartY + chainSpacing * 3,
                //     timing: { type: 'fixed', interval: 400 }, // ~2 seconds
                //     counter: 0,
                //     blocks: [],
                //     lastBlockTime: 0,
                //     lastBlockEndTime: 0
                // },
                // {
                //     name: 'Cardano',
                //     color: () => greyColor,
                //     yPosition: chainStartY + chainSpacing * 4,
                //     timing: { type: 'fixed', interval: 20000 }, // 20 seconds
                //     counter: 0,
                //     blocks: [],
                //     lastBlockTime: 0,
                //     lastBlockEndTime: 0
                // },
                // {
                //     name: 'Midnight',
                //     color: () => greyColor,
                //     yPosition: chainStartY + chainSpacing * 5,
                //     timing: { type: 'fixed', interval: 6000 }, // 6 seconds
                //     counter: 0,
                //     blocks: [],
                //     lastBlockTime: 0,
                //     lastBlockEndTime: 0
                // }
            ];
        }
        
        initializeTables() {
            this.tables = {
                erc20_balance: {
                    name: 'ERC20 Balance',
                    columns: ['Address', 'Balance'],
                    data: [], // Start empty
                    x: 50,
                    y: 60,
                    width: tableConfig.width,
                    height: tableConfig.height,
                    isBlinking: false,
                    blinkStartTime: 0,
                    lastModified: 0
                },
                erc721_ownership: {
                    name: 'ERC721 Ownership',
                    columns: ['Asset ID', 'Owner'],
                    data: [], // Start empty
                    x: 50 + tableConfig.width + tableConfig.spacing,
                    y: 60,
                    width: tableConfig.width,
                    height: tableConfig.height,
                    isBlinking: false,
                    blinkStartTime: 0,
                    lastModified: 0
                },
                current_position: {
                    name: 'Current Position',
                    columns: ['User ID', 'X', 'Y', 'Char ID'],
                    data: [], // Start empty
                    x: 50 + (tableConfig.width + tableConfig.spacing) * 2,
                    y: 60,
                    width: tableConfig.width,
                    height: tableConfig.height,
                    isBlinking: false,
                    blinkStartTime: 0,
                    lastModified: 0
                },
                accounts_to_address: {
                    name: 'Accounts to Address',
                    columns: ['User ID', 'Address'],
                    data: [], // Start empty
                    x: 50 + (tableConfig.width + tableConfig.spacing) * 3,
                    y: 60,
                    width: tableConfig.width,
                    height: tableConfig.height,
                    isBlinking: false,
                    blinkStartTime: 0,
                    lastModified: 0
                }
            };
        }
        
        initializeBatcherAndDevices() {
            this.batcher = new Batcher(this.canvasWidth * 0.9, this.canvasHeight / 2);

            for (let i = 0; i < 10; i++) {
                this.userDevices.push(this._createNewUserDevice());
            }
        }

        blockProcessorSendsEventToBatcher() {
            if (this.batcher) {
                const particle = new BlockProcessorParticle(
                    this.blockProcessor.centerX,
                    this.blockProcessor.centerY,
                    this.batcher.x + this.batcher.width / 2,
                    this.batcher.y + this.batcher.height / 2
                );
                this.blockProcessorParticles.push(particle);
            }
        }

        // Get current engine time in milliseconds since start
        getCurrentTime() {
            return Date.now() - this.engineStartTime;
        }
        
        // Process blockchain events and update SQL tables
        // NOTE: This now only processes events when they reach tables via actions
        processBlockchainEvents(events) {
            events.forEach(event => {
                const currentTime = Date.now();
                
                switch (event.type) {
                    case 'erc20_transfer':
                        this.updateERC20Balance(event.data.to, event.data.amount, currentTime);
                        break;
                    case 'erc721_transfer':
                        this.updateERC721Ownership(event.data.tokenId, event.data.to, currentTime);
                        break;
                    case 'game_move':
                        this.updateCurrentPosition(event.data.userId, event.data.x, event.data.y, event.data.characterId, currentTime);
                        break;
                    case 'account_created':
                        this.updateAccountsToAddress(event.data.userId, event.data.address, currentTime);
                        break;
                }
            });
        }
        
        // Process events from an action when it reaches a table
        processActionEvents(action) {
            const currentTime = Date.now();
            
            action.events.forEach(event => {
                switch (event.type) {
                    case 'erc20_transfer':
                        this.updateERC20Balance(event.data.to, event.data.amount, currentTime);
                        break;
                    case 'erc721_transfer':
                        this.updateERC721Ownership(event.data.tokenId, event.data.to, currentTime);
                        break;
                    case 'game_move':
                        this.updateCurrentPosition(event.data.userId, event.data.x, event.data.y, event.data.characterId, currentTime);
                        break;
                    case 'account_created':
                        this.updateAccountsToAddress(event.data.userId, event.data.address, currentTime);
                        break;
                }
            });
        }
        
        // Select the appropriate table for an action based on its events
        selectAppropriateTable(action) {
            if (action.events.length === 0) {
                // Fallback to random table if no events
                const tableNames = Object.keys(this.tables);
                const randomTableName = tableNames[Math.floor(Math.random() * tableNames.length)];
                return this.tables[randomTableName];
            }
            
            // Priority mapping for event types to tables
            const eventToTable = {
                'erc20_transfer': 'erc20_balance',
                'erc721_transfer': 'erc721_ownership',
                'game_move': 'current_position',
                'account_created': 'accounts_to_address'
            };
            
            // Find the first event type that maps to a table
            for (const event of action.events) {
                const tableName = eventToTable[event.type];
                if (tableName && this.tables[tableName]) {
                    return this.tables[tableName];
                }
            }
            
            // Fallback to random table if no mapping found
            const tableNames = Object.keys(this.tables);
            const randomTableName = tableNames[Math.floor(Math.random() * tableNames.length)];
            return this.tables[randomTableName];
        }
        
        updateERC20Balance(address, amount, timestamp) {
            const table = this.tables.erc20_balance;
            const newRow = {row: [address, amount], timestamp: timestamp};
            table.data.push(newRow);
            this.maintainTableSize(table);
            this.triggerTableBlink(table, timestamp);
        }
        
        updateERC721Ownership(tokenId, owner, timestamp) {
            const table = this.tables.erc721_ownership;
            const newRow = {row: [tokenId.toString(), owner], timestamp: timestamp};
            table.data.push(newRow);
            this.maintainTableSize(table);
            this.triggerTableBlink(table, timestamp);
        }
        
        updateCurrentPosition(userId, x, y, characterId, timestamp) {
            const table = this.tables.current_position;
            const newRow = {row: [userId.toString(), x.toString(), y.toString(), characterId.toString()], timestamp: timestamp};
            table.data.push(newRow);
            this.maintainTableSize(table);
            this.triggerTableBlink(table, timestamp);
        }
        
        updateAccountsToAddress(userId, address, timestamp) {
            const table = this.tables.accounts_to_address;
            const newRow = {row: [userId.toString(), address], timestamp: timestamp};
            table.data.push(newRow);
            this.maintainTableSize(table);
            this.triggerTableBlink(table, timestamp);
        }
        
        maintainTableSize(table) {
            // Sort by timestamp descending (newest first)
            table.data.sort((a, b) => b.timestamp - a.timestamp);
            
            // Keep only max rows
            if (table.data.length > tableConfig.maxRows) {
                table.data = table.data.slice(0, tableConfig.maxRows);
            }
        }
        
        triggerTableBlink(table, timestamp) {
            table.isBlinking = true;
            table.blinkStartTime = Date.now();
            table.lastModified = timestamp;
        }
        
        updateTableBlinking() {
            const currentTime = Date.now();
            
            Object.values(this.tables).forEach(table => {
                if (table.isBlinking && (currentTime - table.blinkStartTime) > tableConfig.blinkDuration) {
                    table.isBlinking = false;
                }
            });
        }
        
        createBlock(blockchain, timingMs = 2000) {
            const height = blockHeight;
            const color = blockchain.color();
            const counter = blockchain.counter++;
            
            // Time tracking: start time is when previous block ended (or 0 for first block)
            const startTime = blockchain.lastBlockEndTime;
            const endTime = this.getCurrentTime();
            
            // Position and width will be calculated automatically based on timestamps in the update loop
            // Initialize with placeholder values
            const x = 0;
            const width = 1; // Placeholder, will be calculated in update loop
            
            const block = new Block(x, blockchain.yPosition, color, counter, width, height, 0, startTime, endTime, blockchain);
            
            // Consume waiting batcher particles for this chain
            const waitingParticles = this.batcherParticles.filter(p => 
                p.targetChain.name === blockchain.name && p.state === 'WAITING'
            );
        
            waitingParticles.forEach(particle => {
                block.events.push(particle.event);
                particle.isActive = false; // Deactivate the particle
            });

            // Add blockchain events to non-Paima blocks (70% chance)
            const time = block.endTime - block.startTime;
            // if time is more than 1000ms, then generate an event
            // if time is less than generate an event with time/1000 chance
            if (blockchain.name !== 'Paima Engine' && (time > 1000 || Math.random() < time/1000)) {
                const event = generateBlockchainEvent(blockchain.name);
                if (event) {
                    block.events.push(event);
                }
            }
            
            blockchain.blocks.push(block);
            
            // Update the blockchain's last block end time
            blockchain.lastBlockEndTime = endTime;
            
            // Actions are now created by events, not by Paima blocks
            
            if (blockchain.name === 'Paima Engine') {
                this.blockchains.forEach(secondaryChain => {
                    if (secondaryChain.name === 'Paima Engine') return;

                    secondaryChain.blocks.forEach(secondaryBlock => {
                        if (secondaryBlock.endTime > block.startTime && secondaryBlock.endTime <= block.endTime && !secondaryBlock.eventsProcessed) {
                            this.createActionsFromBlock(secondaryBlock);
                            secondaryBlock.eventsProcessed = true;

                            const newColor = mergeColors[this.currentMergeColorIndex % mergeColors.length];
                            secondaryBlock.startColorAnimation(newColor);
                            this.currentMergeColorIndex++;
                        }
                    });
                });
            }

            return block;
        }
        
        createActionForEvent(event) {
            // Create a single action for a specific event (1:1 relationship)
            const currentTime = this.getCurrentTime();
            
            // Schedule action in the future with random interval (0.5-3 seconds from now)
            const randomDelay = Math.random() * 2500 + 500; // 500ms to 3000ms
            const futureTime = currentTime + randomDelay;
            
            // Calculate initial position (will be updated in update loop)
            const action = new Action(0, actionConfig.yPosition, futureTime, this.actionCounter++);
            
            // Associate the event with this action
            action.events.push(event);
            
            this.actions.push(action);
            return action;
        }
        
        createActionsFromBlock(block) {
            block.events.forEach((event, index) => {
                // Create an action for the event
                const action = this.createActionForEvent(event);

                // Create a particle from the block to the action
                const startX = block.x + block.width / 2;
                const startY = block.y + block.height / 2;
                const endX = action.x + action.width / 2;
                const endY = action.y + action.height / 2;

                // The particle will target the action object directly
                const particle = new EventParticle(startX, startY, endX, endY, event, action, index, 1500);
                
                // Stagger particle creation slightly
                setTimeout(() => {
                    this.eventParticles.push(particle);
                }, index * 100);
            });
        }

        checkProbabilityBlockGeneration(blockchain, currentTime) {
            const timeSinceLastBlock = currentTime - blockchain.lastBlockTime;
            const timing = blockchain.timing;
            
            // Check if we've reached one of the possible interval times
            if (timing.currentCheckIndex < timing.possibleIntervals.length) {
                const targetInterval = timing.possibleIntervals[timing.currentCheckIndex];
                
                if (timeSinceLastBlock >= targetInterval) {
                    // Calculate probability: 1 / (remaining intervals including current)
                    const remainingIntervals = timing.possibleIntervals.length - timing.currentCheckIndex;
                    const probability = 1 / remainingIntervals;
                    
                    if (Math.random() < probability) {
                        // Generate block with the actual time that has passed (not the target interval)
                        this.createBlock(blockchain, timeSinceLastBlock);
                        blockchain.lastBlockTime = currentTime;
                        timing.currentCheckIndex = 0; // Reset for next block
                        return true;
                    } else {
                        // Move to next interval check
                        timing.currentCheckIndex++;
                        
                        // If this was the last interval, force generate
                        if (timing.currentCheckIndex >= timing.possibleIntervals.length) {
                            this.createBlock(blockchain, timeSinceLastBlock);
                            blockchain.lastBlockTime = currentTime;
                            timing.currentCheckIndex = 0;
                            return true;
                        }
                    }
                }
            }
            
            return false;
        }
        
        update() {
            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;
            
            const currentEngineTime = this.getCurrentTime();
            
            // Update table blinking
            this.updateTableBlinking();

            if (Math.random() < this.blockProcessorToBatcherChance) {
                this.blockProcessorSendsEventToBatcher();
            }
            
            // Handle device lifecycle
            if (Date.now() > this.nextDeviceCheck) {
                // Attempt to remove a device
                if (this.userDevices.length > this.minUserDevices && Math.random() < 0.5) {
                    const activeDevices = this.userDevices.filter(d => d.state === 'ACTIVE');
                    if (activeDevices.length > 0) {
                        const deviceToDisappear = activeDevices[Math.floor(Math.random() * activeDevices.length)];
                        deviceToDisappear.disappear();
                    }
                }
        
                // Attempt to add a device
                if (this.userDevices.length < this.maxUserDevices && Math.random() < 0.5) {
                    this.userDevices.push(this._createNewUserDevice());
                }
        
                this.nextDeviceCheck = Date.now() + this.deviceLifecycleInterval;
            }

            // Update event particles
            this.eventParticles.forEach(particle => particle.update(this));
            
            // Update user devices and requests
            this.userDevices.forEach(device => device.update(this));
            this.userDevices = this.userDevices.filter(d => d.isActive !== false);

            this.userRequestParticles.forEach(particle => {
                particle.update();
                if (particle.hasReached) {
                    this.batcher.receiveRequest(this);
                }
            });

            this.blockProcessorParticles.forEach(particle => {
                particle.update();
                if (particle.hasReached) {
                    this.batcher.receiveRequest(this);
                }
            });

            // Remove inactive particles (but keep particles that have reached their destination)
            this.eventParticles = this.eventParticles.filter(particle => particle.isActive);
            this.userRequestParticles = this.userRequestParticles.filter(p => p.isActive);
            this.blockProcessorParticles = this.blockProcessorParticles.filter(p => p.isActive);

            // Update batcher particles
            this.batcherParticles.forEach(p => p.update());
            this.batcherParticles = this.batcherParticles.filter(p => p.isActive);

            // Update processed events
            this.processedEvents.forEach(pe => pe.update());
            this.processedEvents = this.processedEvents.filter(pe => pe.isActive);
            
            // Update actions and handle execution
            this.actions.forEach(action => {
                const actionResult = action.update(currentEngineTime);
                if (actionResult) {
                    if (typeof actionResult === 'object' && actionResult.completed) {
                        // Action reached table, process its events to update the table
                        this.processActionEvents(action);
                        this.triggerTableBlink(actionResult.targetTable, Date.now());
                    } else if (typeof actionResult === 'object' && actionResult.readyToTravel) {
                        // Action finished waiting at NOW, start travel to appropriate table
                        const targetTable = this.selectAppropriateTable(action);
                        // action.startTravelToTable(targetTable);
                        const paimaChain = this.blockchains.find(bc => bc.name === 'Paima Engine');
                        let targetPaimaBlock = null;
                        if (paimaChain && paimaChain.blocks.length > 0) {
                            targetPaimaBlock = paimaChain.blocks[paimaChain.blocks.length - 1];
                        }

                        // Create two processed events
                        const eventToSql = new ProcessedEvent(action, targetTable, this);
                        this.processedEvents.push(eventToSql);

                        if (targetPaimaBlock) {
                            const eventToPaima = new ProcessedEvent(action, targetPaimaBlock, this);
                            this.processedEvents.push(eventToPaima);
                        }
                        
                        // Process the action events immediately for table update, but visually it travels.
                        this.processActionEvents(action);
                        this.triggerTableBlink(targetTable, Date.now());


                        action.isActive = false; // Deactivate original action
                    }
                }
            });
            
            // Remove actions that have completed their journey and clean up related particles
            const removedActions = this.actions.filter(action => !action.isActive);
            this.actions = this.actions.filter(action => action.isActive);
            
            // Clean up event particles that were targeting removed actions
            if (removedActions.length > 0) {
                this.eventParticles = this.eventParticles.filter(particle => {
                    return !removedActions.some(action => particle.targetBlock === action);
                });
            }
            
            // Fixed NOW line position
            const nowPosition = this.canvasWidth * 0.8; // 960px for 1200px canvas
            
            // Convert time to pixels (1 second = 90 pixels - 10% slower)
            const pixelsPerSecond = 80;
            
            // Handle different blockchain timings - each operates independently
            this.blockchains.forEach((blockchain, index) => {
                // Initialize timing if this is the first time
                if (blockchain.lastBlockTime === 0) {
                    blockchain.lastBlockTime = currentTime;
                    blockchain.lastBlockEndTime = currentEngineTime; // First block starts at current engine time
                }
                
                // Handle different timing types
                if (blockchain.timing.type === 'fixed') {
                    const timeSinceLastBlock = currentTime - blockchain.lastBlockTime;
                    
                    if (timeSinceLastBlock >= blockchain.timing.interval) {
                        this.createBlock(blockchain, blockchain.timing.interval);
                        blockchain.lastBlockTime = currentTime;
                        
                        // Special case: increment blockCount for the first blockchain
                        if (index === 0 && this.blockCount < 6) {
                            this.blockCount++;
                        }
                    }
                } else if (blockchain.timing.type === 'probability') {
                    this.checkProbabilityBlockGeneration(blockchain, currentTime);
                }
            });
            
            // Position all blocks based on their timestamp relative to current time
            this.blockchains.forEach(blockchain => {
                blockchain.blocks.forEach(block => {
                    // Calculate position based on block's start and end times
                    const startTimeAgo = currentEngineTime - block.startTime;
                    const endTimeAgo = currentEngineTime - block.endTime;
                    
                    // Convert times to pixel positions
                    const startOffset = startTimeAgo * pixelsPerSecond / 1000;
                    const endOffset = endTimeAgo * pixelsPerSecond / 1000;
                    
                    // Position block based on its temporal span
                    const rightEdge = nowPosition - endOffset;
                    const leftEdge = nowPosition - startOffset;
                    
                    // Set block position and width based on actual time span
                    block.x = leftEdge;
                    block.width = rightEdge - leftEdge;
                    
                    // Update appearance animation only
                    block.update(deltaTime);
                });
            });
            
            // Position actions based on their scheduled time (only if not traveling or waiting)
            this.actions.forEach(action => {
                if (!action.isTravelingToTable && !action.isWaitingAtNow) {
                    const timeUntilExecution = action.scheduledTime - currentEngineTime;
                    const timeOffset = timeUntilExecution * pixelsPerSecond / 1000;
                    
                    // Position action based on when it should execute
                    action.x = nowPosition + timeOffset;
                } else if (action.isWaitingAtNow) {
                    // Keep action at NOW line while waiting
                    action.x = nowPosition;
                }
                // If traveling to table, position is handled by the action's update method
            });
            
            // Remove blocks that are too far off screen (left side)
            this.blockchains.forEach(blockchain => {
                while (blockchain.blocks.length > 0 && blockchain.blocks[0].x < -blockchain.blocks[0].width - 100) {
                    blockchain.blocks.shift();
                }
            });
            
            // Clean up particles that belong to removed blocks
            this.eventParticles = this.eventParticles.filter(particle => {
                // Keep particles whose target block still exists and is on screen
                return particle.targetBlock.x > -particle.targetBlock.width - 100;
            });

            // Reset block processor animation state after its duration
            if (this.blockProcessor.isAnimating && (Date.now() - this.blockProcessor.animationStartTime) > this.blockProcessor.animationDuration) {
                this.blockProcessor.isAnimating = false;
                this.blockProcessor.highlightedStateKey = null;
                this.blockProcessor.highlightedArrowKey = null;
            }
        }
        
        getStatus() {
            const currentEngineTime = this.getCurrentTime();
            const activeChains = [];
            this.blockchains.forEach(blockchain => {
                if (blockchain.blocks.length > 0) {
                    let timingLabel = '';
                    if (blockchain.timing.type === 'fixed') {
                        timingLabel = `(${blockchain.timing.interval / 1000}s)`;
                    } else if (blockchain.timing.type === 'probability') {
                        timingLabel = '(prob)';
                    }
                    activeChains.push(`${blockchain.name.replace(' Chain', '')} ${timingLabel}`);
                }
            });
            
            // Find most recently modified table
            let mostRecentTable = null;
            let mostRecentTime = 0;
            Object.values(this.tables).forEach(table => {
                if (table.lastModified > mostRecentTime) {
                    mostRecentTime = table.lastModified;
                    mostRecentTable = table.name;
                }
            });
            
            const tableStatus = mostRecentTable ? `| Last update: ${mostRecentTable}` : '';
            
            // Count particles by state
            const movingParticles = this.eventParticles.filter(p => !p.hasReached).length;
            const reachedParticles = this.eventParticles.filter(p => p.hasReached).length;
            
            const particleStatus = this.eventParticles.length > 0 ? 
                `| ${movingParticles} moving, ${reachedParticles} at actions` : '';
            
            const scheduledActions = this.actions.filter(a => !a.isExecuted && !a.isTravelingToTable && !a.isWaitingAtNow).length;
            const waitingActions = this.actions.filter(a => a.isWaitingAtNow).length;
            const travelingActions = this.actions.filter(a => a.isTravelingToTable).length;
            const totalActions = this.actions.length;
            
            const actionStatus = totalActions > 0 ? 
                `| ${scheduledActions} scheduled, ${waitingActions} waiting, ${travelingActions} traveling` : '';
            
            return `Engine Time: ${(currentEngineTime / 1000).toFixed(1)}s | ${activeChains.join(', ')} ${tableStatus} ${particleStatus} ${actionStatus}`;
        }

        triggerBlockProcessorAnimation() {
            this.blockProcessor.isAnimating = true;
            this.blockProcessor.animationStartTime = Date.now();

            const states = ['pending', 'processing', 'toSql', 'toPaima'];
            this.blockProcessor.highlightedStateKey = states[Math.floor(Math.random() * states.length)];
            
            const arrows = [['pending', 'processing'], ['processing', 'toSql'], ['processing', 'toPaima']];
            this.blockProcessor.highlightedArrowKey = arrows[Math.floor(Math.random() * arrows.length)];
        }
    }
    
    // Export for both browser and Node.js environments
    const BlockchainEngineModule = {
        BlockchainEngine,
        Block,
        Action,
        EventParticle,
        getBlockWidth,
        baseBlockWidth,
        blockHeight,
        blockSpacing,
        tableConfig,
        actionConfig
    };
    
    // Browser environment
    if (typeof window !== 'undefined') {
        window.BlockchainEngine = BlockchainEngineModule;
    }
    
    // Node.js environment
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BlockchainEngineModule;
    }
    
    // AMD environment
    if (typeof define === 'function' && define.amd) {
        define(function() {
            return BlockchainEngineModule;
        });
    }

})(typeof global !== 'undefined' ? global : this); 