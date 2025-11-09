import { InfoDisplayElement } from "./InfoDisplayElement";
import { getRaycastResults, parseName, stringifyLocation } from "../../../include/utils";

export class Target extends InfoDisplayElement {
    constructor(player, displayLine) {
        const ruleData = { identifier: 'target', description: { translate: 'rules.infoDisplay.target' } };
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
        return this.#parseLookingAtEntity(entityRayResult).LookingAtName || this.#parseLookingAtBlock(blockRayResult).LookingAtName;
    }

    #parseLookingAtBlock(lookingAtBlock) {
        let blockName = '';
        let raycastHitFace;
        const block = lookingAtBlock?.block ?? undefined;
        if (block && !block.isLiquid) {
            raycastHitFace = lookingAtBlock.face;
            try {
                blockName = `§a${parseName(block)}`;
            } catch (error) {
                if (error.message.includes('loaded'))
                    blockName = `§c${stringifyLocation(block.location, 0)} Unloaded`;
                else if (error.message.includes('undefined'))
                    blockName = '§7Undefined';
            }
        }
        return { LookingAtName: blockName, LookingAtFace: raycastHitFace, LookingAtLocation: block?.location, LookingAtBlock: block };
    }

    #parseLookingAtEntity(lookingAtEntities) {
        let entityName;
        const entity = lookingAtEntities[0]?.entity ?? undefined;
        if (entity) {
            try {
                entityName = `§a${parseName(entity)}`;
                if (entity.typeId === 'minecraft:player') 
                    entityName = `§a§o${entity.name}§r`;
            } catch (error) {
                if (error.message.includes('loaded')) 
                    entityName = `§c${stringifyLocation(entity.location, 0)} Unloaded`;
                else if (error.message.includes('undefined')) 
                    entityName = '§7Undefined';
            }
        }
        return { LookingAtName: entityName, LookingAtEntity: entity }
    }
}