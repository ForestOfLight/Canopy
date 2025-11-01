import { EntityInitializationCause, world } from "@minecraft/server";
import { HSSTypes, mobTypeToHSSMap } from "../../include/data";
import { Vector } from "../../lib/Vector";
import { StructureBoundsFinder } from "./StructureBoundsFinder";
import { HSSRenderer } from "./HSSRenderer";
import { DebugBox, debugDrawer } from "@minecraft/debug-utilities";
import { HSS_ACTIONS } from "../commands/hss";

export class HSSFinder {
    isFortress = false;
    fortressHSSShapes = [];
    renderer = void 0;
    
    constructor(dimensionLocation) {
        if (dimensionLocation.mode === HSS_ACTIONS.FORTRESS) {
            this.onEntitySpawnBound = this.onEntitySpawn.bind(this);
            world.afterEvents.entitySpawn.subscribe(this.onEntitySpawnBound);
            this.isFortress = true;
        } else {
            this.processStructureAt(dimensionLocation);
        }
    }

    destroy() {
        if (this.isFortress) {
            this.fortressHSSShapes.forEach((shape) => shape.remove());
            world.afterEvents.entitySpawn.unsubscribe(this.onEntitySpawnBound);
        } else {
            this.renderer?.destroy();
        }
    }

    processStructureAt(dimensionLocation) {
        const dimension = dimensionLocation.dimension;
        const location = dimensionLocation.location;
        const structureBoundsFinder = new StructureBoundsFinder(dimension, Vector.from(location).floor());
        const structureBounds = structureBoundsFinder.getBounds();
        const calculatedHSS = this.calculateHSS(structureBounds);
        this.renderer?.destroy();
        this.renderer = new HSSRenderer(structureBoundsFinder, calculatedHSS);
    }

    calculateHSS(structureBounds) {
        const CHUNK_SIZE = 16;
        const chunkOverlay = {
            min: structureBounds.min.divide(CHUNK_SIZE).floor().multiply(CHUNK_SIZE),
            max: structureBounds.max.divide(CHUNK_SIZE).floor().add(new Vector(1, 1, 1)).multiply(CHUNK_SIZE)
        };
        const hssLocations = [];
        for (let chunkX = chunkOverlay.min.x; chunkX < chunkOverlay.max.x; chunkX += CHUNK_SIZE) {
            for (let chunkZ = chunkOverlay.min.z; chunkZ < chunkOverlay.max.z; chunkZ += CHUNK_SIZE) {
                const baseX = Math.max(structureBounds.min.x, chunkX);
                const baseZ = Math.max(structureBounds.min.z, chunkZ);
                const remainingX = Math.min(structureBounds.max.x - baseX, chunkX + CHUNK_SIZE - baseX);
                const remainingZ = Math.min(structureBounds.max.z - baseZ, chunkZ + CHUNK_SIZE - baseZ);
                const location = new Vector(
                    baseX + Math.floor((remainingX) * 0.5),
                    86,
                    baseZ + Math.floor((remainingZ) * 0.5)
                );
                hssLocations.push(location);
            }
        }
        return hssLocations;
    }

    onEntitySpawn(event) {
        if (!event.entity || event.cause !== EntityInitializationCause.Spawned)
            return;
        const entity = event.entity;
        if (mobTypeToHSSMap[entity?.typeId] === HSSTypes.Fortress && this.isStructureSpawn(entity?.location))
            this.processFortressSpawn(entity.dimension, entity.location);
        try {
            entity?.remove()
        } catch {
            /* pass */
        }
    }
    
    isStructureSpawn(location) {
        if (!location)
            return false;
        const flooredLocation = Vector.from(location).floor();
        return flooredLocation.x === location.x && flooredLocation.z === location.z;
    }

    processFortressSpawn(dimension, location) {
        const flooredLocation = Vector.from(location).floor();
        if (this.knowsFortressHSS(flooredLocation))
            return;
        const bottom = this.findStructureBottom(dimension, flooredLocation, "minecraft:fortress");
        const top = this.findStructureTop(dimension, flooredLocation, "minecraft:fortress");
        const height = top.y - bottom.y;

        const box = new DebugBox(bottom);
        box.bound = new Vector(1, height, 1);
        box.color = { red: 0, green: 1, blue: 0 };
        this.fortressHSSShapes.push(box);
        debugDrawer.addShape(box);
    }

    knowsFortressHSS(hssLocation) {
        return this.fortressHSSShapes.some((hss) => hssLocation.distance(hss.location) === 0);
    }

    findStructureBottom(dimension, startLocation, structureType) {
        const bottom = new Vector(startLocation.x, startLocation.y, startLocation.z);
        while (dimension.getGeneratedStructures(bottom)?.at(0) === structureType && startLocation.y - bottom.y < 500)
            bottom.y--;
        bottom.y++;
        return bottom;
    }

    findStructureTop(dimension, startLocation, structureType) {
        const top = new Vector(startLocation.x, startLocation.y, startLocation.z);
        while (dimension.getGeneratedStructures(top)?.at(0) === structureType && startLocation.y - top.y < 500)
            top.y++;
        top.y--;
        return top;
    }
}