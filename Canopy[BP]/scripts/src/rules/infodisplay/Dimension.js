import { getColorByDimension } from '../../../include/utils.js';
import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

class Dimension extends InfoDisplayTextElement {
    static getRuleIdentifier() {
        return 'dimension';
    }

    constructor(player, displayLine) {
        const ruleData = { description: { translate: 'rules.infoDisplay.dimension' }, wikiDescription: 'Shows your current dimension\'s identifier.' };
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