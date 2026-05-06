import { VanillaCommand } from '../../lib/canopy/Canopy';
import { CommandPermissionLevel, CustomCommandStatus } from '@minecraft/server';
import { counterChannels } from '../classes/CounterChannels';
import { generatorChannels } from '../classes/GeneratorChannels';
import { worldSpawns } from '../commands/spawn';

new VanillaCommand({
    name: 'canopy:retest',
    description: 'commands.retest',
    permissionLevel: CommandPermissionLevel.Any,
    callback: retestCommand,
    wikiDescription: 'Resets spawn tracking, hopper counters, and hopper generators. This is great if you want to restart a test for a machine or farm!'
});

function retestCommand() {
    if (worldSpawns !== null)
        worldSpawns.reset();
    counterChannels.resetAllCounts();
    generatorChannels.resetAllCounts();
    return { status: CustomCommandStatus.Success, message: 'commands.retest.success' };
}
