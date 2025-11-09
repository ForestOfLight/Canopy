import { InfoDisplayElement } from "./InfoDisplayElement";
import { parseName, stringifyLocation } from "../../../include/utils";

export class LiquidTarget extends InfoDisplayElement {
    constructor(player, displayLine) {
        const ruleData = { identifier: 'liquidTarget', description: { translate: 'rules.infoDisplay.liquidTarget' } };
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
        const blockRayResult = this.player.getBlockFromViewDirection({ includeLiquidBlocks: true, includePassableBlocks: true, maxDistance: 7 });
        return this.#parseLookingAtLiquid(blockRayResult).LookingAtName;
    }

    #parseLookingAtLiquid(lookingAtBlock) {
        let blockName = '';
        let raycastHitFace;
        const block = lookingAtBlock?.block ?? undefined;
        if (block && block.isLiquid) {
            raycastHitFace = lookingAtBlock.face;
            try {
                blockName = `§2${parseName(block)}`;
            } catch (error) {
                if (error.message.includes('loaded'))
                    blockName = `§c${stringifyLocation(block.location, 0)} Unloaded`;
                else if (error.message.includes('undefined'))
                    blockName = '§7Undefined';
            }
        }
        return { LookingAtName: blockName, LookingAtFace: raycastHitFace, LookingAtLocation: block?.location, LookingAtBlock: block };
    }
}