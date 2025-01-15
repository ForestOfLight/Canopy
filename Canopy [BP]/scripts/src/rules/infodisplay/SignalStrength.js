import InfoDisplayElement from './InfoDisplayElement.js';
import Utils from 'include/utils';

class SignalStrength extends InfoDisplayElement {
    player;

    constructor(player) {
        super('signalStrength', { translate: 'rules.infoDisplay.signalStrength' }, 12, false, ['lookingAt']);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const signalStrength = this.getSignalStrength();
        return signalStrength ? { text: `§7(§c${signalStrength}§7)§r` } : { text: '' };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getSignalStrength() {
        let blockRayResult, entityRayResult;
        ({ blockRayResult, entityRayResult } = Utils.getRaycastResults(this.player, 7));
        if (entityRayResult[0]?.entity)
            return 0;
        if (blockRayResult?.block)
            return blockRayResult.block.getRedstonePower();
    }
}

export default SignalStrength;