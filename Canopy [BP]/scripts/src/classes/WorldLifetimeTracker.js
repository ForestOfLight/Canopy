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
        message.rawtext.push({ text: '\n' });
        message.rawtext.push(this.getHeaderMessage(useRealtime));
        for (const dimensionId of Object.keys(this.dimensionToEntityLifetimeRecordMap)) {
            message.rawtext.push({ text: '\n' });
            message.rawtext.push(this.getDimensionHeaderMessage(dimensionId, useRealtime));
            message.rawtext.push(this.dimensionToEntityLifetimeRecordMap[dimensionId].getQueryAllMessage(useRealtime));
        }
        return message;
    }

    getQueryEntityMessage(entityType, queryType, useRealtime) {
        const message = { rawtext: [] };
        message.rawtext.push(this.getHeaderMessage(useRealtime));
        message.rawtext.push({ text: '\n' });
        message.rawtext.push({ translate: 'commands.lifetime.query.entity', with: { rawtext: [{ translate: this.getLocalizationKey(entityType)}] } });
        for (const dimensionId of Object.keys(this.dimensionToEntityLifetimeRecordMap)) {
            message.rawtext.push({ text: '\n' });
            message.rawtext.push(this.getDimensionHeaderMessage(dimensionId, useRealtime));
            message.rawtext.push({ text: '\n' });
            message.rawtext.push(this.dimensionToEntityLifetimeRecordMap[dimensionId].getQueryMessage(entityType, queryType, useRealtime));
        }
        return message;
    }

    getHeaderMessage(useRealtime) {
        const message = { rawtext: [{ translate: 'commands.lifetime.query.header', with: [this.getElapsedMin(useRealtime).toFixed(2)] }] };
        message.rawtext.push({ translate: `commands.lifetime.query.${useRealtime ? 'realtime' : 'ticktime'}` });
        return message;
    }

    getDimensionHeaderMessage(dimensionId, useRealtime) {
        const dimensionLifetimeRecords = this.dimensionToEntityLifetimeRecordMap[dimensionId];
        if (!dimensionLifetimeRecords?.hasRecords())
            return { text: '' };
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
        return this.localizationKeys[entityType] || 'commands.lifetime.query.entity.unknowntype';
    }
    
    createDimensionRecords() {
        this.dimensionToEntityLifetimeRecordMap["minecraft:overworld"] = new EntityLifetimeRecords(this, "minecraft:overworld");
        this.dimensionToEntityLifetimeRecordMap["minecraft:nether"] = new EntityLifetimeRecords(this, "minecraft:nether");
        this.dimensionToEntityLifetimeRecordMap["minecraft:the_end"] = new EntityLifetimeRecords(this, "minecraft:the_end");
        const dimensionIds = DimensionTypes.getAll().map(dimensionType => dimensionType.typeId);
        for (const dimensionId of dimensionIds) {
            if (Object.keys(this.dimensionToEntityLifetimeRecordMap).includes(dimensionId))
                continue;
            this.dimensionToEntityLifetimeRecordMap[dimensionId] = new EntityLifetimeRecords(this, dimensionId);
        }
    }

    subscribeToEvents() {
        world.afterEvents.entitySpawn.subscribe(this.onEntitySpawn.bind(this));
        world.afterEvents.entityLoad.subscribe(this.onEntityLoad.bind(this));
        world.afterEvents.entityDie.subscribe(this.onEntityDie.bind(this));
        world.beforeEvents.entityRemove.subscribe(this.onEntityRemove.bind(this));
    }

    unsubscribeFromEvents() {
        world.afterEvents.entitySpawn.unsubscribe(this.onEntitySpawn.bind(this));
        world.afterEvents.entityLoad.unsubscribe(this.onEntityLoad.bind(this));
        world.afterEvents.entityDie.unsubscribe(this.onEntityDie.bind(this));
        world.beforeEvents.entityRemove.unsubscribe(this.onEntityRemove.bind(this));
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
        this.localizationKeys[event.entity.typeId] = event.entity.localizationKey;
        this.dimensionToEntityLifetimeRecordMap[event.entity.dimension.id].collectSpawn(event.entity, event.cause);
    }

    collectRemoval(event) {
        this.localizationKeys[event.entity.typeId] = event.entity.localizationKey;
        this.dimensionToEntityLifetimeRecordMap[event.entity.dimension.id].collectRemoval(event.entity, event.cause);
    }
}