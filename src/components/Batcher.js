import { generateBlockchainEvent } from '../utils/helpers.js';
import { BatcherParticle } from './BatcherParticle.js';

export class Batcher {
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
