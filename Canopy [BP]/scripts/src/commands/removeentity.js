import { Player, world } from '@minecraft/server';
import { Rule, Command } from 'lib/canopy/Canopy';

new Rule({
    category: 'Rules',
    identifier: 'commandRemoveEntity',
    description: { translate: 'rules.commandRemoveEntity' },
});

new Command({
    name: 'removeentity',
    description: { translate: 'commands.removeentity' },
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
    } else if (id === null) {
        sender.sendMessage({ translate: 'generic.entity.notfound' });
    } else {
        sender.sendMessage({ translate: 'commands.removeentity.fail.noid', with: [String(id)] });
    }
}

function getTargetEntity(sender, id) {
    if (id === null)
        return sender.getEntitiesFromViewDirection({ ignoreBlockCollision: false, includeLiquidBlocks: false, includePassableBlocks: false, maxDistance: 16 })[0]?.entity;
    return world.getEntity(String(id));
}