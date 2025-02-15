import { Rule } from "../../../lib/canopy/Canopy";
import { system, world } from "@minecraft/server";
import GeneratorChannels from "../../classes/GeneratorChannels";
import { broadcastActionBar, getScriptEventSourceName, formatColorStr } from "../../../include/utils";

system.afterEvents.scriptEventReceive.subscribe(async (event) => {
    if (event.id !== 'canopy:generator') return;
    if (!await Rule.getValue('hopperGenerators'))
        return broadcastActionBar({ translate: 'rules.generic.blocked', with: ['hopperGenerators'] });
    const sourceName = getScriptEventSourceName(event);
    const message = event.message;
    
    if (message === '') {
        world.getAllPlayers().forEach(player => { GeneratorChannels.getAllQueryOutput(player); });
    } else if (GeneratorChannels.isValidColor(message)) {
        world.getAllPlayers().forEach(player => { GeneratorChannels.getQueryOutput(player, message); });
    } else if (message === 'reset') {
        GeneratorChannels.resetAllCounts();
        broadcastActionBar({ translate: 'commands.generator.reset.all.actionbar', with: [sourceName] });
    }
    const args = message.split(' ');
    if (GeneratorChannels.isValidColor(args[0]) && args[1] === 'reset') {
        GeneratorChannels.resetCounts(args[0]);
        broadcastActionBar({ translate: 'commands.generator.reset.single.actionbar', with: [sourceName, formatColorStr(args[0])] });
    }
});