import { Rule } from "../../../lib/canopy/Canopy";
import { system, world } from "@minecraft/server";
import CounterChannels from "../../classes/CounterChannels";
import { broadcastActionBar, getScriptEventSourceName, formatColorStr } from "../../../include/utils";

system.afterEvents.scriptEventReceive.subscribe(async (event) => {
    if (event.id !== 'canopy:counter') return;
    if (!await Rule.getValue('hopperCounters')) 
        return broadcastActionBar({ translate: 'rules.generic.blocked', with: ['hopperCounters'] });
    const sourceName = getScriptEventSourceName(event);
    const message = event.message;
    
    if (message === '') {
        world.getAllPlayers().forEach(player => { CounterChannels.getAllQueryOutput(player); });
    } else if (CounterChannels.isValidColor(message)) {
        world.getAllPlayers().forEach(player => { CounterChannels.getQueryOutput(player, message); });
    } else if (message === 'reset') {
        CounterChannels.resetAllCounts();
        broadcastActionBar({ translate: 'commands.counter.reset.all.actionbar', with: [sourceName] });
    }
    const args = message.split(' ');
    if (CounterChannels.isValidColor(args[0]) && args[1] === 'reset') {
        CounterChannels.resetCounts(args[0]);
        broadcastActionBar({ translate: 'commands.counter.reset.single.actionbar', with: [sourceName, formatColorStr(args[0])] });
    }
});