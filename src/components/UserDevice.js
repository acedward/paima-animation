import { UserRequestParticle } from './UserRequestParticle.js';
import { randomMultipliers } from '../random.js';
import { blockHeight } from '../config.js';

export class UserDevice {
    constructor(x, y, name = 'User') {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.color = '#ffffff';
        this.name = name;
        this.lastRequestTime = Date.now();
        this.requestInterval = Math.random() * randomMultipliers.userDeviceRequestInterval.multiplier + randomMultipliers.userDeviceRequestInterval.offset;

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
            this.requestInterval = Math.random() * randomMultipliers.userDeviceRequestInterval.multiplier + randomMultipliers.userDeviceRequestInterval.offset;
            
            const useBatcher = Math.random() < 0.5;

            if (useBatcher && engine.batcher) {
                const particle = new UserRequestParticle(
                    this.x,
                    this.y,
                    engine.batcher.x + engine.batcher.width / 2,
                    engine.batcher.y + engine.batcher.height / 2,
                    engine.batcher
                );
                engine.userRequestParticles.push(particle);
            } else if (engine.blockchains && engine.blockchains.length > 0) {
                const targetableChains = engine.blockchains.filter(bc => bc.name !== 'Paima Engine');
                if (targetableChains.length > 0) {
                    const randomChain = targetableChains[Math.floor(Math.random() * targetableChains.length)];
                    const nowPosition = engine.blockProcessor.nowPosition;
                    const targetX = nowPosition + 100;
                    const targetY = randomChain.yPosition + blockHeight / 2;
                    
                    const particle = new UserRequestParticle(
                        this.x,
                        this.y,
                        targetX,
                        targetY,
                        randomChain
                    );
                    engine.userRequestParticles.push(particle);
                }
            } else if (engine.batcher) { // Fallback to batcher if no blockchains
                const particle = new UserRequestParticle(
                    this.x,
                    this.y,
                    engine.batcher.x + engine.batcher.width / 2,
                    engine.batcher.y + engine.batcher.height / 2,
                    engine.batcher
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
