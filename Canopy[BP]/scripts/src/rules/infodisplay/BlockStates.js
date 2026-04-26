import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';
import { getRaycastResults } from '../../../include/utils.js';
import { LiquidType } from '@minecraft/server';

export class BlockStates extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = {
            identifier: 'blockStates',
            description: { translate: 'rules.infoDisplay.blockStates' },
            wikiDescription: 'Shows the block states of the block you are targeting. Especially useful with [Construct](https://github.com/ForestOfLight/Construct), which shows desired block states as you build. Includes waterlogged status.'
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
        const { blockRayResult, entityRayResult } = getRaycastResults(this.player, 7);
        const entity = entityRayResult[0]?.entity;
        if (entity || blockRayResult?.block.isLiquid)
            return '';
        return this.formatBlockStates(blockRayResult);
    }

    formatBlockStates(lookingAtBlock) {
        let blockStates = '';
        const block = lookingAtBlock?.block;
        if (block) {
            const states = block.permutation.getAllStates();
            if (block.canContainLiquid(LiquidType.Water))
                states.isWaterlogged = block.isWaterlogged;
            for (const [key, value] of Object.entries(states))
                blockStates += `§7${key}: §3${value}\n`;
            blockStates = blockStates.slice(0, -1);
        }
        return blockStates;
    }
}