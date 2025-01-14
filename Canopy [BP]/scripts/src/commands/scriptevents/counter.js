import { system, world } from '@minecraft/server';
import { Rule } from 'lib/canopy/Canopy';
import { channelMap, formatColor, query, queryAll } from 'src/commands/counter';
import Utils from 'include/utils';

system.afterEvents.scriptEventReceive.subscribe(async (event) => {
    if (event.id !== 'canopy:counter') return;
    if (!await Rule.getValue('hopperCounters')) 
        return Utils.broadcastActionBar({ translate: 'rules.generic.blocked', with: ['hopperCounters'] });
    const sourceName = Utils.getScriptEventSourceName(event);
    const message = event.message;
    
    if (message === '') {
        world.getAllPlayers().forEach(player => { queryAll(player); });
    } else if (channelMap.colors.includes(message)) {
        world.getAllPlayers().forEach(player => { query(player, message); });
    } else if (message === 'reset') {
        channelMap.resetAll();
        Utils.broadcastActionBar({ translate: 'commands.counter.reset.all.actionbar', with: [sourceName] });
    }
    const args = message.split(' ');
    if (channelMap.colors.includes(args[0]) && args[1] === 'reset') {
        channelMap.reset(args[0]);
        Utils.broadcastActionBar({ translate: 'commands.counter.reset.single.actionbar', with: [sourceName, formatColor(args[0])] });
    }
});