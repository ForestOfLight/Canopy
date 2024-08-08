import { Player, world } from '@minecraft/server';
import Command from 'stickycore/command'
import Data from 'stickycore/data'

new Command()
    .setName('removeentity')
    .addArgument('number', 'id')
    .setCallback(removeEntityCommand)
    .build()

function removeEntityCommand(sender, args) {
    if (!world.getDynamicProperty('commandRemoveEntity')) return sender.sendMessage('§cThe commandRemoveEntity feature is disabled.');
    const { id } = args;
    const target = getTargetEntity(sender, id);
    if (target instanceof Player) {
        sender.sendMessage('§cCannot remove players.');
    } else if (target) {
        target.remove();
        sender.sendMessage(`§7Removed entity with id ${target.id}.`);
    } else if (id !== null) {
        sender.sendMessage(`§cNo entity found with id ${id}.`);
    } else {
        sender.sendMessage(`§cNo entity found.`);
    }
}

function getTargetEntity(sender, id) {
    if (id === null)
        return Data.getLookingAtEntities(sender, 16)[0]?.entity;
    return world.getEntity(String(id));
}