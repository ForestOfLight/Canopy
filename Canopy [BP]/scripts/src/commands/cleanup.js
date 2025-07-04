import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from '@minecraft/server';

system.beforeEvents.startup.subscribe((event) => {
    const commandRegistry = event.customCommandRegistry;
    commandRegistry.registerCommand({
        name: 'canopy:cleanup',
        description: 'commands.cleanup',
        optionalParameters: [{ name: 'radius', type: CustomCommandParamType.Integer }],
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, cleanupCommand);

    commandRegistry.registerCommand({
        name: 'canopy:k',
        description: 'commands.cleanup',
        optionalParameters: [{ name: 'radius', type: CustomCommandParamType.Integer }],
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, cleanupCommand);
});

const TRASH_ENTITY_TYPES = ['minecraft:item', 'minecraft:xp_orb'];
const DEFAULT_RADIUS = 50;

function cleanupCommand(origin, radius) {
    if (!radius)
        radius = DEFAULT_RADIUS;
    const source = origin.sourceBlock || origin.sourceEntity;
    if (!source)
        return { status: CustomCommandStatus.Failure, message: 'generic.source.notfound' };
    const removedCount = removeTrashEntities(source, radius);
    if (origin.sourceBlock)
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