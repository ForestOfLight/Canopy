import { CommandPermissionLevel, CustomCommandStatus } from '@minecraft/server'
import { VanillaCommand } from '../../lib/canopy/Canopy'
import { counterChannels } from '../classes/CounterChannels'
import { generatorChannels } from '../classes/GeneratorChannels'
import { worldSpawns } from 'src/commands/spawn'

new VanillaCommand({
    name: 'canopy:retest',
    description: 'commands.retest',
    permissionLevel: CommandPermissionLevel.Any,
    callback: retestCommand
});

function retestCommand() {
    if (worldSpawns !== null)
        worldSpawns.reset();
    counterChannels.resetAllCounts();
    generatorChannels.resetAllCounts();
    return { status: CustomCommandStatus.Success, message: 'commands.retest.success' };
}
