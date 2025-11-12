import { system } from "@minecraft/server";

export class EntityLifetimeRecord {
    entityId;
    entityType;
    localizationKey;
    spawnReason;
    spawnTick;
    spawnDate;
    removalReason;
    removalTick;
    removalDate;

    constructor(entity, spawnReason) {
        this.entityId = entity.id;
        this.entityType = entity.typeId;
        this.localizationKey = entity.localizationKey;
        this.spawnReason = spawnReason;
        this.spawnTick = system.currentTick;
        this.spawnDate = Date.now();
        // console.warn('Spawn Collection: ', JSON.stringify(this));
    }

    collectRemoval(removalReason) {
        this.removalReason = removalReason;
        this.removalTick = system.currentTick;
        this.removalDate = Date.now();
        // console.warn('Remove Collection: ', JSON.stringify(this));
    }

    getLifetime(useRealtime) {
        if (useRealtime)
            return (this.hasBeenRemoved() ? this.removalDate : Date.now()) - this.spawnDate;
        return (this.hasBeenRemoved() ? this.removalTick : system.currentTick) - this.spawnTick;
    }
    
    hasBeenRemoved() {
        return this.removalReason;
    }
}