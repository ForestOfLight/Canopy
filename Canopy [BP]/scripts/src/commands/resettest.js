import { Command } from 'lib/canopy/Canopy'
import CounterChannels from '../classes/CounterChannels';
import GeneratorChannels from "../classes/GeneratorChannels";
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
    CounterChannels.resetAllCounts();
    GeneratorChannels.resetAllCounts();
    sender.sendMessage({ translate: 'commands.resettest.success' });
}
