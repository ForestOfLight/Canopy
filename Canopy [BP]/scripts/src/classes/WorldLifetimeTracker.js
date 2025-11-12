import { DimensionTypes, EntityInitializationCause, system, TicksPerSecond, world } from "@minecraft/server";
import { getColoredDimensionName } from "../../include/utils";
import { EntityLifetimeRecords } from "./EntityLifetimeRecords";

export class WorldLifetimeTracker {
    startTick;
    startDate;
    isCollecting;
    stopTick;
    stopDate;
    dimensionToEntityLifetimeRecordMap = {};
    localizationKeys = {};

    constructor() {
        this.createDimensionRecords();
        this.startCollecting();
        this.onEntitySpawnBound = this.onEntitySpawn.bind(this);
        this.onEntityLoadBound = this.onEntityload.bind(this);
        this.onEntityDieBound = this.onEntityDie.bind(this);
        this.onEntityRemoveBound = this.onEntityRemove.bind(this);
    }

    destroy() {
        this.stopCollecting();
        Object.values(this.dimensionToEntityLifetimeRecordMap).forEach((lifetime) => lifetime.destroy());
        this.dimensionToEntityLifetimeRecordMap = {};
    }

    startCollecting() {
        this.startTick = system.currentTick;
        this.startDate = Date.now();
        this.subscribeToEvents();
        this.isCollecting = true;
    }

    stopCollecting() {
        this.stopTick = system.currentTick;
        this.stopDate = Date.now();
        this.unsubscribeFromEvents();
        this.isCollecting = false;
    }

    getQueryAllMessage(useRealtime) {
        const message = { rawtext: [] };
        message.rawtext.push(this.getHeaderMessage(useRealtime));
        message.rawtext.push({ text: '\n' });
        for (const dimensionId in Object.keys(this.dimensionToEntityLifetimeRecordMap)) {
            message.rawtext.push(this.getDimensionHeaderMessage(dimensionId, useRealtime));
            for (const entityLifetimeRecord in this.dimensionToEntityLifetimeRecordMap[dimensionId]) {
                message.rawtext.push({ text: '\n' });
                message.rawtext.push(entityLifetimeRecord.getShortMessage(useRealtime));
            }
        }
    }

    getQueryEntityMessage(entityType, useRealtime) {
        const message = { rawtext: [] };
        message.rawtext.push(this.getHeaderMessage(useRealtime));
        message.rawtext.push({ text: '\n' });
        message.rawtext.push({ translate: 'commands.lifetime.query.entity', with: { rawtext: [{ translate: this.getLocalizationKey(entityType)}] } });
        for (const dimensionId in Object.keys(this.dimensionToEntityLifetimeRecordMap)) {
            message.rawtext.push(this.getDimensionHeaderMessage(dimensionId, useRealtime));
            message.rawtext.push(this.dimensionToEntityLifetimeRecordMap[dimensionId].getQueryMessage(entityType, useRealtime));
        }
    }

    getHeaderMessage(useRealtime) {
        const message = { rawtext: [{ translate: 'commands.lifetime.query.header', with: [this.getElapsedMin(useRealtime)] }] };
        message.rawtext.push({ translate: `commands.lifetime.query.${useRealtime ? 'realtime' : 'ticktime'}` });
        return message;
    }

    getDimensionHeaderMessage(dimensionId, useRealtime) {
        const dimensionLifetimeRecords = this.dimensionToEntityLifetimeRecordMap[dimensionId];
        if (!dimensionLifetimeRecords)
            throw new Error(`[Canopy] No entity lifetime information available for dimension '${dimensionId}'`);
        const totalSpawns = dimensionLifetimeRecords.getTotalSpawns();
        const totalRemovals = dimensionLifetimeRecords.getTotalRemovals();
        const spawnsPerHour = this.calcPerHour(totalSpawns, useRealtime).toFixed(2);
        const removalsPerHour = this.calcPerHour(totalRemovals, useRealtime).toFixed(2);
        return { translate: 'commands.lifetime.query.dimensionheader', with: [getColoredDimensionName(dimensionId), String(totalSpawns), String(spawnsPerHour), String(totalRemovals), String(removalsPerHour)] };
    }

    calcPerHour(value, useRealtime) {
        let ticks;
        if (useRealtime)
            ticks = this.getElapsedMs() / (1000 / TicksPerSecond);
        else
            ticks = this.getElapsedTicks();
        return value / (ticks * 3600);
    }

    getElapsedTicks() {
        return (this.isCollecting ? system.currentTick : this.stopTick) - this.startTick;
    }

    getElapsedMs() {
        return (this.isCollecting ? Date.now() : this.stopDate) - this.startDate;
    }

    getElapsedMin(useRealtime) {
        return (useRealtime ? this.getElapsedMs() / 1000 : this.getElapsedTicks() / TicksPerSecond) / 60;
    }

    getLocalizationKey(entityType) {
        return this.localizationKeys[entityType];
    }
    
    createDimensionRecords() {
        const dimensionIds = DimensionTypes.getAll().map(dimensionType => dimensionType.typeId);
        for (const dimensionId of dimensionIds) {
            if (Object.keys(this.dimensionToEntityLifetimeRecordMap).includes(dimensionId))
                continue;
            this.dimensionToEntityLifetimeRecordMap[dimensionId] = new EntityLifetimeRecords(this, dimensionId);
        }
    }

    subscribeToEvents() {
        world.afterEvents.entitySpawn.subscribe(this.onEntitySpawnBound);
        world.afterEvents.entityLoad.subscribe(this.onEntityLoadBound);
        world.afterEvents.entityDie.subscribe(this.onEntityDieBound);
        world.beforeEvents.entityRemove.subscribe(this.onEntityRemoveBound);
    }

    unsubscribeFromEvents() {
        world.afterEvents.entitySpawn.unsubscribe(this.onEntitySpawnBound);
        world.afterEvents.entityLoad.unsubscribe(this.onEntityLoadBound);
        world.afterEvents.entityDie.unsubscribe(this.onEntityDieBound);
        world.beforeEvents.entityRemove.unsubscribe(this.onEntityRemoveBound);
    }

    onEntitySpawn(event) {
        this.collectSpawn(event);
    }

    onEntityLoad(event) {
        event.cause = EntityInitializationCause.Loaded
        this.collectSpawn(event);
    }

    onEntityDie(event) {
        event.entity = event.deadEntity;
        event.cause = event.damageSource.cause;
        this.collectRemoval(event);
    }

    onEntityRemove(event) {
        event.entity = event.removedEntity;
        event.cause = "Despawn";
        this.collectRemoval(event);
    }

    collectSpawn(event) {
        this.dimensionToEntityLifetimeRecordMap[event.entity.dimension.id].collectSpawn(event.entity, event.cause);
    }

    collectRemoval(event) {
        this.dimensionToEntityLifetimeRecordMap[event.entity.dimension.id].collectRemoval(event.entity, event.cause);
    }
}