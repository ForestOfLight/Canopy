import { getColorByDimension } from '../../../include/utils.js';
import { InfoDisplayElement } from './InfoDisplayElement.js';

class Dimension extends InfoDisplayElement {
    constructor(player, displayLine) {
        const ruleData = { identifier: 'dimension', description: { translate: 'rules.infoDisplay.dimension' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const dimensionId = this.player.dimension.id;
        return { text: getColorByDimension(dimensionId) + dimensionId };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export { Dimension };