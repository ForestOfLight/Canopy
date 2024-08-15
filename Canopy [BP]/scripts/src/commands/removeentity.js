import { Player, world } from '@minecraft/server';
import { Rule, Command } from 'lib/canopy/Canopy';
import Data from 'stickycore/data';

new Rule({
    identifier: 'commandRemoveEntity',
    description: 'Allows the use of the removeentity command.',
});

new Command({
    name: 'removeentity',
    description: 'Instantly remove the entity you\'re looking at or by id.',
    usage: 'removeentity [id]',
    args: [
        { type: 'number', name: 'id' }
    ],
    callback: removeEntityCommand,
    contingentRules: ['commandRemoveEntity']
});

function removeEntityCommand(sender, args) {
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