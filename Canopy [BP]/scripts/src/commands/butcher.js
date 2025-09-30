import { getTranslatedEntityList } from '../../include/utils';
import { VanillaCommand } from '../../lib/canopy/Canopy';
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, Entity, Player, system } from '@minecraft/server';

new VanillaCommand({
    name: 'canopy:butcher',
    description: 'commands.butcher',
    optionalParameters: [{ name: 'entity', type: CustomCommandParamType.EntitySelector }],
    permissionLevel: CommandPermissionLevel.GameDirectors,
    cheatsRequired: true,
    callback: butcherCommand
});

function butcherCommand(origin, entity) {
    const target = getTargetEntity(origin, entity);
    if (target instanceof Player) {
        return { status: CustomCommandStatus.Failure, message: 'commands.butcher.fail.player' };
    } else if (entity?.length > 0) {
        const removedEntities = removeManyEntities(entity);
        if (removedEntities.length > 0) 
            origin.sendMessage(getManyRemovedMessage(removedEntities));
        else 
            return { status: CustomCommandStatus.Failure, message: 'commands.butcher.fail.noneremoved' };
    } else if (target) {
        system.run(() => target.remove());
        origin.sendMessage({ translate: 'commands.butcher.success', with: [target.typeId.replace('minecraft:', '')] });
    } else {
        return { status: CustomCommandStatus.Failure, message: 'generic.entity.notfound' };
    }
}

function getTargetEntity(origin, entity) {
    const source = origin.getSource();
    if (!entity && source instanceof Entity)
        return source.getEntitiesFromViewDirection({ ignoreBlockCollision: false, includeLiquidBlocks: false, includePassableBlocks: false, maxDistance: 16 })[0]?.entity;
    return void 0;
}

function removeManyEntities(entities) {
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
    message.rawtext.push(getTranslatedEntityList(entities));
    return message;
}