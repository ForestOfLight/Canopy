import InfoDisplayElement from './InfoDisplayElement.js';
import Utils from 'include/utils';

class LookingAt extends InfoDisplayElement {
    constructor(player) {
        super('lookingAt', { translate: 'rules.infoDisplay.lookingAt' }, 12);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { text: String(this.getLookingAtName()) };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getLookingAtName() {
        let blockRayResult, entityRayResult;
        ({ blockRayResult, entityRayResult } = Utils.getRaycastResults(this.player, 7));
        return Utils.parseLookingAtEntity(entityRayResult).LookingAtName || Utils.parseLookingAtBlock(blockRayResult).LookingAtName;
    }
}

export default LookingAt;