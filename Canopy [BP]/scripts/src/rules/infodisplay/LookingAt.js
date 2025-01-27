import InfoDisplayElement from './InfoDisplayElement.js';
import Utils from 'include/utils';

class LookingAt extends InfoDisplayElement {
    constructor(player, displayLine) {
        const ruleData = { identifier: 'lookingAt', description: { translate: 'rules.infoDisplay.lookingAt' } };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { text: String(this.getLookingAtName()) };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getLookingAtName() {
        const { blockRayResult, entityRayResult } = Utils.getRaycastResults(this.player, 7);
        return Utils.parseLookingAtEntity(entityRayResult).LookingAtName || Utils.parseLookingAtBlock(blockRayResult).LookingAtName;
    }
}

export default LookingAt;