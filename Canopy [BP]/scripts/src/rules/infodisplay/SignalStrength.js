import InfoDisplayElement from './InfoDisplayElement.js';

class SignalStrength extends InfoDisplayElement {
    player;

    constructor(player) {
        this.player = player;
        super('signalStrength', { translate: 'rules.infoDisplay.signalStrength' }, 10, false, ['lookingAt']);
    }

    getFormattedDataOwnLine() {
        const signalStrength = this.getSignalStrength();
        return signalStrength ? { text: `§7: §c${signalStrength}§r` } : { text: '' };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getSignalStrength() {
        let ({ blockRayResult, entityRayResult } = Utils.getRaycastResults(this.player, 7));
        if (entityRayResult[0]?.entity)
            return 0;
        if (blockRayResult?.block)
            return blockRayResult.block.getRedstonePower();
    }
}

export default SignalStrength;