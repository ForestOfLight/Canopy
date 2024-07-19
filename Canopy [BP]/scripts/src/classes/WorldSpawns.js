import { world, DimensionTypes, MolangVariableMap, system } from '@minecraft/server';
import { categoryToMobMap, SpawnTracker } from 'src/classes/SpawnTracker';
import Utils from 'stickycore/utils';

const categories = Object.keys(categoryToMobMap);
const dimensionIds = DimensionTypes.getAll().map(({ typeId }) => typeId);

class WorldSpawns {
    constructor(mobIds = [], activeArea = null) {
        this.activeArea = activeArea;
        this.areaHighlightRunner = null;
        this.trackers = {};
        this.startTick = system.currentTick;
        if (activeArea !== null) this.highlightActiveArea();
        if (mobIds.length > 0) this.trackMobs(mobIds);
        else this.trackAll();
    }

    destruct() {
        if (this.areaHighlightRunner) system.clearRun(this.areaHighlightRunner);
        Object.values(this.trackers).forEach(dimensionTracker => {
            Object.values(dimensionTracker).forEach(tracker => {
                tracker.stopTracking();
            });
        });
    }

    sendMobToTrackers(entity) {
        for (const dimensionId in this.trackers) {
            for (const category in this.trackers[dimensionId]) {
                this.trackers[dimensionId][category].recieveMob(entity);
            }
        }
    }

    highlightActiveArea() {
        this.traceAreaEdges(this.activeArea);
        this.areaHighlightRunner = system.runInterval(() => {
            this.traceAreaEdges(this.activeArea);
        }, 25);
    }

    traceAreaEdges(activeArea) {
        const { posOne, posTwo, dimensionId } = activeArea;
        const startPos = { x: Math.min(posOne.x, posTwo.x), y: Math.min(posOne.y, posTwo.y), z: Math.min(posOne.z, posTwo.z) };
        const endPos = { x: Math.max(posOne.x, posTwo.x), y: Math.max(posOne.y, posTwo.y), z: Math.max(posOne.z, posTwo.z) };
        const edges = [
            ['x', startPos.x, endPos.x, 'y', 'z'],
            ['y', startPos.y, endPos.y, 'x', 'z'],
            ['z', startPos.z, endPos.z, 'x', 'y']
        ];
    
        edges.forEach(([axis, start, end, fixed1, fixed2]) => {
            [startPos[fixed1], endPos[fixed1]].forEach(fixed1Value => {
                [startPos[fixed2], endPos[fixed2]].forEach(fixed2Value => {
                    for (let pos = start; pos <= end; pos++) {
                        const coordinates = { [axis]: pos, [fixed1]: fixed1Value, [fixed2]: fixed2Value };
                        if (axis !== 'x' && (pos === start || pos === end)) continue;
                        try{
                            world.getDimension(dimensionId).spawnParticle('minecraft:villager_happy', coordinates, new MolangVariableMap());
                        } catch(error) {
                            if (!error.message.includes('Trying to access')) console.warn(error.message);
                        }
                    }
                });
            });
        });
    }

    trackAll() {
        dimensionIds.forEach(dimensionId => {
            this.trackers[dimensionId] = {};
            categories.forEach(category => {
                this.trackers[dimensionId][category] = new SpawnTracker(dimensionId, category, [], this.activeArea);
            });
        });
    }

    trackMobs(mobIds) {
        dimensionIds.forEach(dimensionId => {
            this.trackers[dimensionId] = this.trackers[dimensionId] || {};
            this.trackers[dimensionId]['custom'] = new SpawnTracker(dimensionId, null, mobIds, this.activeArea);
        });
    }

    reset() {
        this.startTick = system.currentTick;
        Object.values(this.trackers).forEach(dimensionTracker => {
            Object.values(dimensionTracker).forEach(tracker => {
                tracker.reset();
            });
        });
    }

