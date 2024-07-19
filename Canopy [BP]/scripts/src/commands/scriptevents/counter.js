import { system, world } from '@minecraft/server';
import { channelMap, formatColor, query, queryAll } from 'src/commands/counter';
import Utils from 'stickycore/utils';

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== 'canopy:counter') return;
    if (!world.getDynamicProperty('hopperCounters')) return Utils.broadcastActionBar('§cThe hopperCounters feature is disabled.');
    const sourceName = Utils.getScriptEventSourceName(event);
    const message = event.message;
    
    if (message === '') {
        world.getAllPlayers().forEach(player => { queryAll(player); });
    } else if (channelMap.colors.includes(message)) {
        world.getAllPlayers().forEach(player => { query(player, message); });
    } else if (message === 'reset') {
        channelMap.resetAll();
        Utils.broadcastActionBar(`§c[${sourceName}] Reset all hopper counters.`);
    }
    const args = message.split(' ');
    if (channelMap.colors.includes(args[0]) && args[1] === 'reset') {
        channelMap.reset(args[0]);
        Utils.broadcastActionBar(`§c[${sourceName}] Reset ${formatColor(args[0])}§c hopper counter.`);
    }
});