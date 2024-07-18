import { system } from '@minecraft/server';
import { worldSpawns } from 'src/commands/spawn';
import { channelMap } from 'src/commands/counter';
import Utils from 'stickycore/utils';

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== 'canopy:spawn') return;
    
    const sourceName = Utils.getScriptEventSourceName(event);
    const message = event.message;
    if (message === 'test') {
        resetSpawnsAndCounters();
    }
});

function resetSpawnsAndCounters() {
    if (worldSpawns === null) return Utils.broadcastActionBar('§cCould not reset. Spawns are not currently being tracked.');
    worldSpawns.reset();
    channelMap.resetAll();
    Utils.broadcastActionBar(`§7[${sourceName}] Reset all spawn and hopper counters.`);
}