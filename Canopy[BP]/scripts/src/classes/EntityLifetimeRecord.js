import { system } from "@minecraft/server";

export class EntityLifetimeRecord {
    entityId;
    entityType;
    localizationKey;
    spawnReason;
    spawnPriority;
    spawnTick;
    spawnDate;
    removalReason;
    removalPriority;
    removalTick;
    removalDate;

    constructor(entity, spawnReason, spawnPriority = 0) {
        this.entityId = entity.id;
        this.entityType = entity.typeId;
        this.localizationKey = { translate: entity.localizationKey };
        this.spawnReason = spawnReason;
        this.spawnPriority = spawnPriority;
        this.spawnTick = system.currentTick;
        this.spawnDate = Date.now();
    }

    collectRemoval(removalReason, removalPriority = 0) {
        if (this.hasBeenRemoved())
            return;
        this.removalReason = removalReason;
        this.removalPriority = removalPriority;
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