import { VanillaCommand } from '../../lib/canopy/Canopy';
import { Block, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from '@minecraft/server';

new VanillaCommand({
    name: 'canopy:cleanup',
    description: 'commands.cleanup',
    optionalParameters: [{ name: 'radius', type: CustomCommandParamType.Integer }],
    permissionLevel: CommandPermissionLevel.GameDirectors,
    cheatsRequired: true,
    callback: cleanupCommand,
    aliases: ['canopy:k']
});

const TRASH_ENTITY_TYPES = ['minecraft:item', 'minecraft:xp_orb'];
const DEFAULT_RADIUS = 50;

function cleanupCommand(source, radius) {
    if (!radius)
        radius = DEFAULT_RADIUS;
    if (!source || source === "Server")
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.source.notfound' };
    const removedCount = removeTrashEntities(source, radius);
    if (source instanceof Block)
        return { status: CustomCommandStatus.Success, message: 'commands.cleanup.success' };
    source.sendMessage({ translate: 'commands.cleanup.success', with: [removedCount.toString(), radius.toString()] });
    return { status: CustomCommandStatus.Success };
}

function removeTrashEntities(source, radius) {
    let removedCount = 0;
    for (const type of TRASH_ENTITY_TYPES) {
        const entities = source.dimension.getEntities({ type: type, location: source.location, maxDistance: radius });
        removedCount += entities.length;
        system.run(() => {
            for (const entity of entities)
                entity.remove();
        });
    }
    return removedCount;
}