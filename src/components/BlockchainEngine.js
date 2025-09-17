import { blockHeight, actionConfig } from '../config.js';
import { generateBlockchainEvent } from '../utils/helpers.js';
import { ScheduledEvent } from './ScheduledEvent.js';
import { Batcher } from './Batcher.js';
import { BatcherParticle } from './BatcherParticle.js';
import { Block } from './Block.js';
import { BlockProcessorParticle } from './BlockProcessorParticle.js';
import { EventParticle } from './EventParticle.js';
import { ProcessedEvent } from './ProcessedEvent.js';
import { UserDevice } from './UserDevice.js';
import { UserDevices } from './UserDevices.js';
import { randomMultipliers } from '../random.js';
import { UserRequestParticle } from './UserRequestParticle.js';
import { Table } from './Table.js';
import { BlockProcessor } from './BlockProcessor.js';
import { EventTypes } from './EventTypes.js';
import { PaimaEngineChain } from './PaimaEngineChain.js';
import { PaimaEngineReader } from './PaimaEngineReader.js';
import { ScheduledEvents } from './ScheduledEvents.js';
import { Chain } from './Chain.js';
import { ChainManager } from './ChainManager.js';
import { TableManager } from './TableManager.js';

function checkIntersection(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

/**
 * @class BlockchainEngine
 * @description The core logic engine for the blockchain animation.
 * 
 * This class manages the state and behavior of the entire simulation. It is responsible for:
 * - Creating and managing blockchains, blocks, and events.
 * - Handling the lifecycle of particles (user requests, event particles, etc.).
 * - Orchestrating the flow of data from user devices to batchers, blockchains, the block processor, and finally to SQL tables.
 * - Updating the positions and states of all animated objects.
 * - Providing a status summary of the engine's current state.
 */
export class BlockchainEngine {
    constructor(canvasWidth = 1200, canvasHeight = 1000) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.blockCount = 0;
        this.lastFrameTime = Date.now();
        this.eventParticles = []; // Track animated event particles
        this.processedEvents = []; // Track events after processing
        this.actionCounter = 0; // Track action numbering
        this.currentMergeColorIndex = 0;
        this.userDevices = new UserDevices(this);
        this.batcher = null;
        this.userRequestParticles = [];
        this.batcherParticles = [];
        this.blockProcessorParticles = [];

        this.blockProcessorToBatcherChance = 0.005;

        this.blockProcessor = new BlockProcessor(this.canvasWidth * 0.805);
        this.paimaEngineReader = new PaimaEngineReader(this.canvasWidth * 0.7, this.canvasHeight / 2);
        this.scheduledEvents = new ScheduledEvents(this.canvasWidth * 0.810, this.canvasHeight * 0.23);
        
        this.chainManager = new ChainManager(this);
        this.tableManager = new TableManager(this);

        // Time tracking - starts at 0 when engine initializes
        this.engineStartTime = Date.now();
        
        this.initializeBatcherAndDevices();
        
        // Blockchain configuration with consistent spacing - moved down to make room for tables and actions
        // const chainStartY = 310; // Moved down to make room for actions row
        // const chainSpacing = 100; // Decreased from 120 to 100 for better fit
        
        // this.blockchains = [
        // ];
    }
    
    get blockchains() {
        return this.chainManager.blockchains;
    }

    get tables() {
        return this.tableManager.tables;
    }

    scheduleChainAdditions() {
        this.chainManager.scheduleChainAdditions();
    }

    addChainProgrammatically(name, blockTimeSeconds) {
        this.chainManager.addChainProgrammatically(name, blockTimeSeconds);
    }

    addChain(name, blockTimeSeconds) {
        this.chainManager.addChain(name, blockTimeSeconds);
    }
    
    addXAIChain() {
        this.chainManager.addXAIChain();
    }
    
    removeChain(chainId) {
        this.chainManager.removeChain(chainId);
    }

    clearAllChains() {
        this.chainManager.clearAllChains();
    }

    initializeBatcherAndDevices() {
        this.batcher = new Batcher(this.canvasWidth * 0.9, this.canvasHeight / 2);
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
    
    processActionEvents(action) {
        this.tableManager.processActionEvents(action);
    }
    
    selectAppropriateTable(action) {
        return this.tableManager.selectAppropriateTable(action);
    }
    
    createBlock(blockchain) {
        const block = blockchain.createBlock(this.getCurrentTime(), this.batcherParticles);
        
        if (blockchain instanceof PaimaEngineChain) {
            blockchain.processSecondaryChains(this.blockchains, (block) => this.createActionsFromBlock(block));
        }

        return block;
    }
    
    createActionForEvent(event, block) {
        // Create a single action for a specific event (1:1 relationship)
        const currentTime = this.getCurrentTime();
        
        // Schedule action in the future with random interval (0.5-3 seconds from now)
        const randomDelay = Math.random() * randomMultipliers.actionCreationDelay.multiplier + randomMultipliers.actionCreationDelay.offset; // 500ms to 3000ms
        const futureTime = currentTime + randomDelay;
        
        // Calculate initial position (will be updated in update loop)
        const action = new ScheduledEvent(0, actionConfig.yPosition, futureTime, this.actionCounter++, block);
        
        // Associate the event with this action
        action.events.push(event);
        
        this.scheduledEvents.addAction(action);
        return action;
    }
    
    createActionsFromBlock(block) {
        block.events.forEach((event, index) => {
            // Create an action for the event
            const action = this.createActionForEvent(event, block);

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
        
        this.tableManager.update();

        if (this.blockProcessor.isAnimating && Math.random() < randomMultipliers.blockProcessorToBatcherChance) {
            this.blockProcessorSendsEventToBatcher();
        }
        
        // Update event particles
        this.eventParticles.forEach(particle => particle.update(this));
        
        // Update user devices and requests
        this.userDevices.update();

        this.userRequestParticles.forEach(particle => {
            particle.update();
            if (particle.hasReached) {
                if (particle.target === this.batcher) {
                    this.batcher.receiveRequest(this);
                } else if (particle.target && typeof particle.target.yPosition !== 'undefined') { // It's a blockchain
                    const event = generateBlockchainEvent(particle.target.name);
                    if (event) {
                        const newParticle = new BatcherParticle(
                            particle.currentX,
                            particle.currentY,
                            particle.target, // the chain
                            event,
                            this
                        );
                        newParticle.state = 'WAITING'; // It's already at the waiting position, so it can be picked up by next block
                        const nowPosition = this.blockProcessor.nowPosition;
                        const waitPositionX = nowPosition + 10;
                        newParticle.currentX = waitPositionX;
                        newParticle.currentY = particle.target.yPosition + blockHeight / 2;
                        this.batcherParticles.push(newParticle);
                    }
                }
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
        this.scheduledEvents.actions.forEach(action => {
            const actionResult = action.update(currentEngineTime);
            if (actionResult) {
                if (typeof actionResult === 'object' && actionResult.readyToTravel) {
                    action.x = this.blockProcessor.nowPosition;
                    // Action finished waiting at NOW, start travel to appropriate table
                    const targetTable = this.selectAppropriateTable(action);
                    action.targetTable = targetTable;

                    const paimaChain = this.blockchains.find(bc => bc.name === 'Paima Engine');
                    if (paimaChain && paimaChain.blocks.length > 0) {
                        action.targetPaimaBlock = paimaChain.blocks[paimaChain.blocks.length - 1];
                    }

                    action.startFadingOut();
                    setTimeout(() => {
                        const eventToBlockProcessor = new ProcessedEvent(action, this.blockProcessor, this);
                        this.processedEvents.push(eventToBlockProcessor);
                    }, action.fadeDuration);

                    this.eventParticles.forEach(p => {
                        if (p.targetBlock === action) {
                            p.startFadingOut();
                        }
                    });
                }
            }
        });
        
        // Remove actions that have completed their journey and clean up related particles
        const removedActions = this.scheduledEvents.actions.filter(action => !action.isActive);
        this.scheduledEvents.actions = this.scheduledEvents.actions.filter(action => action.isActive);
        
        // Clean up event particles that were targeting removed actions
        if (removedActions.length > 0) {
            this.eventParticles = this.eventParticles.filter(particle => {
                return !removedActions.some(action => particle.targetBlock === action);
            });
        }
        
        // Convert time to pixels (1 second = 90 pixels - 10% slower)
        const pixelsPerSecond = 80;
        
        // Handle different blockchain timings - each operates independently
        this.chainManager.update(currentTime, currentEngineTime);
        
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
                const rightEdge = this.blockProcessor.nowPosition - endOffset;
                const leftEdge = this.blockProcessor.nowPosition - startOffset;
                
                // Set block position and width based on actual time span
                block.x = leftEdge;
                block.width = rightEdge - leftEdge;
                
                // Update appearance animation only
                block.update(deltaTime);
            });
        });

        let shouldReaderBlink = false;
        for (const blockchain of this.blockchains) {
            for (const block of blockchain.blocks) {
                const hasEvents = block.events.length > 0 || block.accumulatedEvents.length > 0;
                if (hasEvents) {
                    const readerBounds = this.paimaEngineReader.getBounds();
                    const blockBounds = block.getBounds();
                    if (checkIntersection(blockBounds, readerBounds)) {
                        shouldReaderBlink = true;
                        break;
                    }
                }
            }
            if (shouldReaderBlink) {
                break;
            }
        }

        if (shouldReaderBlink) {
            this.paimaEngineReader.startBlinking();
        } else {
            this.paimaEngineReader.stopBlinking();
        }
        
        // Position actions based on their scheduled time (only if not traveling or waiting)
        this.scheduledEvents.actions.forEach(action => {
            if (!action.isTravelingToTable && !action.isWaitingAtNow) {
                const timeUntilExecution = action.scheduledTime - currentEngineTime;
                const timeOffset = timeUntilExecution * pixelsPerSecond / 1000;
                
                // Position action based on when it should execute
                action.x = this.blockProcessor.nowPosition + timeOffset;
            } else if (action.isWaitingAtNow) {
                // Keep action at NOW line while waiting
                action.x = this.blockProcessor.nowPosition;
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
                const timingLabel = blockchain.getTimingLabel();
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
        
        const scheduledActions = this.scheduledEvents.actions.filter(a => !a.isExecuted && !a.isTravelingToTable && !a.isWaitingAtNow).length;
        const waitingActions = this.scheduledEvents.actions.filter(a => a.isWaitingAtNow).length;
        const travelingActions = this.scheduledEvents.actions.filter(a => a.isTravelingToTable).length;
        const totalActions = this.scheduledEvents.actions.length;
        
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
