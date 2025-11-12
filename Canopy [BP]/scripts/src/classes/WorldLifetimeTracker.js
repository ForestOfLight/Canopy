import { system, TicksPerSecond, world } from "@minecraft/server";
import { getColoredDimensionName } from "../../include/utils";

export class WorldLifetimeTracker {
    startTick;
    startDate;
    dimensionalEntityLifetimes = {};

    constructor() {
        this.startTick = system.currentTick;
        this.startDate = Date.now();
        this.subscribeToEvents();
    }

    destroy() {
        this.unsubscribeFromEvents();
        Object.values(this.dimensionalEntityLifetimes).forEach((lifetime) => lifetime.destroy());
        this.dimensionalEntityLifetimes = {};
    }

    subscribeToEvents() {

    }

    unsubscribeFromEvents() {

    }

    getQueryAllMessage(useRealtime) {
        const message = { rawtext: [] };
        message.rawtext.push(this.getHeaderMessage(useRealtime));
        message.rawtext.push({ text: '\n' });
        for (const dimensionId in Object.keys(this.dimensionalEntityLifetimes)) {
            message.rawtext.push(this.getDimensionHeaderMessage(dimensionId, useRealtime));
            for (const dimensionalEntityLifetime in this.dimensionalEntityLifetimes[dimensionId]) {
                message.rawtext.push({ text: '\n' });
                message.rawtext.push(dimensionalEntityLifetime.getShortMessage());
            }
        }
    }

    getQueryEntityMessage(entityType, useRealtime) {
        const message = { rawtext: [] };
        message.rawtext.push(this.getHeaderMessage(useRealtime));
        message.rawtext.push({ text: '\n' });
        for (const dimensionId in Object.keys(this.dimensionalEntityLifetimes)) {
            message.rawtext.push(this.getDimensionHeaderMessage(dimensionId, useRealtime));
            message.rawtext.push(this.dimensionalEntityLifetimes[dimensionId].getEntityQueryMessage(entityType, useRealtime));
        }
    }

    getHeaderMessage(useRealtime) {
        const message = { rawtext: [{ translate: 'commands.lifetime.query.header', with: [this.getElapsedMin(useRealtime)] }] };
        if (useRealtime)
            message.rawtext.push({ translate: 'commands.lifetime.query.realtime' });
        return message;
    }

    getDimensionHeaderMessage(dimensionId, useRealtime) {
        const dimensionLifetimes = this.dimensionalEntityLifetimes[dimensionId];
        if (!dimensionLifetimes)
            throw new Error(`[Canopy] No entity lifetime information available for dimension '${dimensionId}'`);
        const totalSpawns = dimensionLifetimes.getTotalSpawns();
        const totalRemovals = dimensionLifetimes.getTotalRemovals();
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
        return system.currentTick - this.startTick;
    }

    getElapsedMs() {
        return Date.now() - this.startDate;
    }

    getElapsedMin(useRealtime) {
        return (useRealtime ? this.getElapsedMs() / 1000 : this.getElapsedTicks() / TicksPerSecond) / 60;
    }
}