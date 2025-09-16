import { Chain } from './Chain.js';
import { mergeColors } from '../config.js';

/**
 * @class PaimaEngineChain
 * @extends Chain
 * @description Represents the Paima Engine's specialized blockchain in the animation.
 * 
 * This class extends the generic `Chain` class to add functionality specific to the Paima Engine.
 * It is responsible for processing blocks from other secondary chains that fall within its
 * own block times. When it processes a secondary block, it triggers the creation of actions
 * from that block's events and initiates a color change animation on the block to signify
 * that it has been merged.
 */
export class PaimaEngineChain extends Chain {
    constructor(yPosition, lastBlockEndTime) {
        const timing = { type: 'fixed', interval: 1000 };
        super('Paima Engine', yPosition, timing, lastBlockEndTime);
        this.color = () => '#19b17b';
        this.id = 'paima-engine';
        this.currentMergeColorIndex = 0;
    }

    processSecondaryChains(allChains, createActionsFromBlock) {
        if (this.blocks.length === 0) return;
        const lastPaimaBlock = this.blocks[this.blocks.length - 1];

        allChains.forEach(secondaryChain => {
            if (secondaryChain.name === this.name) return;

            secondaryChain.blocks.forEach(secondaryBlock => {
                if (secondaryBlock.endTime > lastPaimaBlock.startTime && secondaryBlock.endTime <= lastPaimaBlock.endTime && !secondaryBlock.eventsProcessed) {
                    createActionsFromBlock(secondaryBlock);
                    secondaryBlock.eventsProcessed = true;

                    const newColor = mergeColors[this.currentMergeColorIndex % mergeColors.length];
                    secondaryBlock.startColorAnimation(newColor);
                    this.currentMergeColorIndex++;
                }
            });
        });
    }
}
