import { getColorByDimension } from '../../../include/utils.js';
import { InfoDisplayElement } from './InfoDisplayElement.js';

class Dimension extends InfoDisplayElement {
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