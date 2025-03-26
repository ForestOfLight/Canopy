import { Rule } from "../../../lib/canopy/Canopy";
import { system, world } from "@minecraft/server";
import { generatorChannels } from "../../classes/GeneratorChannels";
import { broadcastActionBar, getScriptEventSourceName, formatColorStr } from "../../../include/utils";

system.afterEvents.scriptEventReceive.subscribe(async (event) => {
    if (event.id !== 'canopy:generator') return;
    if (!await Rule.getValue('hopperGenerators'))
        return broadcastActionBar({ translate: 'rules.generic.blocked', with: ['hopperGenerators'] });
    const sourceName = getScriptEventSourceName(event);
    const message = event.message;
    
    if (message === '') {
        world.getAllPlayers().forEach(player => { generatorChannels.getAllQueryOutput(player); });
    } else if (generatorChannels.isValidColor(message)) {
        world.getAllPlayers().forEach(player => { generatorChannels.getQueryOutput(player, message); });
    } else if (message === 'reset') {
        generatorChannels.resetAllCounts();
        broadcastActionBar({ translate: 'commands.generator.reset.all.actionbar', with: [sourceName] });
    }
    const args = message.split(' ');
    if (generatorChannels.isValidColor(args[0]) && args[1] === 'reset') {
        generatorChannels.resetCounts(args[0]);
        broadcastActionBar({ translate: 'commands.generator.reset.single.actionbar', with: [sourceName, formatColorStr(args[0])] });
    }
});