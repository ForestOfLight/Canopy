import { system, world, MinecraftDimensionTypes, CommandError } from '@minecraft/server';
import Utils from 'include/utils';

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== "canopy:loop") return;
    const message = event.message;
    const args = message.match(/(\d+)\s+"([^"]+)"/).slice(1);
    console.warn('Recieved loop command with args:', JSON.stringify(args));
    
    const source = Utils.getScriptEventSourceObject(event);
    let runLocation = source;
    if (source === 'Server')
        runLocation = world.getDimension(MinecraftDimensionTypes.overworld);
    else if (source === 'Unknown')
        throw new CommandError('Unknown source. Try running the command from somewhere else.');
    else if (typeof source === 'Block')
        runLocation = source.dimension;
    loopCommand(args[0], args[1], runLocation);
});

function loopCommand(times, command, runLocation) {
    if (times === null || command === null || !Utils.isNumeric(times))
        return new CommandError('Invalid arguments. Usage: loop <times> <command>');

    for (let i = 0; i < times; i++) {
        runLocation.runCommand(command);
    }
}
