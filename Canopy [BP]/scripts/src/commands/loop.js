import { VanillaCommand } from 'lib/canopy/Canopy';
import { CommandError, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, world, system } from '@minecraft/server';

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

function loopCommand(origin, times, command) {
    const source = origin.getSource();
    let runLocation;
    if (origin.getType() === "Server")
        runLocation = world.getDimension('overworld');
    else if (origin.getType() === "Block")
        runLocation = source.dimension;
    else if (origin)
        runLocation = source;
    else
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
    loop(times, command, runLocation);
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
