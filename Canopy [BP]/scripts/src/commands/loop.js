import { Command } from 'lib/canopy/Canopy';
import { CommandError } from '@minecraft/server';

const cmd = new Command({
    name: 'loop',
    description: { translate: 'commands.loop' },
    usage: 'loop <times> <"command to run">',
    args: [
        { type: 'number', name: 'times' },
        { type: 'string', name: 'command' },
    ],
    callback: loopCommand,
})

function loopCommand(sender, args) {
    const { times, command } = args;
    if (times === null || command === null)
        return cmd.sendUsage(sender);

    loop(times, command, sender);
}

function loop(times, command, runLocation) {
    for (let i = 0; i < times; i++) {
        try {
            runLocation.runCommand(command);
        } catch (error) {
            if (error instanceof CommandError)
                return runLocation.sendMessage(`§cLooped command error: ${error.message}`);
        }
    }
}
