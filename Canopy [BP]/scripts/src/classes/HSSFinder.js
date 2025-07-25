import { EntityInitializationCause, system, TicksPerSecond, world } from "@minecraft/server";
import { HSSTypes, mobTypeToHSSMap } from "../../include/data";
import { Vector } from "../../lib/Vector";

export class HSSFinder {
    refreshRateSeconds = 5;
    runner;
    
    constructor(source) {
        this.source = source;
        this.hssLocations = [];
        world.afterEvents.entitySpawn.subscribe(this.onEntitySpawn.bind(this));
        this.runner = system.runInterval(this.displayHSSLocations.bind(this), this.refreshRateSeconds * TicksPerSecond);
    }

    destroy() {
        this.hssLocations = [];
        this.source = null;
        world.afterEvents.entitySpawn.unsubscribe(this.onEntitySpawn.bind(this));
        system.clearRun(this.runner);
    }

    onEntitySpawn(event) {
        if (!this.source || !event.entity || event.cause !== EntityInitializationCause.Spawned)
            return;
        const entity = event.entity;
        const hssType = mobTypeToHSSMap[entity.typeId];
        if (hssType)
            this.addHSSLocation(entity, hssType);
        try {
            entity.remove();
        } catch {
            /* pass */
        }
    }

    addHSSLocation(entity, hssType) {
        if (!this.isStructureSpawn(entity?.location) || !this.passesHSSTests(entity, hssType))
            return;
        this.hssLocations.push({ dimension: entity.dimension, location: entity.location, hssType });
    }

    passesHSSTests(entity, hssType) {
        switch (hssType) {
            case HSSTypes.Fortress:
                return this.isValidFortressSpawn(entity);
            case HSSTypes.OceanMonument:
                return this.isValidOceanMonumentSpawn(entity);
            case HSSTypes.Outpost:
                return this.isValidOutpostSpawn(entity);
            case HSSTypes.WitchHut:
                return this.isValidWitchHutSpawn(entity);
            default:
                throw new Error(`[Canopy] Unknown HSS type: ${hssType}`);
        }
    }

    displayHSSLocations() {
        this.hssLocations.forEach(hssLocation => {
            try {
                hssLocation.dimension.spawnParticle(`canopy:${hssLocation.hssType}_hss_marker`, hssLocation.location);
            } catch {
                /* pass */
            }
        });
    }

    isStructureSpawn(location) {
        if (!location)
            return false;
        const flooredLocation = Vector.from(location).floor();
        return flooredLocation.x === location.x && flooredLocation.z === location.z;
    }

    isValidFortressSpawn(entity) {
        return entity?.isValid &&
            entity.dimension.id === "minecraft:nether";
    }

    isValidOceanMonumentSpawn(entity) {
        return entity?.isValid &&
            entity.dimension.id === "minecraft:overworld"
            && entity.location.y >= 39 && entity.location.y <= 61
            && entity.isInWater;
    }

    isValidOutpostSpawn(entity) {
        return entity?.isValid &&
            entity.dimension.id === "minecraft:overworld";
    }

    isValidWitchHutSpawn(entity) {
        return entity?.isValid &&
            entity.dimension.id === "minecraft:overworld";
    }
}