    getRecentsOutput(mobname = null) {
        let output = `Recent spawns (last 30s):`;
        let recents = this.getRecents(mobname);
        for (const dimensionId in recents) {
            output += `\n${Utils.getColoredDimensionName(dimensionId)}§7:`;
            for (const category in recents[dimensionId]) {
                if (Object.keys(recents[dimensionId][category]).length === 0) continue;
                output += `\n§7 > ${category.toUpperCase()}:`;
                for (const mobname in recents[dimensionId][category]) {
                    const recentLocations = recents[dimensionId][category][mobname].map(location => Utils.stringifyLocation(location)).join(', ')
                    output += `\n§7  - ${mobname}: ${recentLocations}`;
                }
            }
        }
        return output;
    }

    getRecents(mobname) {
        let recents = {};
        for (const dimensionId in this.trackers) {
            recents[dimensionId] = {};
            for (const category in this.trackers[dimensionId]) {
                const tracker = this.trackers[dimensionId][category];
                if (mobname) recents[dimensionId][category] = tracker.getRecents()[mobname];
                else recents[dimensionId][category] = tracker.getRecents();
            }
        }
        return recents;
    }

    getOutput() {
        let output = `Spawn statistics (${this.getMinutesSinceStart().toFixed(2)} min.):`;
        for (const dimensionId in this.trackers) {
            if (this.getTotalMobs(this.getMobsPerTick(dimensionId)) === 0) continue;
            output += `\n${Utils.getColoredDimensionName(dimensionId)}§7: ${this.getFormattedDimensionValues(dimensionId)}`;
            for (const category in this.trackers[dimensionId]) {
                const tracker = this.trackers[dimensionId][category];
                output += `${tracker.getOutput()}`;
            }
        }
        return output;
    }

    getMinutesSinceStart() {
        const deltaTime = system.currentTick - this.startTick
        return (Math.floor(deltaTime / 8) * 8) / 1200;
    }

    getFormattedDimensionValues(dimensionId) {
        const mobsPerTick = this.getMobsPerTick(dimensionId);
        const avgMobsPerTick = this.getAvgMobsPerSecond(mobsPerTick).toFixed(1);
        const successSpawnsPercent = (this.getSpawnSuccessPercent(mobsPerTick)).toFixed(1);
        const unsuccessSpawnsPercent = (100 - parseFloat(successSpawnsPercent)).toFixed(1);
        const avgMobsPerSuccessTick = this.getAvgMobsPerSuccessTick(mobsPerTick).toFixed(1);

        return `§7(§f${avgMobsPerTick}§7m/s, (§f${unsuccessSpawnsPercent}§7%%- / §f${successSpawnsPercent}§7%%+): §f${avgMobsPerSuccessTick}§7m/att)`;
    }

    getMobsPerTick(dimensionId) {
        const mobsPerTick = [];
        for (const category in this.trackers[dimensionId]) {
            const tracker = this.trackers[dimensionId][category];
            const trackerMobsPerTick = tracker.getMobsPerTickMap();
            for (const tick in trackerMobsPerTick)
                mobsPerTick[tick] = mobsPerTick[tick] ? mobsPerTick[tick] + trackerMobsPerTick[tick] : trackerMobsPerTick[tick];
        }
        return mobsPerTick;
    }

    getAvgMobsPerSecond(dimensionMobsPerTick) {
        const ticksSinceStart = system.currentTick - this.startTick;
        if (ticksSinceStart === 0) return 0;
        return (this.getTotalMobs(dimensionMobsPerTick) / ticksSinceStart) * 20;
    }

    getSpawnSuccessPercent(dimensionMobsPerTick) {
        const ticksSinceStart = system.currentTick - this.startTick;
        if (ticksSinceStart === 0) return 0;
        return (Object.keys(dimensionMobsPerTick).length / ticksSinceStart) * 100;
    }

    getAvgMobsPerSuccessTick(dimensionMobsPerTick) {
        const mptLength = Object.keys(dimensionMobsPerTick).length;
        if (mptLength === 0) return 0;
        return this.getTotalMobs(dimensionMobsPerTick) / mptLength;
    }

    getTotalMobs(dimensionMobsPerTick) {
        return Object.keys(dimensionMobsPerTick).reduce((acc, tick) => acc + dimensionMobsPerTick[tick], 0);
    }
}

export default WorldSpawns;