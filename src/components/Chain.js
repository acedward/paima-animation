import { blockHeight } from '../config.js';
import { Block } from './Block.js';

export class Chain {
    constructor(name, yPosition, timing, lastBlockEndTime) {
        this.name = name;
        this.yPosition = yPosition;
        this.timing = timing;
        this.lastBlockEndTime = lastBlockEndTime;
        this.color = () => '#7f8c8d';
        this.counter = 0;
        this.blocks = [];
        this.lastBlockTime = 0;
        this.id = `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    createBlock(currentEngineTime, waitingParticles) {
        const height = blockHeight;
        const color = this.color();
        const counter = this.counter++;
        
        const startTime = this.lastBlockEndTime;
        const endTime = currentEngineTime;
        
        const x = 0;
        const width = 1;
        
        const block = new Block(x, this.yPosition, color, counter, width, height, 0, startTime, endTime, this);
        
        const relevantParticles = waitingParticles.filter(p => 
            p.targetChain.name === this.name && p.state === 'WAITING'
        );
    
        relevantParticles.forEach(particle => {
            block.events.push(particle.event);
            particle.isActive = false;
        });

        this.blocks.push(block);
        
        this.lastBlockEndTime = endTime;
        
        return block;
    }

    drawLabel(ctx) {
        const color = this.name === 'Paima Engine' ? '#19b17b' : '#fff';
        ctx.fillStyle = color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(this.name, 20, this.yPosition - 10);
    }

    getTimingLabel() {
        if (this.timing.type === 'fixed') {
            return `(${this.timing.interval / 1000}s)`;
        } else if (this.timing.type === 'probability') {
            return '(prob)';
        }
        return '';
    }
}
