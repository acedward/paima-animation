import { Chain } from './Chain.js';
import { mergeColors } from '../config.js';

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
