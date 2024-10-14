import { world } from '@minecraft/server'
import { Command } from 'lib/canopy/Canopy'

new Command({
    name: 'resetall',
    description: { translate: 'commands.resetall.description' },
    usage: 'resetall',
    callback: resetallCommand,
    adminOnly: true
});

function resetallCommand(sender) {
    world.clearDynamicProperties();
    const players = world.getAllPlayers();
    players.forEach(player => {
        player?.clearDynamicProperties();
    });
    world.sendMessage({ translate: 'commands.resetall.success' });
}