import { system, world } from '@minecraft/server';
import { Rule } from 'lib/canopy/Canopy';
import GeneratorChannels from '../../classes/GeneratorChannels';
import Utils from "../../../include/utils";

system.afterEvents.scriptEventReceive.subscribe(async (event) => {
    if (event.id !== 'canopy:generator') return;
    if (!await Rule.getValue('hopperGenerators'))
        return Utils.broadcastActionBar({ translate: 'rules.generic.blocked', with: ['hopperGenerators'] });
    const sourceName = Utils.getScriptEventSourceName(event);
    const message = event.message;
    
    if (message === '') {
        world.getAllPlayers().forEach(player => { GeneratorChannels.getAllQueryOutput(player); });
    } else if (GeneratorChannels.isValidColor(message)) {
        world.getAllPlayers().forEach(player => { GeneratorChannels.getQueryOutput(player, message); });
    } else if (message === 'reset') {
        GeneratorChannels.resetAllCounts();
        Utils.broadcastActionBar({ translate: 'commands.generator.reset.all.actionbar', with: [sourceName] });
    }
    const args = message.split(' ');
    if (GeneratorChannels.isValidColor(args[0]) && args[1] === 'reset') {
        GeneratorChannels.resetCounts(args[0]);
        Utils.broadcastActionBar({ translate: 'commands.generator.reset.single.actionbar', with: [sourceName, Utils.formatColorStr(args[0])] });
    }
});