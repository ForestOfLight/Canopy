import { Command } from 'lib/canopy/Canopy';
import  { printDimensionEntities } from 'src/commands/entitydensity';
import Profiler from '../classes/Profiler';

new Command({
    name: 'health',
    description: { translate: 'commands.health' },
    usage: 'health',
    callback: healthCommand
})

async function healthCommand(sender) {
    sender.sendMessage(`§7Profiling tick time...`);
    const profile = await Profiler.profile();
    printDimensionEntities(sender);
    sender.sendMessage(formatProfileMessage(profile));
}

function formatProfileMessage(profile) {
    let message = `§7Tps:§r ${profile.tps.result >= 20.0 ? `§a20.0` : `§c${profile.tps.result.toFixed(1)}`}`;
    message += ` §7Range: ${profile.tps.min.toFixed(1)}-${profile.tps.max.toFixed(1)}\n`;
    message += `§7Mspt:§r ${profile.mspt.result < 50 ? '§a' : '§c'}${profile.mspt.result.toFixed(1)}`;
    message += ` §7Range: ${profile.mspt.min.toFixed(1)}-${profile.mspt.max.toFixed(1)}`;
    return message;
}
