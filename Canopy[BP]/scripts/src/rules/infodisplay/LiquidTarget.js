import { InfoDisplayTextElement } from "./InfoDisplayTextElement";
import { parseName, stringifyLocation } from "../../../include/utils";
import { LocationInUnloadedChunkError } from "@minecraft/server";

export class LiquidTarget extends InfoDisplayTextElement {
    static getRuleIdentifier() {
        return 'liquidTarget';
    }

    constructor(player, displayLine) {
        const ruleData = { description: { translate: 'rules.infoDisplay.liquidTarget' }, wikiDescription: 'Shows the identifier of the liquid you are targeting.' };
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
        try {
            const blockRayResult = this.player.getBlockFromViewDirection({ includeLiquidBlocks: true, includePassableBlocks: true, maxDistance: 7 });
            return this.#parseLookingAtLiquid(blockRayResult).LookingAtName;
        } catch (error) {
            if (error instanceof LocationInUnloadedChunkError)
                return '';
            throw error;
        }
    }

    #parseLookingAtLiquid(lookingAtBlock) {
        let blockName = '';
        let raycastHitFace;
        const block = lookingAtBlock?.block ?? undefined;
        if (block?.isLiquid) {
            raycastHitFace = lookingAtBlock.face;
            try {
                blockName = `§2${parseName(block)}`;
            } catch (error) {
                if (error instanceof LocationInUnloadedChunkError)
                    blockName = `§c${stringifyLocation(block.location, 0)} Unloaded`;
                else if (error.message.includes('undefined'))
                    blockName = '§7Undefined';
            }
        }
        return { LookingAtName: blockName, LookingAtFace: raycastHitFace, LookingAtLocation: block?.location, LookingAtBlock: block };
    }
}