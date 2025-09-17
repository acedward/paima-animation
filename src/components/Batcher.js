import { generateBlockchainEvent } from '../utils/helpers.js';
import { BatcherParticle } from './BatcherParticle.js';
import * as COLORS from '../colors.js';

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
        this.color = COLORS.DARK_GREY;
        this.requestsReceived = 0;
        this.ledOn = true;
        this.ledBlinkCounter = 0;
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
        this.ledBlinkCounter++;
        if (this.ledBlinkCounter > 30) {
            this.ledOn = !this.ledOn;
            this.ledBlinkCounter = 0;
        }

        ctx.save();
        
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        grad.addColorStop(0, COLORS.DARK_GREY);
        grad.addColorStop(1, COLORS.BLACK);
        
        ctx.fillStyle = grad;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = COLORS.GREY;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        for (let i = 1; i < 4; i++) {
            const y = this.y + (i * this.height / 4);
            ctx.beginPath();
            ctx.moveTo(this.x, y);
            ctx.lineTo(this.x + this.width, y);
            ctx.strokeStyle = COLORS.GREY;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.fillStyle = this.ledOn ? COLORS.PRIMARY : COLORS.DARK_GREEN;
        ctx.fillRect(this.x + 10, this.y + 10, 5, 5);
        
        ctx.fillStyle = COLORS.WHITE;
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
