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

    onEntitySpawnBound = this.onEntitySpawn.bind(this);
    onEntityLoadBound = this.onEntityLoad.bind(this);
    onEntityItemDropBound = this.onEntityItemDrop.bind(this);
    onEntityDieBound = this.onEntityDie.bind(this);
    onEntityRemoveBound = this.onEntityRemove.bind(this);
    onEntityItemPickupBound = this.onEntityItemPickup.bind(this);

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
        message.rawtext.push(this.getHeaderMessage(useRealtime));
        for (const dimensionId of Object.keys(this.dimensionToEntityLifetimeRecordMap)) {
            if (!this.dimensionToEntityLifetimeRecordMap[dimensionId].hasRecords())
                continue;
            message.rawtext.push({ text: '\n' });
            message.rawtext.push(this.getDimensionHeaderMessage(dimensionId, false, useRealtime));
            message.rawtext.push(this.dimensionToEntityLifetimeRecordMap[dimensionId].getQueryAllMessage(useRealtime));
        }
        return message;
    }

    getQueryEntityMessage(entityType, queryType, useRealtime) {
        const message = { rawtext: [] };
        message.rawtext.push(this.getHeaderMessage(useRealtime));
        message.rawtext.push({ text: '\n' });
        message.rawtext.push({ translate: 'commands.lifetime.query.entity', with: { rawtext: [this.getLocalizationKeyRawMessage(entityType)] } });
        for (const dimensionId of Object.keys(this.dimensionToEntityLifetimeRecordMap)) {
            if (!this.dimensionToEntityLifetimeRecordMap[dimensionId].hasRecords())
                continue;
            message.rawtext.push({ text: '\n' });
            message.rawtext.push(this.getDimensionHeaderMessage(dimensionId, entityType, useRealtime));
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

    getDimensionHeaderMessage(dimensionId, entityType, useRealtime) {
        const dimensionLifetimeRecords = this.dimensionToEntityLifetimeRecordMap[dimensionId];
        if (!dimensionLifetimeRecords?.hasRecords())
            return { text: '' };
        const totalSpawns = dimensionLifetimeRecords.getTotalSpawns(entityType);
        const totalRemovals = dimensionLifetimeRecords.getTotalRemovals(entityType);
        const spawnsPerHour = this.calcPerHour(totalSpawns, useRealtime);
        const removalsPerHour = this.calcPerHour(totalRemovals, useRealtime);
        return { translate: 'commands.lifetime.query.dimensionheader', with: [getColoredDimensionName(dimensionId), String(totalSpawns), spawnsPerHour.toFixed(2), String(totalRemovals), removalsPerHour.toFixed(2)] };
    }

    calcPerHour(value, useRealtime) {
        const ticksPerHour = TicksPerSecond * 60 * 60;
        return value / (this.getElapsedTicks(useRealtime) / ticksPerHour);
    }

    getElapsedTicks(useRealtime) {
        if (useRealtime)
            return ((this.isCollecting ? Date.now() : this.stopDate) - this.startDate) / (1000 / TicksPerSecond)
        return (this.isCollecting ? system.currentTick : this.stopTick) - this.startTick;
    }

    getElapsedMin(useRealtime) {
        return (this.getElapsedTicks(useRealtime) / TicksPerSecond) / 60;
    }

    getLocalizationKeyRawMessage(entityType) {
        return this.localizationKeys[entityType] || { translate: 'commands.lifetime.query.entity.unknowntype' };
    }

    setLocalizationKey(entityType, localizationKey) {
        this.localizationKeys[entityType] = localizationKey;
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
        world.afterEvents.entitySpawn.subscribe(this.onEntitySpawnBound);
        world.afterEvents.entityLoad.subscribe(this.onEntityLoadBound);
        world.afterEvents.entityItemDrop.subscribe(this.onEntityItemDropBound);
        world.afterEvents.entityDie.subscribe(this.onEntityDieBound);
        world.beforeEvents.entityRemove.subscribe(this.onEntityRemoveBound);
        world.beforeEvents.entityItemPickup.subscribe(this.onEntityItemPickupBound)
    }

    unsubscribeFromEvents() {
        world.afterEvents.entitySpawn.unsubscribe(this.onEntitySpawnBound);
        world.afterEvents.entityLoad.unsubscribe(this.onEntityLoadBound);
        world.afterEvents.entityItemDrop.unsubscribe(this.onEntityItemDropBound);
        world.afterEvents.entityDie.unsubscribe(this.onEntityDieBound);
        world.beforeEvents.entityRemove.unsubscribe(this.onEntityRemoveBound);
        world.beforeEvents.entityItemPickup.unsubscribe(this.onEntityItemPickupBound);
    }

    onEntitySpawn(event) {
        event.priority = 2;
        this.collectSpawn(event);
    }

    onEntityLoad(event) {
        this.localizationKeys[event.entity.typeId] = event.entity.localizationKey;
        event.cause = EntityInitializationCause.Loaded;
        event.priority = 3;
        this.collectSpawn(event);
    }

    onEntityItemDrop(event) {
        for (let i = 0; i < event.items.length; i++) {
            const spawnEvent = {
                entity: event.items[i],
                cause: `Dropped by ${event.entity?.typeId || "unknown"}`,
                priority: 0
            };
            this.collectSpawn(spawnEvent);
        }
    }

    onEntityDie(event) {
        event.entity = event.deadEntity;
        event.cause = `Death §7(§f${event.damageSource.cause}§7)`;
        event.priority = 1;
        this.collectRemoval(event);
    }

    onEntityRemove(event) {
        event.entity = event.removedEntity;
        event.cause = "Despawn";
        event.priority = 2;
        this.collectRemoval(event);
    }

    onEntityItemPickup(event) {
        const removalEvent = {
            entity: event.item,
            cause: `Picked up by ${event.entity?.typeId || "unknown"}`,
            priority: 0
        };
        this.collectRemoval(removalEvent);
    }

    collectSpawn(event) {
        try {
            this.dimensionToEntityLifetimeRecordMap[event.entity.dimension.id].collectSpawn(event.entity, event.cause, event.priority ?? WorldLifetimeTracker.SPAWN_PRIORITY_GENERIC);
        } catch (error) {
            if (error.name === "InvalidActorError")
                console.warn('[Canopy] Entity was skipped because it was removed before its spawn data could be collected.');
            else
                throw error;
        }
    }

    collectRemoval(event) {
        this.dimensionToEntityLifetimeRecordMap[event.entity.dimension.id].collectRemoval(event.entity, event.cause, event.priority ?? WorldLifetimeTracker.REMOVAL_PRIORITY_GENERIC);
    }
}