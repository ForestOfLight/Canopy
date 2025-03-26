import { system, TicksPerSecond, world } from "@minecraft/server";
import { locationInArea } from "../../include/utils";
import { categoryToMobMap } from "../../include/data";

const CLEAR_RECENTS_THRESHOLD = 30 * TicksPerSecond;
let wasTrackingLastTick = false;

class SpawnTracker {
    constructor(dimensionId, mobIds = [], activeArea = null ) {
        this.dimensionId = dimensionId;
        this.mobs = mobIds || [];
        this.category = this.getCategory();
        this.activeArea = activeArea || null;
        this.spawns = {};
        this.recents = {};
        this.mobsPerTick = {};
        this.recentsClearRunner = null;
        this.startTick = system.currentTick;
        this.startTracking();
    }

    getCategory() {
        for (const [category, mobs] of Object.entries(categoryToMobMap)) {
            for (const mob of this.mobs) {
                if (mobs.includes(mob))
                    return category;
            }
        }
        return null;
    }

    getMobsPerTickMap() {
        return this.mobsPerTick;
    }

    startTracking() {
        this.recentsClearRunner = system.runInterval(() => {
            this.clearOldMobs(CLEAR_RECENTS_THRESHOLD);
        });
        world.setDynamicProperty('isTrackingSpawns', true)
        wasTrackingLastTick = true;
    }

    stopTracking() {
        system.clearRun(this.recentsClearRunner);
        world.setDynamicProperty('isTrackingSpawns', false);
        wasTrackingLastTick = false;
    }

    recieveMob(entity) {
        if (!world.getDynamicProperty('isTrackingSpawns') && wasTrackingLastTick) this.stopTracking();
        else if (!world.getDynamicProperty('isTrackingSpawns')) return;
        if (!entity.isValid) return;
        if (entity.dimension.id !== this.dimensionId || !this.isTracking(entity.typeId.replace('minecraft:', ''))) return;

        const position = { location: entity.location, dimensionId: entity.dimension.id };
        if (this.activeArea && !locationInArea(this.activeArea, position)) return;
        this.countMob(entity);
    }

    isTracking(mobname) {
        if (!this.category) return this.mobs.includes(mobname);
        return categoryToMobMap[this.category].includes(mobname);
    }

    countMob(entity) {
        const currentTick = system.currentTick;
        this.spawns[entity.typeId] = this.spawns[entity.typeId] ? this.spawns[entity.typeId] + 1 : 1;

        const timedLocation = { location: entity.location, time: currentTick };
        if (this.recents[entity.typeId])
            this.recents[entity.typeId] = [...this.recents[entity.typeId], timedLocation];
        else
            this.recents[entity.typeId] = [timedLocation];

        this.mobsPerTick[currentTick] = this.mobsPerTick[currentTick] ? this.mobsPerTick[currentTick] + 1 : 1;
    }

    clearOldMobs(tickThreshold) {
        for (const mobType in this.recents) 
            this.recents[mobType] = this.recents[mobType].filter((timedLocation) => system.currentTick - timedLocation.time < tickThreshold);
        
    }

    reset() {
        this.startTick = system.currentTick;
        this.spawns = {};
        this.recents = {};
        this.mobsPerTick = {};
    }

    calcAvgMobsPerSecond() {
        const ticksSinceStart = system.currentTick - this.startTick;
        if (ticksSinceStart === 0) return 0;
        return (this.getTotalMobs() / ticksSinceStart) * 20;
    }

    calcSpawnSuccessPercent() {
        const ticksSinceStart = system.currentTick - this.startTick;
        if (ticksSinceStart === 0) return 0;
        return (Object.keys(this.mobsPerTick).length / ticksSinceStart) * 100;
    }

    calcAvgMobsPerSuccessTick() {
        const mptLength = Object.keys(this.mobsPerTick).length;
        if (mptLength === 0) return 0;
        return this.getTotalMobs() / mptLength;
    }

    getTotalSpawns(mobname) {
        return this.spawns[mobname] || 0;
    }

    calcSpawnsPerHr(mobname) {
        const ticksSinceStart = system.currentTick - this.startTick;
        if (ticksSinceStart === 0) return 0;
        return (this.spawns[mobname] / ticksSinceStart) * 72000;
    }

    getRecents() {
        const recents = {};
        for (const mobType in this.recents) 
            recents[mobType] = this.recents[mobType].map((timedLocation) => timedLocation.location);
        
        return recents;
    }

    getOutput() {
        if (Object.keys(this.spawns).length === 0) return '';
        let output = '\n§7 > ';
        if (this.category) output += `${this.category.toUpperCase()}`;
        else output += `TRACKED`;
        output += `: ${this.getFormattedCategoryHeader()}`;

        for (let mobname of this.mobs) {
            mobname = 'minecraft:' + mobname;
            const totalSpawns = this.getTotalSpawns(mobname);
            if (totalSpawns === 0) continue;
            output += `\n§7  - ${mobname.replace('minecraft:', '')}: §f${totalSpawns}§7 spawns, §f${this.calcSpawnsPerHr(mobname).toFixed(1)}§7/hr`;
        }
        return output
    }

    getFormattedCategoryHeader() {
        const totalMobs = this.getTotalMobs();
        const mobsPerSecond = this.calcAvgMobsPerSecond().toFixed(1);
        const successSpawnsPercent = (this.calcSpawnSuccessPercent()).toFixed(1);
        const unsuccessSpawnsPercent = (100 - successSpawnsPercent).toFixed(1);
        const avgMobsPerSuccessTick = this.calcAvgMobsPerSuccessTick().toFixed(1);

        return `§f${totalMobs}§7 spawns (§f${mobsPerSecond}§7m/s, (§f${unsuccessSpawnsPercent}§7%%- / §f${successSpawnsPercent}§7%%+): §f${avgMobsPerSuccessTick}§7m/att)`;
    }

    getTotalMobs() {
        return Object.values(this.mobsPerTick).reduce((acc, tick) => acc + tick, 0);
    }
}

export { SpawnTracker }