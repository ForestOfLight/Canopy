import { EntityLifetimeRecord } from "./EntityLifetimeRecord";

export class EntityLifetimeRecords {
    worldLifetimeTracker;
    dimensionId;
    entityLifetimeRecords = [];
    
    constructor(worldLifetimeTracker, dimensionId) {
        this.worldLifetimeTracker = worldLifetimeTracker;
        this.dimensionId = dimensionId;
    }
    
    destroy() {
        this.entityLifetimeRecords.length = 0;
        this.worldLifetimeTracker = void 0;
    }

    collectSpawn(entity, spawnReason) {
        this.entityLifetimeRecords.push(new EntityLifetimeRecord(entity, spawnReason));
    }

    collectRemoval(entity, removalReason) {
        this.entityLifetimeRecords.find(record => record.entityId === entity.id).collectRemoval(removalReason);
    }

    getTotalSpawns(entityType = false) {
        if (entityType)
            return this.getSpawnedEntityLifetimeRecords(entityType).length;
        return this.entityLifetimeRecords.length;
    }

    getTotalRemovals(entityType = false) {
        if (entityType)
            return this.getSpawnedEntityLifetimeRecords(entityType).filter((record) => record.hasBeenRemoved()).length;
        return this.entityLifetimeRecords.filter((record) => record.hasBeenRemoved()).length;
    }

    getQueryAllMessage(useRealtime) {
        const message = { rawtext: [] };
        for (const entityType in this.getEntityTypes()) {
            const lifetimeData = this.getLifetimeData(entityType, useRealtime);
            message.rawtext.push({ text: '\n' });
            message.rawtext.push({ translate: 'commands.lifetime.query.body', with: { rawtext: [
                { translate: this.worldLifetimeTracker.getLocalizationKey(entityType) },
                { text: this.getTotalSpawns(entityType) },
                { text: this.getTotalRemovals(entityType) },
                { text: lifetimeData.min },
                { text: lifetimeData.max },
                { text: lifetimeData.average }
            ] } });
            message.rawtext.push(this.getRealtimeUnitRawtext(useRealtime));
        }
        return message;
    }

    getQueryMessage(entityType, useRealtime) {
        if (!this.getEntityTypes().includes(entityType))
            throw new Error(`[Canopy] No entity lifetime information available for '${entityType}'`);
        return { rawtext: [
            this.getQueryLifetimeMessage(entityType, useRealtime),
            this.getQuerySpawnsMessage(entityType, useRealtime),
            this.getQueryRemovalsMessage(entityType, useRealtime)
        ]};
    }

    getQueryLifetimeMessage(entityType, useRealtime) {
        const lifetimeData = this.getLifetimeData(entityType, useRealtime);
        return { rawtext: [
            { translate: 'commands.lifetime.query.entity.lifetime.header' }, { text: '\n' },
            { translate: 'commands.lifetime.query.entity.lifetime.min', with: [String(lifetimeData.min)] }, this.getRealtimeUnitRawtext(useRealtime), { text: '\n' },
            { translate: 'commands.lifetime.query.entity.lifetime.max', with: [String(lifetimeData.max)] }, this.getRealtimeUnitRawtext(useRealtime), { text: '\n' },
            { translate: 'commands.lifetime.query.entity.lifetime.average', with: [String(lifetimeData.average)] }, this.getRealtimeUnitRawtext(useRealtime), { text: '\n' }
        ] };
    }

    getQuerySpawnsMessage(entityType, useRealtime) {
        const spawnData = this.getSpawnData(entityType, useRealtime);
        const message = { rawtext: [{ translate: 'commands.lifetime.query.entity.spawns.header' }] };
        for (const spawnRecord in spawnData) {
            const spawnsPerHour = this.worldLifetimeTracker.calcPerHour(spawnRecord.count, useRealtime);
            message.rawtext.push({ text: '\n' });
            message.rawtext.push({ translate: 'commands.lifetime.query.entity.spawns', with: [spawnRecord.reason, String(spawnRecord.count), String(spawnsPerHour), String(spawnRecord.percent)] });
        }
        return message;
    }

