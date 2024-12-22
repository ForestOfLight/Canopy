import { Command } from 'lib/canopy/Canopy'
import { channelMap as counterMap } from 'src/commands/counter';
import { channelMap as generatorMap } from 'src/commands/generator';
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
    counterMap.resetAll();
    generatorMap.resetAll();
    sender.sendMessage({ translate: 'commands.resettest.success' });
}
