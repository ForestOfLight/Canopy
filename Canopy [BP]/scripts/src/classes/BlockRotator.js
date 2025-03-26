import { world, StructureSaveMode, StructureRotation, BlockPermutation, StructureMirrorAxis } from "@minecraft/server";
import DirectionStateFinder from "../classes/DirectionState";
import { getInventory, restoreInventory } from "../../include/utils";

class BlockRotator {
    static idPrefix = 'canopy:rotator-';
    static lastId = 0;

    static getNextId() {
        return this.lastId++;
    }

    static getAllIds() {
        const allIDs = world.structureManager.getWorldStructureIds();
        const blockRotatorIds = [];

        for (const id of allIDs) {
            if (!id.startsWith(this.idPrefix)) continue;
            blockRotatorIds.push(id);
        }

        return blockRotatorIds;
    }

    static saveBlock(block) {
        const id = this.idPrefix + this.getNextId();
        if (DirectionStateFinder.getDirectionState(block.permutation) === undefined) return;
        const structureCreateOptions = {
            includeBlocks: true,
            includeEntities: false,
            saveMode: StructureSaveMode.Memory
        };
        const savedStructure = world.structureManager.createFromWorld(id, block.dimension, block.location, block.location, structureCreateOptions);
        return savedStructure;
    }

    static placeRotated(structureId, block) {
        if (!this.isValidId(structureId)) return console.warn('[BlockRotator] Invalid structure ID.');
        const structurePlaceOptions = {
            includeBlocks: true,
            includeEntities: false,
            rotation: StructureRotation.Rotate90
        };
        this.place(structureId, block, structurePlaceOptions);
    }

    static placeMirrored(structureId, block) {
        if (!this.isValidId(structureId)) return console.warn('[BlockRotator] Invalid structure ID.');
        const mirroredDirection = DirectionStateFinder.getMirroredDirection(block);
        let axis;
        const items = getInventory(block);
        if ([StructureMirrorAxis.X, StructureMirrorAxis.Z].includes(mirroredDirection)) {
            axis = mirroredDirection;
        } else { // block data has to be rebuilt manually 🎉
            const structure = world.structureManager.get(structureId);
            if (structure === undefined) return console.warn(`[BlockRotator] Could not get structure for ${structureId}.`);
            const directionState = DirectionStateFinder.getDirectionState(structure.getBlockPermutation({x: 0, y: 0, z: 0}));
            const permutation = BlockPermutation.resolve(block.typeId, { [directionState.name]: mirroredDirection });
            structure.setBlockPermutation({x: 0, y: 0, z: 0}, permutation);
            axis = StructureMirrorAxis.None;
        }
        const structurePlaceOptions = {
            includeBlocks: true,
            includeEntities: false,
            mirror: axis
        };
        this.place(structureId, block, structurePlaceOptions);
        if (Object.keys(items).length > 0) restoreInventory(block, items);
    }

    static place(structureId, block, structurePlaceOptions) {
        try {
            world.structureManager.place(structureId, block.dimension, block.location, structurePlaceOptions);
            world.structureManager.delete(structureId);
        } catch (e) {
            world.structureManager.delete(structureId);
            console.warn(`[BlockRotator] Could not complete block flip/rotation.`);
            console.error(e);
        }
    }

    static isValidId(id) {
        return this.getAllIds().includes(id);
    }
}

world.afterEvents.worldLoad.subscribe(() => {
    world.structureManager.getWorldStructureIds().forEach(id => {
        if (id.startsWith(BlockRotator.idPrefix)) 
            world.structureManager.delete(id);
        
    });
});

export default BlockRotator;