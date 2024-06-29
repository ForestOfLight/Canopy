import Command from 'stickycore/command'
import * as mc from '@minecraft/server'

new Command()
    .setName('resetall')
    .setCallback(resetallCommand)
    .build()

function resetallCommand(sender) {
    mc.world.clearDynamicProperties();
    const players = mc.world.getAllPlayers();
    players.forEach(player => {
        player.clearDynamicProperties();
    });
    mc.world.sendMessage('§cPlayer and world dynamic properties have been reset.');
}