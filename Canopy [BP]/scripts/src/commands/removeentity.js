import { Player, world } from '@minecraft/server';
import { Rule, Command } from 'lib/canopy/Canopy';
import Data from 'stickycore/data';

new Rule({
    category: 'Rules',
    identifier: 'commandRemoveEntity',
    description: { translate: 'rules.commandRemoveEntity.description' },
});

new Command({
    name: 'removeentity',
    description: { translate: 'commands.removeentity.description' },
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
        sender.sendMessage({ translate: 'commands.removeentity.fail.player' });
    } else if (target) {
        target.remove();
        sender.sendMessage({ translate: 'commands.removeentity.success', with: [target.typeId.replace('minecraft:', ''), target.id] });
    } else if (id !== null) {
        sender.sendMessage({ translate: 'commands.removeentity.fail.noid', with: [id] });
    } else {
        sender.sendMessage({ translate: 'generic.entity.notfound' });
    }
}

function getTargetEntity(sender, id) {
    if (id === null)
        return Data.getLookingAtEntities(sender, 16)[0]?.entity;
    return world.getEntity(String(id));
}