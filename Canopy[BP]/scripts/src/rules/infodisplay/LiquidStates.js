import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';
import { LiquidType } from '@minecraft/server';

export class LiquidStates extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = {
            identifier: 'liquidStates',
            description: { translate: 'rules.infoDisplay.liquidStates' },
            wikiDescription: 'Shows the states of the liquid you are targeting.'
        }
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { text: String(this.tryFormatBlockStates()) };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    tryFormatBlockStates() {
        const blockRayResult = this.player.getBlockFromViewDirection({ includeLiquidBlocks: true, includePassableBlocks: true, maxDistance: 7 })
        if (blockRayResult?.block.isLiquid)
            return this.formatBlockStates(blockRayResult);
        return '';
    }

    formatBlockStates(lookingAtBlock) {
        let blockStates = '';
        const block = lookingAtBlock?.block;
        if (block) {
            const states = block.permutation.getAllStates();
            if (block.canContainLiquid(LiquidType.Water))
                states.isWaterlogged = block.isWaterlogged;
            for (const [key, value] of Object.entries(states))
                blockStates += `§8${key}: §t${value}\n`;
            blockStates = blockStates.slice(0, -1);
        }
        return blockStates;
    }
}