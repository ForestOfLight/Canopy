import { VanillaCommand } from 'lib/canopy/Canopy';
import { Block, CommandError, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, world, system } from '@minecraft/server';

new VanillaCommand({
    name: 'canopy:loop',
    description: 'commands.loop',
    mandatoryParameters: [
        { name: 'times', type: CustomCommandParamType.Integer },
        { name: 'command', type: CustomCommandParamType.String }
    ],
    permissionLevel: CommandPermissionLevel.GameDirectors,
    callback: loopCommand
});

function loopCommand(source, times, command) {
    if (source === "Server")
        source = world.getDimension('overworld');
    else if (source instanceof Block)
        source = source.dimension;
    else if (!source)
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
    loop(times, command, source);
}

function loop(times, command, runLocation) {
    system.run(() => {
        for (let i = 0; i < times; i++) {
            try {
                runLocation.runCommand(command);
            } catch (error) {
                if (error instanceof CommandError)
                    return runLocation.sendMessage(`§cLoop error (Iteration ${i+1}): ${error.message}`);
                throw error;
            }
        }
    });
}
