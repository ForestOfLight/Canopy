import { InfoDisplayTextElement } from "./InfoDisplayTextElement";
import { getRaycastResults } from "../../../include/utils";

class SignalStrength extends InfoDisplayTextElement {
    player;

    constructor(player, displayLine) {
        const ruleData = { identifier: 'signalStrength', description: { translate: 'rules.infoDisplay.signalStrength' }, contingentRules: ['target'], wikiDescription: 'Shows the redstone signal strength of the block you are targeting.' };
        super(ruleData, displayLine, false);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        const signalStrength = this.getSignalStrength();
        return signalStrength ? { text: `§r(§c${signalStrength}§r)` } : { text: '' };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }

    getSignalStrength() {
        const { blockRayResult, entityRayResult } = getRaycastResults(this.player, 7);
        if (entityRayResult[0]?.entity)
            return 0;
        try {
            return blockRayResult?.block?.getRedstonePower();
        } catch (error) {
            if (error.name === 'LocationInUnloadedChunkError')
                return 0;
            throw error;
        }
    }
}

export default SignalStrength;