import { world } from '@minecraft/server'
import Command from 'stickycore/command'

new Command()
    .setName('resetall')
    .setCallback(resetallCommand)
    .build()

function resetallCommand(sender) {
    world.clearDynamicProperties();
    const players = mc.world.getAllPlayers();
    players.forEach(player => {
        player.clearDynamicProperties();
    });
    world.sendMessage('§cPlayer and world dynamic properties have been reset.');
}