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
        this.localizationKey = { translate: entity.localizationKey };
        this.spawnReason = spawnReason;
        this.spawnTick = system.currentTick;
        this.spawnDate = Date.now();
    }

    collectRemoval(removalReason) {
        if (this.hasBeenRemoved())
            return;
        this.removalReason = removalReason;
        this.removalTick = system.currentTick;
        this.removalDate = Date.now();
    }

    getLifetime(useRealtime) {
        if (useRealtime)
            return ((this.hasBeenRemoved() ? this.removalDate : Date.now()) - this.spawnDate) / 1000;
        return (this.hasBeenRemoved() ? this.removalTick : system.currentTick) - this.spawnTick;
    }
    
    hasBeenRemoved() {
        return this.removalReason !== void 0;
    }
}