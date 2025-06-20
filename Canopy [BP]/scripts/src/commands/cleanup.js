import { Command } from '../../lib/canopy/Canopy';

new Command({
    name: 'cleanup',
    description: { translate: 'commands.cleanup' },
    usage: 'cleanup [distance]',
    args: [
        { type: 'number', name: 'distance' }
    ],
    callback: cleanupCommand,
    opOnly: true
});

new Command({
    name: 'k',
    description: { translate: 'commands.cleanup' },
    usage: 'k [distance]',
    args: [
        { type: 'number', name: 'distance' }
    ],
    callback: cleanupCommand,
    helpHidden: true,
    opOnly: true
});

const TRASH_ENTITY_TYPES = ['minecraft:item', 'minecraft:xp_orb'];
const DEFAULT_DISTANCE = 50;

function cleanupCommand(sender, args) {
    let { distance } = args;
    if (distance === null)
        distance = DEFAULT_DISTANCE;
    const removedCount = removeTrashEntities(sender, distance);
    sender.sendMessage({ translate: 'commands.cleanup.success', with: [removedCount.toString(), distance.toString()] });
}

function removeTrashEntities(player, distance) {
    let removedCount = 0;
    for (const type of TRASH_ENTITY_TYPES) {
        const entities = player.dimension.getEntities({ type: type, location: player.location, maxDistance: distance });
        for (const entity of entities) {
            entity.remove();
            removedCount++;
        }
    }
    return removedCount;
}