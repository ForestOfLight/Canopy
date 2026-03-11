import { getColorByDimension } from '../../../include/utils.js';
import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

class Dimension extends InfoDisplayTextElement {
    constructor(player, displayLine) {
        const ruleData = { identifier: 'dimension', description: { translate: 'rules.infoDisplay.dimension' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const dimension = this.player.dimension;
        return { rawtext: [{ text: getColorByDimension(dimension.id) }, { translate: dimension.localizationKey }] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export { Dimension };