    getQueryRemovalsMessage(entityType, useRealtime) {
        const removalData = this.getRemovalData(entityType, useRealtime);
        const message = { rawtext: [{ translate: 'commands.lifetime.query.entity.removals.header' }] };
        for (const removalRecord in removalData) {
            message.rawtext.push({ rawtext: [
                { text: '\n' }, { translate: 'commands.lifetime.query.entity.removals', with: [removalRecord.reason, String(removalRecord.count), String(removalRecord.percent)] },
                { text: '\n ' }, { translate: 'commands.lifetime.query.entity.lifetime.min', with: [String(removalRecord.minLifetime)] }, this.getRealtimeUnitRawtext(useRealtime), { text: '\n' },
                { text: '\n ' }, { translate: 'commands.lifetime.query.entity.lifetime.max', with: [String(removalRecord.maxLifetime)] }, this.getRealtimeUnitRawtext(useRealtime), { text: '\n' },
                { text: '\n ' }, { translate: 'commands.lifetime.query.entity.lifetime.average', with: [String(removalRecord.averageLifetime)] }, this.getRealtimeUnitRawtext(useRealtime)
            ] });
        }
        return message;
    }

    getLifetimeData(entityType, useRealtime) {
        const entityLifetimeRecords = this.getSpawnedEntityLifetimeRecords(entityType);
        const entityLifetimes = entityLifetimeRecords.map(record => record.getLifetime(useRealtime));
        return { 
            min: Math.min(...entityLifetimes),
            max: Math.max(...entityLifetimes),
            average: entityLifetimes.reduce((sum, lifetime) => sum + lifetime, 0) / entityLifetimes.length 
        };
    }

    getSpawnData(entityType) {
        const entityLifetimeRecords = this.getSpawnedEntityLifetimeRecords(entityType);
        const spawnReasons = entityLifetimeRecords.map(record => record.spawnReason);
        const reasonMap = spawnReasons.reduce((acc, reason) => {
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(reasonMap)
            .map(([reason, count]) => ({ reason, count, percent: count / entityLifetimeRecords.length }))
            .sort((a, b) => b.count - a.count);
    }

    getRemovalData(entityType, useRealtime) {
        const entityLifetimeRecords = this.getRemovedEntityLifetimeRecords(entityType);
        const removalReasons = entityLifetimeRecords.map(record => record.removalReason);
        const reasonMap = removalReasons.reduce((acc, reason) => {
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(reasonMap).map(([reason, count]) => {
            const reasonLifetimes = entityLifetimeRecords.filter(record => record.removalReason === reason).map(record => record.getLifetime(useRealtime))
            return {
                reason,
                count,
                percent: count / entityLifetimeRecords.length,
                minLifetime: Math.min(...reasonLifetimes),
                maxLifetime: Math.max(...reasonLifetimes),
                averageLifetime: reasonLifetimes.reduce((sum, lifetime) => sum + lifetime, 0) / reasonLifetimes.length
            }
        }).sort((a, b) => b.count - a.count);
    }

    getSpawnRemovalRatio(entityType) {
        return this.getTotalSpawns(entityType) / this.getTotalRemovals(entityType);
    }

    getSpawnedEntityLifetimeRecords(entityType) {
        return this.entityLifetimeRecords.filter(record => record.entityType === entityType);
    }

    getRemovedEntityLifetimeRecords(entityType) {
        return this.getSpawnedEntityLifetimeRecords(entityType).filter((record) => record.hasBeenRemoved());
    }

    getEntityTypes() {
        return [...new Set(this.entityLifetimeRecords.map(record => record.entityType))]
            .sort((a, b) => this.getSpawnRemovalRatio(b) - this.getSpawnRemovalRatio(a));
    }

    getRealtimeUnitRawtext(useRealtime) {
        return { translate: `commands.lifetime.query.${useRealtime ? 'realtime' : 'ticktime'}.unit` };
    }
}