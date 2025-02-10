import InfoDisplayElement from "./InfoDisplayElement";
import { getRaycastResults, parseLookingAtEntity, parseLookingAtBlock } from "../../../include/utils";

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
        const { blockRayResult, entityRayResult } = getRaycastResults(this.player, 7);
        return parseLookingAtEntity(entityRayResult).LookingAtName || parseLookingAtBlock(blockRayResult).LookingAtName;
    }
}

export default LookingAt;