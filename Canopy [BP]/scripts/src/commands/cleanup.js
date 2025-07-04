import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, system } from '@minecraft/server';

system.beforeEvents.startup.subscribe((event) => {
    const commandRegistry = event.customCommandRegistry;
    commandRegistry.registerCommand({
        name: 'canopy:cleanup',
        description: 'commands.cleanup',
        optionalParameters: [{ name: 'distance', type: CustomCommandParamType.Integer }],
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, cleanupCommand);
});

const TRASH_ENTITY_TYPES = ['minecraft:item', 'minecraft:xp_orb'];
const DEFAULT_DISTANCE = 50;

function cleanupCommand(origin, distance) {
    if (!distance)
        distance = DEFAULT_DISTANCE;
    const source = origin.sourceBlock || origin.sourceEntity;
    if (!source)
        return { status: CustomCommandStatus.Failure, message: 'generic.source.notfound' };
    const removedCount = removeTrashEntities(source, distance);
    if (origin.sourceBlock)
        return { status: CustomCommandStatus.Success, message: 'commands.cleanup.success' };
    source.sendMessage({ translate: 'commands.cleanup.success', with: [removedCount.toString(), distance.toString()] });
    return { status: CustomCommandStatus.Success };
}

function removeTrashEntities(source, distance) {
    let removedCount = 0;
    for (const type of TRASH_ENTITY_TYPES) {
        const entities = source.dimension.getEntities({ type: type, location: source.location, maxDistance: distance });
        removedCount += entities.length;
        system.run(() => {
            for (const entity of entities)
                entity.remove();
        });
    }
    return removedCount;
}