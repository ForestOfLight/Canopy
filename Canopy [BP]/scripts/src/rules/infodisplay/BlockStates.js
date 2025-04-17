import { InfoDisplayElement } from './InfoDisplayElement.js';
import { getRaycastResults } from '../../../include/utils.js';

export class BlockStates extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = {
            identifier: 'blockStates',
            description: { translate: 'rules.infoDisplay.blockStates' }
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
        if (entity)
            return '';
        return this.formatBlockStates(blockRayResult);
    }

    formatBlockStates(lookingAtBlock) {
        let blockStates = '';
        const block = lookingAtBlock?.block;
        if (block) {
            const states = block.permutation.getAllStates();
            for (const [key, value] of Object.entries(states))
                blockStates += `§7${key}: §3${value}\n`;
            blockStates = blockStates.slice(0, -1);
        }
        return blockStates;
    }
}