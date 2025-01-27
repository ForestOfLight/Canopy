import InfoDisplayElement from "./InfoDisplayElement.js";
import Utils from "../../../include/utils.js";

class SignalStrength extends InfoDisplayElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'signalStrength', description: { translate: 'rules.infoDisplay.signalStrength' }, contingentRules: ['lookingAt'] };
        super(ruleData, displayLine, false);
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
        const { blockRayResult, entityRayResult } = Utils.getRaycastResults(this.player, 7);
        if (entityRayResult[0]?.entity)
            return 0;
        if (blockRayResult?.block)
            return blockRayResult.block.getRedstonePower();
    }
}

export default SignalStrength;