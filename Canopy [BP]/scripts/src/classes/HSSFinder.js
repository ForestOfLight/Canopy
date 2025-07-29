import { EntityInitializationCause, system, TicksPerSecond, world } from "@minecraft/server";
import { mobTypeToHSSMap } from "../../include/data";
import { Vector } from "../../lib/Vector";

export class HSSFinder {
    refreshRateSeconds = 5;
    runner;
    
    constructor() {
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
        if (!event.entity || event.cause !== EntityInitializationCause.Spawned)
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
        if (!this.isStructureSpawn(entity?.location))
            return;
        this.hssLocations.push({ dimension: entity.dimension, location: entity.location, hssType });
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
}