import { generateBlockchainEvent } from '../utils/helpers.js';
import { BatcherParticle } from './BatcherParticle.js';

/**
 * @class Batcher
 * @description Represents a batcher in the animation, which collects user requests and creates batched events.
 * 
 * This class is responsible for receiving requests, generating blockchain events from them,
 * and creating `BatcherParticle` objects to send these events to the appropriate blockchains.
 * It is rendered as a box on the canvas that displays the number of requests it has processed.
 */
export class Batcher {
    constructor(x, y) {
        this.x = x - 50;
        this.y = y;
        this.width = 130;
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

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Batcher', this.x + this.width / 2, this.y + 20);
        ctx.font = '12px Arial';
        ctx.fillText(`Processed: ${this.requestsReceived}`, this.x + this.width / 2, this.y + 40);
        ctx.restore();
    }

    isInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    getTooltipData() {
        return {
            title: 'Batcher',
            content: 'Receives user requests and batches them into events for the blockchains.',
            data: `Requests Received: ${this.requestsReceived}`
        };
    }
}
