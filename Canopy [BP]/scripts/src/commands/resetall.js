import { world } from '@minecraft/server'
import { Command } from 'lib/canopy/Canopy'

new Command({
    name: 'resetall',
    description: 'Resets all §lCanopy§r§8 features and data. Use with caution.',
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
    world.sendMessage('§cPlayer and world dynamic properties have been reset.');
}