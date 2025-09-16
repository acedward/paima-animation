import { BlockchainEngine } from './BlockchainEngine.js';
import { tableConfig } from '../config.js';
import { Block } from './Block.js';
import { randomMultipliers } from '../random.js';
import { EventLegend } from './EventLegend.js';
import { Chain } from './Chain.js';
import { PaimaEngineChain } from './PaimaEngineChain.js';

/**
 * @class CanvasRenderer
 * @description The main controller for the blockchain animation.
 * 
 * This class orchestrates the entire visualization. It initializes the `BlockchainEngine`,
 * handles all user interface interactions (such as adding/removing chains, pausing, and configuring settings),
 * and manages the main rendering loop on the HTML5 canvas. It's also responsible for displaying tooltips
 * and dynamically adding new blockchains to the simulation over time.
 */
// Enhanced UI Controller with dynamic chain management and tooltips
export class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.isPaused = false;
        this.lastUpdateTime = 0;
        
        this.eventLegend = new EventLegend(this.canvas.width - 165, this.canvas.height - 120);
        
        // Initialize the blockchain engine with only Paima Engine
        this.engine = new BlockchainEngine(this.canvas.width);
        
        // Initialize UI handlers
        this.initializeUI();
        this.initializeTooltips();
        this.updateChainList();
        this.updatePresetButtons();
        this.initializeConfigModal();
        
        // Schedule automatic chain additions
        this.engine.scheduleChainAdditions();
    }
    
    addChainProgrammatically(name, blockTimeSeconds) {
        this.engine.addChainProgrammatically(name, blockTimeSeconds);
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
                if (block.isInside(x, y)) {
                    return block.getTooltipData(this.engine.engineStartTime);
                }
            }
        }
        
        // Check actions
        for (let action of this.engine.scheduledEvents.actions) {
            if (action.isInside(x, y)) {
                return action.getTooltipData(this.engine.engineStartTime);
            }
        }
        
        // Check tables
        for (let table of Object.values(this.engine.tables)) {
            if (table.isInside(x, y)) {
                return table.getTooltipData();
            }
        }
        
        // Check Block Processor
        const bp = this.engine.blockProcessor;
        if (bp && bp.isInside(x, y)) {
            return bp.getTooltipData();
        }

        const se = this.engine.scheduledEvents;
        if (se && se.isInside(x, y)) {
            return se.getTooltipData();
        }

        // Check Batcher
        const batcher = this.engine.batcher;
        if (batcher && batcher.isInside(x, y)) {
            return batcher.getTooltipData();
        }

        // Check User Devices
        for (let device of this.engine.userDevices.devices) {
            if (device.isInside(x, y)) {
                return device.getTooltipData();
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
                this.engine.scheduledEvents.actions.forEach(action => {
                    if (action.travelStartTime) action.travelStartTime += pauseDuration;
                    if (action.waitStartTime) action.waitStartTime += pauseDuration;
                    if (action.fadeStartTime) action.fadeStartTime += pauseDuration;
                });
            }
        }
    }
    
    clearAllChains() {
        this.engine.clearAllChains();
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
        this.engine.addChain(name, blockTimeSeconds);
        this.updateChainList();
        this.updatePresetButtons();
    }
    
    addXAIChain() {
        this.engine.addXAIChain();
        this.updateChainList();
        this.updatePresetButtons();
    }
    
    removeChain(chainId) {
        this.engine.removeChain(chainId);
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
            this.ctx.fillText('⏸️ PAUSED', 80, 20);
        }
        
        // Draw SQL tables
        Object.values(this.engine.tables).forEach(table => {
            table.draw(this.ctx);
        });
        
        // Draw Block Processor
        this.engine.blockProcessor.draw(this.ctx);

        if (this.engine.scheduledEvents) {
            this.engine.scheduledEvents.draw(this.ctx);
        }

        // Draw Batcher and User Devices
        if (this.engine.batcher) {
            this.engine.batcher.draw(this.ctx);
        }
        
        this.engine.userDevices.drawContainer(this.ctx);

        this.engine.userDevices.devices.forEach(device => {
            device.draw(this.ctx);
        });

        // Draw event legend
        this.eventLegend.draw(this.ctx, this.engine.eventParticles);
        
        // Draw NOW line
        this.drawNowLine();

        
        // Draw all actions
        this.engine.scheduledEvents.actions.forEach(action => {
            action.draw(this.ctx);
        });
        
        // Draw all blockchains
        this.engine.blockchains.forEach((blockchain, index) => {
            // Always show blockchain labels
            blockchain.drawLabel(this.ctx);
            
            // Draw all blocks if they exist
            blockchain.blocks.forEach(block => {
                block.draw(this.ctx);
            });
        });
        
        // Draw processed events so they appear on top of blocks
        this.engine.processedEvents.forEach(pe => {
            pe.draw(this.ctx);
        });

        // Draw event particles
        this.engine.eventParticles.forEach(particle => {
            particle.render(this.ctx);
        });
        
        this.engine.userRequestParticles.forEach(particle => {
            particle.draw(this.ctx);
        });

        this.engine.blockProcessorParticles.forEach(particle => {
            particle.draw(this.ctx);
        });

        // Draw batcher particles
        this.engine.batcherParticles.forEach(particle => {
            particle.draw(this.ctx);
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
    
    start() {
        this.render();
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

}
