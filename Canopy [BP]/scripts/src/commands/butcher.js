import { Command } from 'lib/canopy/Canopy';
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, Entity, Player, system } from '@minecraft/server';
import { VanillaCommand } from '../../lib/canopy/VanillaCommand';

new Command({
    name: 'butcher',
    description: { translate: 'commands.butcher' },
    usage: 'butcher [id]',
    args: [
        { type: 'number', name: 'id' }
    ],
    callback: butcherCommand,
    opOnly: true
});

new VanillaCommand({
    name: 'canopy:butcher',
    description: 'commands.butcher',
    optionalParameters: [{ name: 'entity', type: CustomCommandParamType.EntitySelector }],
    permissionLevel: CommandPermissionLevel.GameDirectors,
    cheatsRequired: true,
    callback: butcherCommand
});

function butcherCommand(sender, entity) {
    const target = getTargetEntity(sender, entity);
    if (target instanceof Player) {
        return { status: CustomCommandStatus.Failure, message: 'commands.butcher.fail.player' };
    } else if (entity?.length > 0) {
        const removedEntities = removeManyEntities(sender, entity);
        if (removedEntities.length > 0) 
            sender.sendMessage(getManyRemovedMessage(removedEntities));
        else 
            return { status: CustomCommandStatus.Failure, message: 'commands.butcher.fail.noneremoved' };
    } else if (target) {
        system.run(() => target.remove());
        sender.sendMessage({ translate: 'commands.butcher.success', with: [target.typeId.replace('minecraft:', '')] });
    } else {
        return { status: CustomCommandStatus.Failure, message: 'generic.entity.notfound' };
    }
}

function getTargetEntity(sender, entity) {
    if (!entity && entity instanceof Entity)
        return sender.getEntitiesFromViewDirection({ ignoreBlockCollision: false, includeLiquidBlocks: false, includePassableBlocks: false, maxDistance: 16 })[0]?.entity;
    return entity;
}

function removeManyEntities(sender, entities) {
    const removedEntities = [];
    entities.forEach(currEntity => {
        if (currEntity instanceof Player)
            return;
        system.run(() => currEntity.remove());
        removedEntities.push(currEntity);
    });
    return removedEntities;
}

function getManyRemovedMessage(entities) {
    const message = { rawtext: [{ translate: 'commands.butcher.success.many', with: [String(entities.length)] }] };
    const localizationKeys = entities.map(e => ({ translate: e.localizationKey }));
    localizationKeys.forEach((key, index) => {
        if (index > 0) 
            message.rawtext.push({ text: ', ' });
        message.rawtext.push(key);
    });
    return message;
}