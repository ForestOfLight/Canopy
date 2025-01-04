import InfoDisplayElement from './InfoDisplayElement.js';

class LookingAt extends InfoDisplayElement {
    constructor(player) {
        this.player = player;
        super('lookingAt', { translate: 'rules.infoDisplay.lookingAt' }, 10);
    }

    getFormattedDataOwnLine() {
        return { text: getLookingAtName() };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getLookingAtName() {
        ({ blockRayResult, entityRayResult } = Utils.getRaycastResults(player, 7));
        return String(Utils.parseLookingAtEntity(entityRayResult).LookingAtName) || String(Utils.parseLookingAtBlock(blockRayResult).LookingAtName);
    }
}

export default LookingAt;