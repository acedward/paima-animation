import { BlockchainEngine } from './BlockchainEngine.js';
import { tableConfig } from '../config.js';
import { Block } from './Block.js';
import { randomMultipliers } from '../random.js';
// Enhanced UI Controller with dynamic chain management and tooltips
export class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.isPaused = false;
        this.lastUpdateTime = 0;
        
        // Initialize the blockchain engine with only Paima Engine
        this.engine = new BlockchainEngine(this.canvas.width);
        
        // Start with only Paima Engine
        this.engine.blockchains = [
            {
                name: 'Paima Engine',
                color: () => '#19b17b',
                yPosition: this.chainStartY,
                timing: { type: 'fixed', interval: 1000 },
                counter: 0,
                blocks: [],
                lastBlockTime: 0,
                lastBlockEndTime: 0,
                id: 'paima-engine' // Add ID for management
            }
        ];
        
        // Initialize UI handlers
        this.initializeUI();
        this.initializeTooltips();
        this.updateChainList();
        this.updatePresetButtons();
        this.initializeConfigModal();
        
        // Schedule automatic chain additions
        this.scheduleChainAdditions();
    }
    
    scheduleChainAdditions() {
        // After 4 seconds, add Arbitrum
        setTimeout(() => {
            this.addChainProgrammatically('Arbitrum', 0.25);
            console.log('Added Arbitrum blockchain');
        }, 3500);
        
        // After 8 seconds, add Ethereum
        setTimeout(() => {
            this.addChainProgrammatically('Ethereum', 12);
            console.log('Added Ethereum blockchain');
        }, 7600);
        
        // After 12 seconds, add Cardano, Midnight
        setTimeout(() => {  
            this.addChainProgrammatically('Cardano', 20);
            this.addChainProgrammatically('Midnight', 6);
            console.log('Added Cardano, Midnight blockchains');
        }, 11400);

        setTimeout(() => {
            this.addChainProgrammatically('Avail', 20);
            console.log('Added Avail blockchain');
        }, 11500);
    }
    
    chainSpacing = 80;
    chainStartY = 400;
    addChainProgrammatically(name, blockTimeSeconds) {
        // Don't add if chain already exists
        const existingChain = this.engine.blockchains.find(chain => 
            chain.name.toLowerCase() === name.toLowerCase()
        );
        if (existingChain) {
            return;
        }
        
        // const chainSpacing = this.chainSpacing;
        // const chainStartY = this.chainStartY;
        const newYPosition = this.chainStartY + (this.engine.blockchains.length * this.chainSpacing);
        
        const newChain = {
            name: name,
            color: () => '#7f8c8d',
            yPosition: newYPosition,
            timing: { type: 'fixed', interval: blockTimeSeconds * 1000 }, // Convert to milliseconds
            counter: 0,
            blocks: [],
            lastBlockTime: 0,
            lastBlockEndTime: this.engine.getCurrentTime(), // Start at current engine time to avoid huge first block
            id: `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Unique ID
        };
        
        this.engine.blockchains.push(newChain);
        this.updateChainList();
        this.updatePresetButtons();
    }
    
    initializeUI() {
        const toggleConfigBtn = document.getElementById('toggleConfigBtn');
        const controls = document.querySelector('.controls');

        toggleConfigBtn.addEventListener('click', () => {
            controls.classList.toggle('hidden');
        });

        const addChainBtn = document.getElementById('addChainBtn');
        const chainNameInput = document.getElementById('chainName');
        const blockTimeInput = document.getElementById('blockTime');
        const customChainToggle = document.getElementById('customChainToggle');
        const addChainForm = document.getElementById('addChainForm');
        const pauseBtn = document.getElementById('pauseBtn');
        const clearBtn = document.getElementById('clearBtn');
        
        // Custom chain toggle
        customChainToggle.addEventListener('click', () => {
            addChainForm.classList.toggle('visible');
            customChainToggle.textContent = addChainForm.classList.contains('visible') 
                ? '- Hide Custom Chain' 
                : '+ Add Custom Chain';
        });
        
        // Pause/Resume button
        pauseBtn.addEventListener('click', () => {
            this.togglePause();
        });
        
        // Clear all button
        clearBtn.addEventListener('click', () => {
            this.clearAllChains();
        });
        
        // Add chain button handler
        addChainBtn.addEventListener('click', () => {
            const name = chainNameInput.value.trim();
            const blockTime = parseFloat(blockTimeInput.value);
            
            if (this.validateChainInput(name, blockTime)) {
                this.addChain(name, blockTime);
                chainNameInput.value = '';
                blockTimeInput.value = '';
                this.hideError();
                addChainForm.classList.remove('visible');
                customChainToggle.textContent = '+ Add Custom Chain';
            }
        });
        
        // Enter key handler for inputs
        [chainNameInput, blockTimeInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addChainBtn.click();
                }
            });
        });
        
        // Preset buttons handler
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.disabled) return;
                
                const name = e.target.getAttribute('data-name');
                const time = parseFloat(e.target.getAttribute('data-time'));
                const type = e.target.getAttribute('data-type');
                
                if (this.validateChainInput(name, time)) {
                    if (type === 'probability' && name === 'XAI') {
                        this.addXAIChain();
                    } else {
                        this.addChain(name, time);
                    }
                    this.hideError();
                }
            });
        });
    }

    initializeConfigModal() {
        const modal = document.getElementById('configModal');
        const configBtn = document.getElementById('configBtn');
        const closeBtn = document.getElementById('closeConfigModal');
        const saveBtn = document.getElementById('saveConfigBtn');
        const form = document.getElementById('configForm');

        configBtn.addEventListener('click', () => {
            this.populateConfigForm();
            modal.style.display = 'block';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });

        saveBtn.addEventListener('click', () => {
            this.saveConfigForm();
            modal.style.display = 'none';
        });
    }

    populateConfigForm() {
        const form = document.getElementById('configForm');
        form.innerHTML = '';
        for (const key in randomMultipliers) {
            const value = randomMultipliers[key];
            if (typeof value === 'object') {
                for (const subKey in value) {
                    const id = `${key}.${subKey}`;
                    const labelText = `${key} (${subKey})`;
                    this.createFormElement(form, id, labelText, value[subKey]);
                }
            } else {
                this.createFormElement(form, key, key, value);
            }
        }
    }

    createFormElement(form, id, labelText, value) {
        const label = document.createElement('label');
        label.setAttribute('for', id);
        label.textContent = labelText.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        const input = document.createElement('input');
        input.setAttribute('type', 'number');
        input.setAttribute('id', id);
        input.setAttribute('name', id);
        input.setAttribute('value', value);
        input.setAttribute('step', 'any');

        form.appendChild(label);
        form.appendChild(input);
    }

    saveConfigForm() {
        const form = document.getElementById('configForm');
        const inputs = form.elements;
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            if (input.name) {
                const keys = input.name.split('.');
                if (keys.length === 2) {
                    randomMultipliers[keys[0]][keys[1]] = parseFloat(input.value);
                } else {
                    randomMultipliers[keys[0]] = parseFloat(input.value);
                }
            }
        }
    }
    
    initializeTooltips() {
        const tooltip = document.getElementById('tooltip');
        let currentTooltipTarget = null;
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const tooltipData = this.getTooltipData(x, y);
            
            if (tooltipData) {
                tooltip.style.display = 'block';
                tooltip.innerHTML = `
                    <div class="tooltip-title">${tooltipData.title}</div>
                    <div class="tooltip-content">${tooltipData.content}</div>
                    ${tooltipData.data ? `<div class="tooltip-data">${tooltipData.data}</div>` : ''}
                `;
                
                // Position tooltip
                tooltip.style.left = (e.clientX + 10) + 'px';
                tooltip.style.top = (e.clientY - 10) + 'px';
                
                // Adjust position if tooltip goes off screen
                const tooltipRect = tooltip.getBoundingClientRect();
                if (tooltipRect.right > window.innerWidth) {
                    tooltip.style.left = (e.clientX - tooltipRect.width - 10) + 'px';
                }
                if (tooltipRect.bottom > window.innerHeight) {
                    tooltip.style.top = (e.clientY - tooltipRect.height - 10) + 'px';
                }
            } else {
                tooltip.style.display = 'none';
            }
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    }
    
    getTooltipData(x, y) {
        // Check blocks
        for (let blockchain of this.engine.blockchains) {
            for (let block of blockchain.blocks) {
                if (x >= block.x && x <= block.x + block.width && 
                    y >= block.y && y <= block.y + block.height) {
                    
                    const startTime = new Date(this.engine.engineStartTime + block.startTime);
                    const endTime = new Date(this.engine.engineStartTime + block.endTime);
                    const allEvents = [...block.events, ...(block.accumulatedEvents || []).flatMap(pe => pe.events || [])];
                    
                    return {
                        title: `${blockchain.name} Block #${block.index}`,
                        content: `Duration: ${(block.duration / 1000).toFixed(1)}s<br>
                                 Events: ${allEvents.length}`,
                        data: `Start: ${startTime.toLocaleTimeString()}<br>
                               End: ${endTime.toLocaleTimeString()}<br>
                               ${allEvents.length > 0 ? `Events: ${allEvents.map(e => e.type).join(', ')}` : ''}`
                    };
                }
            }
        }
        
        // Check actions
        for (let action of this.engine.actions) {
            if (x >= action.x && x <= action.x + action.width && 
                y >= action.y && y <= action.y + action.height) {
                
                const scheduledTime = new Date(this.engine.engineStartTime + action.scheduledTime);
                let status = 'Scheduled';
                if (action.isExecuted) status = 'Executed';
                if (action.isWaitingAtNow) status = 'Waiting at NOW';
                if (action.isTravelingToTable) status = 'Traveling to table';
                
                return {
                    title: `Action #${action.index}`,
                    content: `Status: ${status}<br>
                             Events: ${action.events.length}<br>
                             ${action.targetTable ? `Target: ${action.targetTable.name}` : ''}`,
                    data: `Scheduled: ${scheduledTime.toLocaleTimeString()}<br>
                           Shape: ${action.currentShape} → ${action.targetShape}<br>
                           ${action.events.length > 0 ? `Event types: ${action.events.map(e => e.type).join(', ')}` : ''}`
                };
            }
        }
        
        // Check tables
        for (let table of Object.values(this.engine.tables)) {
            if (x >= table.x && x <= table.x + table.width && 
                y >= table.y && y <= table.y + table.height) {
                
                const lastUpdate = table.lastModified ? new Date(table.lastModified) : null;
                
                return {
                    title: `SQL Table: ${table.name}`,
                    content: `Rows: ${table.data.length}<br>
                             Columns: ${table.columns.join(', ')}<br>
                             ${table.isBlinking ? '<span style="color: #19b17b;">UPDATING</span>' : 'Idle'}`,
                    data: `Last update: ${lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}<br>
                           Latest data: ${table.data.length > 0 ? table.data[0].row.join(' | ') : 'None'}`
                };
            }
        }
        
        // Check Block Processor
        const bp = this.engine.blockProcessor;
        if (bp && x >= bp.x && x <= bp.x + bp.width && y >= bp.y && y <= bp.y + bp.height) {
            return {
                title: 'Block Processor',
                content: 'Processes events from merged blocks, validates and transforms contents into SQL data and generates Paima L2 Blocks.',
                data: `Status: ${bp.isAnimating ? 'Animating' : 'Idle'}`
            };
        }

        // Check Batcher
        const batcher = this.engine.batcher;
        if (batcher && x >= batcher.x && x <= batcher.x + batcher.width && y >= batcher.y && y <= batcher.y + batcher.height) {
            return {
                title: 'Batcher',
                content: 'Receives user requests and batches them into events for the blockchains.',
                data: `Requests Received: ${batcher.requestsReceived}`
            };
        }

        // Check User Devices
        for (let device of this.engine.userDevices) {
            const distance = Math.sqrt(Math.pow(x - device.x, 2) + Math.pow(y - device.y, 2));
            if (distance <= device.radius) {
                return {
                    title: `User Device: ${device.name}`,
                    content: 'Simulates a user sending requests to the batcher.',
                    data: `Status: ${device.state}`
                };
            }
        }

        return null;
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isPaused) {
            pauseBtn.textContent = '▶️ RESUME';
            pauseBtn.classList.add('paused');
            this.engine.pauseTime = Date.now();
        } else {
            pauseBtn.textContent = '⏸️ PAUSE';
            pauseBtn.classList.remove('paused');
            // Adjust engine start time to account for pause duration
            if (this.engine.pauseTime) {
                const pauseDuration = Date.now() - this.engine.pauseTime;
                this.engine.engineStartTime += pauseDuration;
                
                // Adjust all blockchain timings
                this.engine.blockchains.forEach(blockchain => {
                    blockchain.lastBlockTime += pauseDuration;
                });
                
                // Adjust all action timings
                this.engine.actions.forEach(action => {
                    if (action.travelStartTime) action.travelStartTime += pauseDuration;
                    if (action.waitStartTime) action.waitStartTime += pauseDuration;
                    if (action.fadeStartTime) action.fadeStartTime += pauseDuration;
                });
            }
        }
    }
    
    clearAllChains() {
        // Keep only Paima Engine
        this.engine.blockchains = this.engine.blockchains.filter(chain => 
            chain.id === 'paima-engine'
        );
        
        // Reset position
        this.engine.blockchains[0].yPosition = this.chainStartY;
        
        this.updateChainList();
        this.updatePresetButtons();
    }
    
    validateChainInput(name, blockTime) {
        const errorMessage = document.getElementById('errorMessage');
        
        if (!name) {
            this.showError('Chain name is required');
            return false;
        }
        
        if (isNaN(blockTime) || blockTime <= 0) {
            this.showError('Block time must be a positive number');
            return false;
        }
        
        if (blockTime > 600) {
            this.showError('Block time cannot exceed 600 seconds (10 minutes)');
            return false;
        }
        
        // Check if chain already exists
        const existingChain = this.engine.blockchains.find(chain => 
            chain.name.toLowerCase() === name.toLowerCase()
        );
        
        if (existingChain) {
            this.showError('A chain with this name already exists');
            return false;
        }
        
        return true;
    }
    
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.style.display = 'none';
    }
    
    addChain(name, blockTimeSeconds) {
        // const chainSpacing = 120;
        // const chainStartY = 310;
        const newYPosition = this.chainStartY + (this.engine.blockchains.length * this.chainSpacing);
        
        const newChain = {
            name: name,
            color: () => '#7f8c8d',
            yPosition: newYPosition,
            timing: { type: 'fixed', interval: blockTimeSeconds * 1000 }, // Convert to milliseconds
            counter: 0,
            blocks: [],
            lastBlockTime: 0,
            lastBlockEndTime: this.engine.getCurrentTime(), // Start at current engine time to avoid huge first block
            id: `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Unique ID
        };
        
        this.engine.blockchains.push(newChain);
        this.updateChainList();
        this.updatePresetButtons();
    }
    
    addXAIChain() {
        // const chainSpacing = 120;
        // const chainStartY = 310;
        const newYPosition = this.chainStartY + (this.engine.blockchains.length * this.chainSpacing);
        
        const newChain = {
            name: 'XAI',
            color: () => '#7f8c8d',
            yPosition: newYPosition,
            timing: { 
                type: 'probability', 
                possibleIntervals: [100, 150, 200, 250, 300], // milliseconds
                currentCheckIndex: 0
            },
            counter: 0,
            blocks: [],
            lastBlockTime: 0,
            lastBlockEndTime: this.engine.getCurrentTime(), // Start at current engine time to avoid huge first block
            id: `xai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Unique ID
        };
        
        this.engine.blockchains.push(newChain);
        this.updateChainList();
        this.updatePresetButtons();
    }
    
    removeChain(chainId) {
        if (chainId === 'paima-engine') {
            return; // Can't remove Paima Engine
        }
        
        // Remove from engine
        this.engine.blockchains = this.engine.blockchains.filter(chain => chain.id !== chainId);
        
        // Recalculate Y positions for remaining chains
        // const chainSpacing = 120;
        // const chainStartY = 310;
        
        this.engine.blockchains.forEach((chain, index) => {
            chain.yPosition = this.chainStartY + (index * this.chainSpacing);
        });
        
        this.updateChainList();
        this.updatePresetButtons();
    }
    
    updatePresetButtons() {
        const activeChainNames = this.engine.blockchains.map(chain => chain.name.toLowerCase());
        
        document.querySelectorAll('.preset-btn').forEach(btn => {
            const chainName = btn.getAttribute('data-name').toLowerCase();
            const isActive = activeChainNames.includes(chainName);
            
            btn.disabled = isActive;
            btn.textContent = isActive ? 
                btn.getAttribute('data-name') + ' (Active)' : 
                btn.getAttribute('data-name') + ' (' + btn.getAttribute('data-time') + 's)';
        });
    }
    
    updateChainList() {
        const chainList = document.getElementById('chainList');
        chainList.innerHTML = '';
        
        this.engine.blockchains.forEach(chain => {
            const chainItem = document.createElement('div');
            chainItem.className = `chain-item ${chain.id === 'paima-engine' ? 'paima' : ''}`;
            
            let timeDisplay;
            if (chain.timing.type === 'probability') {
                // For probabilistic chains, show range
                const minTime = Math.min(...chain.timing.possibleIntervals) / 1000;
                const maxTime = Math.max(...chain.timing.possibleIntervals) / 1000;
                timeDisplay = `${minTime.toFixed(1)}s-${maxTime.toFixed(1)}s`;
            } else {
                // For fixed timing chains
                const blockTimeSeconds = chain.timing.interval / 1000;
                timeDisplay = blockTimeSeconds >= 60 ? 
                    `${(blockTimeSeconds / 60).toFixed(1)}m` : 
                    `${blockTimeSeconds}s`;
            }
            
            chainItem.innerHTML = `
                <div class="chain-info">
                    <div class="chain-name">${chain.name}</div>
                    <div class="chain-timing">Block time: ${timeDisplay} | Blocks: ${chain.blocks.length}</div>
                </div>
                ${chain.id !== 'paima-engine' ? 
                    `<button class="remove-btn" data-chain-id="${chain.id}">Remove</button>` : 
                    '<div style="color: #19b17b; font-size: 12px; font-weight: bold;">ALWAYS ON</div>'
                }
            `;
            
            chainList.appendChild(chainItem);

            const removeBtn = chainItem.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (event) => {
                    const chainId = event.target.getAttribute('data-chain-id');
                    this.removeChain(chainId);
                });
            }
        });
    }
    
    // All the existing drawing methods remain the same...
    drawTable(table) {
        const config = tableConfig;
        
        // Draw table background with subtle blinking effect
        if (table.isBlinking) {
            // Subtle oscillating opacity for blink effect
            const blinkProgress = (Date.now() - table.blinkStartTime) / config.blinkDuration;
            const blinkOpacity = 0.15 + 0.1 * Math.abs(Math.sin(blinkProgress * Math.PI * 3)); // Reduced intensity and frequency
            this.ctx.fillStyle = `rgba(25, 177, 123, ${blinkOpacity})`;
        } else {
            this.ctx.fillStyle = '#1a1a1a';
        }
        this.ctx.fillRect(table.x, table.y, config.width, config.height);
        
        // Draw table border (slightly brighter when blinking)
        if (table.isBlinking) {
            this.ctx.strokeStyle = '#1fb57d'; // Subtle green instead of bright
            this.ctx.lineWidth = 2.5;
        } else {
            this.ctx.strokeStyle = '#19b17b';
            this.ctx.lineWidth = 2;
        }
        this.ctx.strokeRect(table.x, table.y, config.width, config.height);
        
        // Draw table header
        this.ctx.fillStyle = '#19b17b';
        this.ctx.fillRect(table.x, table.y, config.width, config.headerHeight);
        
        // Draw table title
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(table.name, table.x + config.width / 2, table.y + config.headerHeight / 2 + 4);
        
        // Draw column headers
        const columnWidth = config.width / table.columns.length;
        this.ctx.fillStyle = '#ccc';
        this.ctx.font = '10px Arial';
        
        table.columns.forEach((column, index) => {
            const columnX = table.x + index * columnWidth;
            const columnCenterX = columnX + columnWidth / 2;
            this.ctx.fillText(column, columnCenterX, table.y + config.headerHeight + 15);
        });
        
        // Draw separator line after headers
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(table.x, table.y + config.headerHeight + 20);
        this.ctx.lineTo(table.x + config.width, table.y + config.headerHeight + 20);
        this.ctx.stroke();
        
        // Draw table data (already sorted by timestamp in engine)
        table.data.forEach((rowData, rowIndex) => {
            const row = rowData.row;
            const rowY = table.y + config.headerHeight + 35 + (rowIndex * config.rowHeight);
            
            // Alternate row background - inset by 1px to stay inside border
            if (rowIndex % 2 === 1) {
                this.ctx.fillStyle = '#2a2a2a';
                this.ctx.fillRect(table.x + 1, rowY - 10, config.width - 2, config.rowHeight);
            }
            
            // Highlight newest row (index 0) with subtle glow - inset by 1px to stay inside border
            if (rowIndex === 0) {
                this.ctx.fillStyle = 'rgba(25, 177, 123, 0.08)'; // More subtle
                this.ctx.fillRect(table.x + 1, rowY - 10, config.width - 2, config.rowHeight);
            }
            
            // Draw row data
            this.ctx.fillStyle = rowIndex === 0 ? '#1fb57d' : '#fff'; // Subtle green for newest
            this.ctx.font = '9px Arial';
            row.forEach((cell, cellIndex) => {
                const cellX = table.x + cellIndex * columnWidth;
                const cellCenterX = cellX + columnWidth / 2;
                this.ctx.fillText(cell, cellCenterX, rowY);
            });
        });
        
        // Draw column separator lines
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let i = 1; i < table.columns.length; i++) {
            const lineX = table.x + i * columnWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(lineX, table.y + config.headerHeight);
            this.ctx.lineTo(lineX, table.y + config.height);
            this.ctx.stroke();
        }
    }
    
    drawEventIndicators(block) {
        const allEvents = [...block.events, ...(block.accumulatedEvents || []).flatMap(pe => pe.events || [])];
        if (allEvents.length === 0) return;
        
        // Only draw if block is wide enough
        if (block.width < 30) return;
        
        // Draw event indicators at the same positions where particles will land
        const dotSize = 3;
        
        // Event type colors
        const eventColors = {
            'erc20_transfer': '#f39c12',
            'erc721_transfer': '#9b59b6',
            'game_move': '#3498db',
            'account_created': '#2ecc71'
        };
        
        if (block.blockchain.name === 'Paima Engine') return;
        allEvents.forEach((event, index) => {
            // Same positioning as particles: x=10, x=20, x=30, etc.
            const eventX = 10 + (index * 10);
            const eventY = 15; // 15px from top of block
            
            // Don't draw if it would go outside the block
            if (eventX + 5 > block.width) return; // Leave margin at right edge
            
            // Draw event indicator dot
            this.ctx.fillStyle = eventColors[event.type] || '#fff';
            this.ctx.beginPath();
            this.ctx.arc(eventX, eventY, dotSize / 2, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw small border around dot
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
        });
    }
    
    drawChainLabel(y, label, height, color = '#fff', x = 20) {
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        // Position label above the blocks
        this.ctx.fillText(label, x, y - 10);
    }
    
    drawAction(action) {
        this.ctx.save();
        this.ctx.globalAlpha = action.opacity;
        
        if (action.isTravelingToTable || action.isFadingOut) {
            // Draw clean traveling/fading action - slightly bigger than normal
            const size = 12; // Slightly bigger than normal (20px width -> 12px radius)
            const centerX = action.x + action.width / 2;
            const centerY = action.y + action.height / 2;
            
            this.ctx.fillStyle = action.color;
            this.ctx.strokeStyle = '#ccc';
            this.ctx.lineWidth = 1;
            
            // Smooth shape transition based on progress
            if (action.shapeTransitionProgress < 0.3) {
                // Early travel: show current shape only
                this.renderActionShape(action.currentShape, centerX, centerY, size);
            } else if (action.shapeTransitionProgress > 0.7) {
                // Late travel: show target shape only
                this.renderActionShape(action.targetShape, centerX, centerY, size);
            } else {
                // Middle travel: blend both shapes
                const blendProgress = (action.shapeTransitionProgress - 0.3) / 0.4; // 0 to 1 over the 0.3-0.7 range
                
                // Draw current shape with decreasing opacity
                this.ctx.globalAlpha = action.opacity * (1 - blendProgress);
                this.renderActionShape(action.currentShape, centerX, centerY, size);
                
                // Draw target shape with increasing opacity
                this.ctx.globalAlpha = action.opacity * blendProgress;
                this.renderActionShape(action.targetShape, centerX, centerY, size);
                
                // Reset alpha
                this.ctx.globalAlpha = action.opacity;
            }
        } else if (action.isWaitingAtNow) {
            // Draw action waiting at NOW line - same as normal but at NOW position
            // Draw action shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(action.x + 1, action.y + 1, action.width, action.height);
            
            // Draw main action square
            this.ctx.fillStyle = action.color;
            this.ctx.fillRect(action.x, action.y, action.width, action.height);
            
            // Draw action border
            this.ctx.strokeStyle = '#ccc';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(action.x, action.y, action.width, action.height);
            
            // Draw action number
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(action.index.toString(), action.x + action.width/2, action.y + action.height/2 + 3);
        } else {
            // Draw normal scheduled action
            // Draw action shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(action.x + 1, action.y + 1, action.width, action.height);
            
            // Draw main action square
            this.ctx.fillStyle = action.color;
            this.ctx.fillRect(action.x, action.y, action.width, action.height);
            
            // Draw action border
            this.ctx.strokeStyle = '#ccc';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(action.x, action.y, action.width, action.height);
            
            // Draw action number
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(action.index.toString(), action.x + action.width/2, action.y + action.height/2 + 3);
        }
        
        this.ctx.restore();
    }
    
    renderActionShape(shape, x, y, size) {
        this.ctx.beginPath();
        
        switch (shape) {
            case 'triangle':
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x - size, y + size);
                this.ctx.lineTo(x + size, y + size);
                this.ctx.closePath();
                break;
            case 'square':
                this.ctx.rect(x - size, y - size, size * 2, size * 2);
                break;
            case 'diamond':
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y);
                this.ctx.lineTo(x, y + size);
                this.ctx.lineTo(x - size, y);
                this.ctx.closePath();
                break;
            case 'circle':
                this.ctx.arc(x, y, size, 0, 2 * Math.PI);
                break;
            default:
                this.ctx.rect(x - size, y - size, size * 2, size * 2);
                break;
        }
        
        this.ctx.fill();
    }
    
    drawBlock(block) {
        this.ctx.save();
        
        this.ctx.globalAlpha = block.opacity;
        
        this.ctx.translate(block.x + block.width/2, block.y + block.height/2);
        this.ctx.scale(block.scale, block.scale);
        this.ctx.translate(-block.width/2, -block.height/2);
        
        // Draw block shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(2, 2, block.width, block.height);
        
        // Draw main block - use interpolated color during merge animation
        let currentColor = block.color;
        if (block.colorAnimation && block.colorAnimation.isAnimating) {
            currentColor = block.colorAnimation.currentColor;
            block.color = currentColor;
        }
        this.ctx.fillStyle = currentColor;
        this.ctx.fillRect(0, 0, block.width, block.height);
        
        // Draw block border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, block.width, block.height);
        
        // Always draw block number and timing info
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        
        if (block.width >= 60) {
            // Full info for wider blocks
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText("#" + block.index, block.width/2, block.height/2 - 8);
            
            // Show duration below block number
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`${(block.duration / 1000).toFixed(1)}s`, block.width/2, block.height/2 + 2);
            
            const eventCount = block.events.length + (block.accumulatedEvents || []).reduce((sum, pe) => sum + (pe.events ? pe.events.length : 0), 0);
            // Show event data info if block has events
            if (eventCount > 0) {
                this.ctx.font = 'bold 8px Arial';
                this.ctx.fillStyle = '#ffeb3b'; // Yellow for visibility
                this.ctx.fillText(`${eventCount} event${eventCount !== 1 ? 's' : ''}`, block.width/2, block.height/2 + 12);
            }
        } else if (block.width >= 30) {
            // Medium blocks - show number and duration
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText("#" + block.index, block.width/2, block.height/2 - 8);
            this.ctx.font = '8px Arial';
            this.ctx.fillText(`${(block.duration / 1000).toFixed(1)}s`, block.width/2, block.height/2 + 8);
        } else {
            // Narrow blocks - just show block number
            this.ctx.font = 'bold 9px Arial';
            this.ctx.fillText("#" + block.index, block.width/2, block.height/2);
        }
        
        
        // Draw event indicators (within transformation context)
        this.drawEventIndicators(block);
        
        this.ctx.restore();
    }
    
    drawBlockProcessor() {
        const nowPosition = this.canvas.width * 0.725;
        const boxWidth = 180;
        const boxHeight = 120;
        const boxX = nowPosition - boxWidth / 2;
        const boxY = 230;

        this.ctx.save();

        // Draw the main box
        this.ctx.fillStyle = 'rgba(25, 177, 123, 0.1)';
        this.ctx.strokeStyle = '#19b17b';
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw title
        this.ctx.fillStyle = '#19b17b';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Block Processor', nowPosition, boxY + 20);

        // State machine diagram elements
        const states = {
            pending: { x: boxX + 40, y: boxY + 50, label: 'A\'' },
            processing: { x: boxX + 140, y: boxY + 50, label: 'B' },
            toSql: { x: boxX + 40, y: boxY + 100, label: 'C' },
            toPaima: { x: boxX + 140, y: boxY + 100, label: 'D' }
        };

        const { isAnimating, highlightedStateKey, highlightedArrowKey } = this.engine.blockProcessor;

        // Draw states (circles)
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px Arial';
        Object.entries(states).forEach(([key, state]) => {
            this.ctx.beginPath();
            this.ctx.arc(state.x, state.y, 15, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#2a2a2a';
            this.ctx.fill();

            if (isAnimating && key === highlightedStateKey) {
                this.ctx.strokeStyle = '#3498db';
                this.ctx.lineWidth = 2;
            } else {
                this.ctx.strokeStyle = '#19b17b';
                this.ctx.lineWidth = 1;
            }
            this.ctx.stroke();

            if (isAnimating && key === highlightedStateKey) {
                this.ctx.fillStyle = '#3498db';
            } else {
                this.ctx.fillStyle = '#fff';
            }
            this.ctx.fillText(state.label, state.x, state.y + 5);
        });

        // Draw arrows
        this.drawArrow(states.pending, states.processing, isAnimating && highlightedArrowKey && highlightedArrowKey[0] === 'pending' && highlightedArrowKey[1] === 'processing');
        this.drawArrow(states.processing, states.toSql, isAnimating && highlightedArrowKey && highlightedArrowKey[0] === 'processing' && highlightedArrowKey[1] === 'toSql');
        this.drawArrow(states.processing, states.toPaima, isAnimating && highlightedArrowKey && highlightedArrowKey[0] === 'processing' && highlightedArrowKey[1] === 'toPaima');

        this.ctx.restore();
    }

    drawArrow(from, to, isHighlighted = false) {
        const headlen = 10; // length of head in pixels
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);

        // Adjust start and end points to be on the edge of the circles
        const startX = from.x + 15 * Math.cos(angle);
        const startY = from.y + 15 * Math.sin(angle);
        const endX = to.x - 15 * Math.cos(angle);
        const endY = to.y - 15 * Math.sin(angle);

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));

        if (isHighlighted) {
            this.ctx.strokeStyle = '#3498db';
            this.ctx.lineWidth = 2;
        } else {
            this.ctx.strokeStyle = '#19b17b';
            this.ctx.lineWidth = 1;
        }
        this.ctx.stroke();
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update engine logic only if not paused
        if (!this.isPaused) {
            this.engine.update();
        }
        
        // Draw title
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowBlur = 0; // Clear any shadow effects
        this.ctx.fillText('Cross-Blockchain Merging and Interoperability with Paima Engine', this.canvas.width/2, 40);
        
        // Draw pause indicator
        if (this.isPaused) {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.fillText('⏸️ PAUSED', this.canvas.width/2, 65);
        }
        
        // Draw SQL tables
        Object.values(this.engine.tables).forEach(table => {
            this.drawTable(table);
        });
        
        // Draw Block Processor
        this.drawBlockProcessor();

        // Draw Batcher and User Devices
        if (this.engine.batcher) {
            this.drawBatcher(this.engine.batcher);
        }
        
        // Define user device area and box
        const userDevicesArea = {
            x: this.canvas.width * 0.87,
            y: this.canvas.height * 0.7,
            width: 80,
            height: 80
        };
        const boxPadding = 15;
        const titleHeight = 30;

        const boxX = userDevicesArea.x - boxPadding;
        const boxWidth = userDevicesArea.width + (2 * boxPadding) + 20; // a bit wider
        const boxY = userDevicesArea.y - boxPadding - titleHeight;
        const boxHeight = userDevicesArea.height + (2 * boxPadding) + titleHeight;

        this.ctx.save();

        // Draw the semi-transparent box
        this.ctx.fillStyle = 'rgba(25, 177, 123, 0.1)';
        this.ctx.strokeStyle = '#19b17b';
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw title for User Devices
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('User Devices', boxX + boxWidth / 2, boxY + 20);

        this.ctx.restore();

        this.engine.userDevices.forEach(device => {
            this.drawUserDevice(device);
        });

        // Draw event legend
        this.drawEventLegend();
        
        // Draw NOW line
        this.drawNowLine();
        
        // Draw title for Scheduled Events
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Scheduled Events', this.canvas.width * 0.9, 255);
        
        // Draw all actions
        this.engine.actions.forEach(action => {
            this.drawAction(action);
        });
        
        // Draw all blockchains
        this.engine.blockchains.forEach((blockchain, index) => {
            // Always show blockchain labels
            const labelColor = blockchain.name === 'Paima Engine' ? '#19b17b' : '#fff';
            this.drawChainLabel(blockchain.yPosition, blockchain.name, 40, labelColor);
            
            // Draw all blocks if they exist
            blockchain.blocks.forEach(block => {
                this.drawBlock(block);
            });
        });
        
        // Draw processed events so they appear on top of blocks
        this.engine.processedEvents.forEach(pe => {
            this.drawProcessedEvent(pe);
        });

        // Draw event particles
        this.engine.eventParticles.forEach(particle => {
            particle.render(this.ctx);
        });
        
        this.engine.userRequestParticles.forEach(particle => {
            this.drawUserRequestParticle(particle);
        });

        this.engine.blockProcessorParticles.forEach(particle => {
            this.drawBlockProcessorParticle(particle);
        });

        // Draw batcher particles
        this.engine.batcherParticles.forEach(particle => {
            this.drawBatcherParticle(particle);
        });

        // Draw current status
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#aaa';
        this.ctx.textAlign = 'center';
        const status = this.engine.getStatus();
        this.ctx.fillText(status, this.canvas.width/2, this.canvas.height - 5);
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.render());
    }

    drawNowLine() {
        // Draw "now" indicator line - fixed at 80% of canvas width
        const nowPosition = this.canvas.width * 0.8;
        this.ctx.strokeStyle = '#19b17b';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(nowPosition, 360); // Start below the actions row
        this.ctx.lineTo(nowPosition, this.canvas.height - 40);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset dash pattern

        // Draw "NOW" label
        this.ctx.fillStyle = '#19b17b';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NOW', nowPosition, this.canvas.height - 20);
    }
    
    drawProcessedEvent(pe) {
        this.ctx.save();
        this.ctx.fillStyle = pe.color;
        this.ctx.beginPath();
        this.ctx.arc(pe.x, pe.y, pe.radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawEventLegend() {
        const legendX = this.canvas.width - 150; // Position near right edge
        const legendY = this.canvas.height - 120; // Position near bottom
        const dotSize = 4;
        const lineHeight = 16;
        
        // Event type colors and labels
        const eventTypes = [
            { type: 'erc20_transfer', color: '#f39c12', label: 'ERC20 Transfer' },
            { type: 'erc721_transfer', color: '#9b59b6', label: 'ERC721 Transfer' },
            { type: 'game_move', color: '#3498db', label: 'Game Move' },
            { type: 'account_created', color: '#2ecc71', label: 'Account Created' }
        ];
        
        // Draw legend background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(legendX - 10, legendY - 15, 140, 90);
        
        // Draw legend border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(legendX - 10, legendY - 15, 140, 90);
        
        // Draw legend title
        this.ctx.fillStyle = '#ccc';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Event Types:', legendX, legendY);
        
        // Draw legend items
        eventTypes.forEach((item, index) => {
            const itemY = legendY + 15 + (index * lineHeight);
            
            // Draw colored dot
            this.ctx.fillStyle = item.color;
            this.ctx.beginPath();
            this.ctx.arc(legendX + 5, itemY - 3, dotSize / 2, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw dot border
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // Draw label
            this.ctx.fillStyle = '#aaa';
            this.ctx.font = '9px Arial';
            this.ctx.fillText(item.label, legendX + 12, itemY);
        });
    }
    
    start() {
        this.render();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    drawBatcher(batcher) {
        this.ctx.save();
        this.ctx.fillStyle = batcher.color;
        this.ctx.fillRect(batcher.x, batcher.y, batcher.width, batcher.height);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(batcher.x, batcher.y, batcher.width, batcher.height);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Batcher', batcher.x + batcher.width / 2, batcher.y + 20);
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Processed: ${batcher.requestsReceived}`, batcher.x + batcher.width / 2, batcher.y + 40);
        this.ctx.restore();
    }

    drawUserDevice(device) {
        this.ctx.save();
        this.ctx.globalAlpha = device.opacity;
        this.ctx.fillStyle = device.color;
        this.ctx.beginPath();
        this.ctx.arc(device.x, device.y, device.radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawUserRequestParticle(particle) {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(particle.currentX, particle.currentY, 2, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawBlockProcessorParticle(particle) {
        this.ctx.save();
        this.ctx.fillStyle = '#f39c12'; // A different color to distinguish
        this.ctx.beginPath();
        this.ctx.arc(particle.currentX, particle.currentY, 3, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawBatcherParticle(particle) {
        if (!particle.isActive) return;
        this.ctx.save();
        this.ctx.globalAlpha = particle.opacity || 1.0;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.currentX, particle.currentY, 3, 0, 2 * Math.PI); // A bit larger
        
        // Add a glow
        this.ctx.shadowColor = particle.color;
        this.ctx.shadowBlur = 8;
        this.ctx.fill();

        this.ctx.restore();
    }
}
