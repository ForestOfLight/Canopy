import { system, world } from '@minecraft/server'
import Utils from 'stickycore/utils'

const categoryToMobMap = {
    'creature' : [
        'allay',
        'armadillo',
        'bee',
        'camel',
        'cat',
        'chicken',
        'cow',
        'donkey',
        'fox',
        'frog',
        'goat',
        'horse',
        'llama',
        'mooshroom',
        'mule',
        'npc',
        'ocelot',
        'panda',
        'parrot',
        'pig',
        'player',
        'polar_bear',
        'rabbit',
        'sheep',
        'skeleton_horse',
        'sniffer',
        'strider',
        'tadpole',
        'trader_llama',
        'turtle',
        'wandering_trader',
        'wolf',
        'zombie_horse',
    ],
    'axolotls' : [ 'axolotl' ],
    'ambient' : [ 'bat' ],
    'monster' : [
        'blaze',
        'bogged',
        'breeze',
        'cave_spider',
        'creeper',
        'drowned',
        'elder_guardian',
        'ender_dragon',
        'enderman',
        'endermite',
        'evokcation_illager',
        'ghast',
        'guardian',
        'hoglin',
        'husk',
        'magma_cube',
        'phantom',
        'piglin_brute',
        'piglin',
        'pillager',
        'ravager',
        'shulker',
        'silverfish',
        'skeleton',
        'slime',
        'spider',
        'stray',
        'vex',
        'vindicator',
        'warden',
        'witch',
        'wither_skeleton',
        'wither',
        'zoglin',
        'zombie_villager',
        'zombie',
    ],
    'water_creature' : [
        'dolphin',
        'squid',
    ],
    'water_ambient' : [
        'cod',
        'pufferfish',
        'salmon',
        'tropicalfish',
    ],
    'underground_water_creature' : [
        'glow_squid',
    ],
    'misc' : [
        'llama_spit',
    ],
    'other' : [
        'iron_golem',
        'lightning_bolt',
        'snow_golem',
        'villager_v2',
        'villager',
        'zombie_pigman',
        'zombie_villager_v2',
    ],
}

const CLEAR_RECENTS_THRESHOLD = 600; // 600 ticks = 30 seconds
const wasTrackingLastTick = false;

world.afterEvents.entitySpawn.subscribe((event) => {
    if (!world.getDynamicProperty('isTrackingSpawns') && wasTrackingLastTick) this.stopTracking();
    else if (!world.getDynamicProperty('isTrackingSpawns')) return;
    const entity = event.entity; 
    if (entity.dimension.id !== this.dimensionId || !this.mobs.includes(entity.typeId.replace('minecraft:', ''))) return;
    if (this.activeArea && !Utils.locationInArea(this.activeArea, { location: entity.location, dimensionId: entity.dimension.id })) return;
    this.countMob(entity);
});

class SpawnTracker {
    constructor(dimensionId, category = null, mobIds = [], activeArea = null) {
        if (category !== null && mobIds.length > 0) {
            throw new Error("SpawnTracker constructor should be called with either 'category' or 'mobIds', but not both.");
        }

        this.category = category;
        this.dimensionId = dimensionId;
        this.startTick = system.currentTick;
        this.activeArea = activeArea;
        this.spawns = {};
        this.recents = {};
        this.mobsPerTick = {};
        this.recentsClearRunner = null;
        this.mobs = category ? categoryToMobMap[category] : mobIds;
        this.startTracking();
    }

    getMobsPerTickMap() {
        return this.mobsPerTick;
    }

    startTracking() {
        this.recentsClearRunner = system.runInterval(() => {
            this.clearOldMobs(CLEAR_RECENTS_THRESHOLD);
        });
        wasTrackingLastTick = true;
    }

    stopTracking() {
        system.clearRun(this.recentsClearRunner);
        wasTrackingLastTick = false;
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
        for (const mobType in this.recents) {
            this.recents[mobType] = this.recents[mobType].filter((timedLocation) => {
                return system.currentTick - timedLocation.time < tickThreshold;
            });
        }
    }

    reset() {
        this.startTick = system.currentTick;
        this.spawns = {};
        this.recents = {};
        this.mobsPerTick = {};
    }

    calcMobsPerTick() {
        const ticksSinceStart = system.currentTick - this.startTick;
        if (ticksSinceStart === 0) return 0;
        return Object.keys(this.mobsPerTick).reduce((acc, tick) => acc + this.mobsPerTick[tick], 0) / ticksSinceStart;
    }

    calcSuccessTickPercent() {
        const ticksSinceStart = system.currentTick - this.startTick;
        if (ticksSinceStart === 0) return 0;
        return this.mobsPerTick.length / ticksSinceStart;
    }

    calcMobsPerSuccessTick() {
        const mptLength = Object.keys(this.mobsPerTick).length;
        if (mptLength === 0) return 0;
        return (this.mobsPerTick.reduce((acc, tick) => acc + this.mobsPerTick[tick], 0) / mptLength) * 100;
    }

    getTotalSpawns(mobname) {
        return this.spawns[mobname] || 0;
    }

    calcSpawnsPerHr(mobname) {
        const currentTick = system.currentTick;
        const ticksSinceStart = currentTick - this.startTick;
        if (ticksSinceStart === 0) return 0;
        return (this.spawns[mobname] / ticksSinceStart) * 72000;
    }

    getRecents() {
        const recents = {};
        for (const mobType in this.recents) {
            recents[mobType] = this.recents[mobType].map((timedLocation) => timedLocation.location);
        }
        return recents;
    }

    getOutput() {
        if (this.mobs.length === 0) return '';
        let output = '§7 > ';
        if (!this.category) output += `${this.category.toUpperCase()}`;
        else output += `TRACKED`;
        output += `: ${this.getFormattedCategoryHeader()}`;

        for (const mobname of this.mobs) {
            output += `\n§7  - ${mobname}: §f${this.getTotalSpawns(mobname)}§7 spawns, §f${this.calcSpawnsPerHr(mobname).toFixed(1)}§7/hr`;
        }
        return output
    }

    getFormattedCategoryHeader() {
        const mobsPerTick = this.calcMobsPerTick().toFixed(1);
        const successSpawnsPercent = Math.round(this.calcSuccessTickPercent());
        const unsuccessSpawnsPercent = 100 - successSpawnsPercent;
        const avgMobsPerSuccessTick = this.calcMobsPerSuccessTick().toFixed(1);

        return `§f${mobsPerTick}§7 m/t, (§f${this.calcSuccessTickPercent()}%§7- / §f${unsuccessSpawnsPercent}%§7+): §f${avgMobsPerSuccessTick}§7 m/att`;
    }
}

export default SpawnTracker