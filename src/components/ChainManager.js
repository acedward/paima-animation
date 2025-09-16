import { Chain } from './Chain.js';
import { PaimaEngineChain } from './PaimaEngineChain.js';

/**
 * @class ChainManager
 * @description Manages the lifecycle of all blockchains in the simulation.
 * 
 * This class is responsible for creating, scheduling, adding, removing, and updating
 * all the blockchain chains. It handles both programmatic and user-initiated
 * changes to the set of active chains.
 */
export class ChainManager {
    constructor(engine) {
        this.engine = engine;
        this.blockchains = [];
        this.chainSpacing = 80;
        this.chainStartY = 400;

        // Start with only Paima Engine
        const paimaChain = new PaimaEngineChain(this.chainStartY, 0);
        this.blockchains = [paimaChain];
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
        }, 9400);

        setTimeout(() => {
            this.addChainProgrammatically('Avail', 20);
            console.log('Added Avail blockchain');
        }, 11500);
    }

    addChainProgrammatically(name, blockTimeSeconds) {
        const existingChain = this.blockchains.find(chain => 
            chain.name.toLowerCase() === name.toLowerCase()
        );
        if (existingChain) {
            return;
        }
        
        const newYPosition = this.chainStartY + (this.blockchains.length * this.chainSpacing);
        
        const timing = { type: 'fixed', interval: blockTimeSeconds * 1000 };
        const lastBlockEndTime = this.engine.getCurrentTime();
        const newChain = new Chain(name, newYPosition, timing, lastBlockEndTime);
        
        this.blockchains.push(newChain);
    }

    addChain(name, blockTimeSeconds) {
        const newYPosition = this.chainStartY + (this.blockchains.length * this.chainSpacing);
        
        const timing = { type: 'fixed', interval: blockTimeSeconds * 1000 };
        const lastBlockEndTime = this.engine.getCurrentTime();
        const newChain = new Chain(name, newYPosition, timing, lastBlockEndTime);
        
        this.blockchains.push(newChain);
    }
    
    addXAIChain() {
        const newYPosition = this.chainStartY + (this.blockchains.length * this.chainSpacing);
        
        const timing = { 
            type: 'probability', 
            possibleIntervals: [100, 150, 200, 250, 300],
            currentCheckIndex: 0
        };
        const lastBlockEndTime = this.engine.getCurrentTime();
        const newChain = new Chain('XAI', newYPosition, timing, lastBlockEndTime);
        
        this.blockchains.push(newChain);
    }
    
    removeChain(chainId) {
        if (chainId === 'paima-engine') {
            return;
        }
        
        this.blockchains = this.blockchains.filter(chain => chain.id !== chainId);
        
        this.blockchains.forEach((chain, index) => {
            chain.yPosition = this.chainStartY + (index * this.chainSpacing);
        });
    }

    clearAllChains() {
        this.blockchains = this.blockchains.filter(chain => 
            chain.id === 'paima-engine'
        );
        
        this.blockchains[0].yPosition = this.chainStartY;
    }

    checkProbabilityBlockGeneration(blockchain, currentTime) {
        const timeSinceLastBlock = currentTime - blockchain.lastBlockTime;
        const timing = blockchain.timing;
        
        if (timing.currentCheckIndex < timing.possibleIntervals.length) {
            const targetInterval = timing.possibleIntervals[timing.currentCheckIndex];
            
            if (timeSinceLastBlock >= targetInterval) {
                const remainingIntervals = timing.possibleIntervals.length - timing.currentCheckIndex;
                const probability = 1 / remainingIntervals;
                
                if (Math.random() < probability) {
                    this.engine.createBlock(blockchain, timeSinceLastBlock);
                    blockchain.lastBlockTime = currentTime;
                    timing.currentCheckIndex = 0;
                    return true;
                } else {
                    timing.currentCheckIndex++;
                    
                    if (timing.currentCheckIndex >= timing.possibleIntervals.length) {
                        this.engine.createBlock(blockchain, timeSinceLastBlock);
                        blockchain.lastBlockTime = currentTime;
                        timing.currentCheckIndex = 0;
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    update(currentTime, currentEngineTime) {
        this.blockchains.forEach((blockchain, index) => {
            if (blockchain.lastBlockTime === 0) {
                blockchain.lastBlockTime = currentTime;
                blockchain.lastBlockEndTime = currentEngineTime;
            }
            
            if (blockchain.timing.type === 'fixed') {
                const timeSinceLastBlock = currentTime - blockchain.lastBlockTime;
                
                if (timeSinceLastBlock >= blockchain.timing.interval) {
                    this.engine.createBlock(blockchain, blockchain.timing.interval);
                    blockchain.lastBlockTime = currentTime;
                    
                    if (index === 0 && this.engine.blockCount < 6) {
                        this.engine.blockCount++;
                    }
                }
            } else if (blockchain.timing.type === 'probability') {
                this.checkProbabilityBlockGeneration(blockchain, currentTime);
            }
        });
    }
}
