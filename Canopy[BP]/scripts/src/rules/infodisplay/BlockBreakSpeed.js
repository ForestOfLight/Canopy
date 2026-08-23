import { system, world, TicksPerSecond } from '@minecraft/server';
import { InfoDisplayRule } from '../../../lib/canopy/Canopy';
import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

export class BlockBreakSpeed extends InfoDisplayTextElement {
    static getRuleIdentifier() {
        return 'blockBreakSpeed';
    }

    static TRACKED_TICK_COUNT = 100;
    static breakTicksByPlayerId = {};
    static isTracking = false;

    player;

    constructor(player, displayLine) {
        const trackedTickCount = BlockBreakSpeed.TRACKED_TICK_COUNT;
        const ruleData = {
            description: { translate: 'rules.infoDisplay.blockBreakSpeed', with: [String(trackedTickCount), String((trackedTickCount / TicksPerSecond).toFixed(0))] },
            wikiDescription: `Shows your average blocks broken per second over the last ${trackedTickCount} ticks (${(trackedTickCount / TicksPerSecond).toFixed(0)} seconds).`,
            onEnableCallback: () => BlockBreakSpeed.startTracking(),
            onDisableCallback: () => BlockBreakSpeed.stopTracking()
        };
        super(ruleData, displayLine);
        this.player = player;
    }

    static startTracking() {
        if (BlockBreakSpeed.isTracking)
            return;
        world.afterEvents.playerBreakBlock.subscribe(BlockBreakSpeed.onPlayerBreakBlock);
        world.beforeEvents.playerLeave.subscribe(BlockBreakSpeed.onPlayerLeave);
        BlockBreakSpeed.isTracking = true;
    }

    static stopTracking() {
        if (!BlockBreakSpeed.isTracking || BlockBreakSpeed.isEnabledForAnyPlayer())
            return;
        world.afterEvents.playerBreakBlock.unsubscribe(BlockBreakSpeed.onPlayerBreakBlock);
        world.beforeEvents.playerLeave.unsubscribe(BlockBreakSpeed.onPlayerLeave);
        BlockBreakSpeed.breakTicksByPlayerId = {};
        BlockBreakSpeed.isTracking = false;
    }

    static isEnabledForAnyPlayer() {
        const rule = InfoDisplayRule.get(BlockBreakSpeed.getRuleIdentifier());
        return world.getAllPlayers().some(player => rule?.getValue(player));
    }

    static onPlayerBreakBlock(event) {
        const playerId = event.player?.id;
        if (!playerId)
            return;
        BlockBreakSpeed.getTrackedBreakTicks(playerId).push(system.currentTick);
    }

    static onPlayerLeave(event) {
        if (!event.player)
            return;
        delete BlockBreakSpeed.breakTicksByPlayerId[event.player.id];
    }

    static getTrackedBreakTicks(playerId) {
        const breakTicks = BlockBreakSpeed.breakTicksByPlayerId[playerId] ?? [];
        BlockBreakSpeed.breakTicksByPlayerId[playerId] = breakTicks;
        const oldestTrackedTick = system.currentTick - BlockBreakSpeed.TRACKED_TICK_COUNT;
        while (breakTicks.length > 0 && breakTicks[0] <= oldestTrackedTick)
            breakTicks.shift();
        return breakTicks;
    }

    getFormattedDataOwnLine() {
        return { translate: `rules.infoDisplay.blockBreakSpeed.display`, with: [String(this.#getAverageBlocksBrokenPerSecond().toFixed(1))] };
    }

    getFormattedDataSharedLine() {
        return { text: `§cBlockBreakSpeed should always be on its own InfoDisplay line.§r` };
    }

    #getAverageBlocksBrokenPerSecond() {
        const blocksBrokenInTrackedTicks = BlockBreakSpeed.getTrackedBreakTicks(this.player.id).length;
        const trackedSeconds = BlockBreakSpeed.TRACKED_TICK_COUNT / TicksPerSecond;
        return blocksBrokenInTrackedTicks / trackedSeconds;
    }
}
