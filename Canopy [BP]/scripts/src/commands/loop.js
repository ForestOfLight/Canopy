import { Command } from 'lib/canopy/Canopy';

const cmd = new Command({
    name: 'loop',
    description: { translate: 'commands.loop' },
    usage: 'loop <times> <command>',
    args: [
        { type: 'number', name: 'times' },
        { type: 'string', name: 'command' },
    ],
    callback: loopCommand,
})

function loopCommand(sender, args) {
    const { times, command } = args;
    if (times === null || command === null)
        return sender.sendMessage(cmd.sendUsage());

    for (let i = 0; i < times; i++) {
        sender.runCommand(command);
    }
}
