import { world } from '@minecraft/server'
import { Command } from 'lib/canopy/Canopy'

new Command({
    name: 'resetall',
    description: 'Reset all dynamic properties for the world and all online players.',
    usage: 'resetall',
    callback: resetallCommand,
    adminOnly: true
});

function resetallCommand(sender) {
    world.clearDynamicProperties();
    const players = mc.world.getAllPlayers();
    players.forEach(player => {
        player.clearDynamicProperties();
    });
    world.sendMessage('§cPlayer and world dynamic properties have been reset.');
}