import { Command } from 'lib/canopy/Canopy'
import { counterChannels } from '../classes/CounterChannels';
import { generatorChannels } from "../classes/GeneratorChannels";
import { worldSpawns } from 'src/commands/spawn';

new Command({
    name: 'resettest',
    description: { translate: 'commands.resettest' },
    usage: 'resettest',
    callback: resettestCommand
})

function resettestCommand(sender) {
    if (worldSpawns !== null)
        worldSpawns.reset();
    counterChannels.resetAllCounts();
    generatorChannels.resetAllCounts();
    sender.sendMessage({ translate: 'commands.resettest.success' });
}
