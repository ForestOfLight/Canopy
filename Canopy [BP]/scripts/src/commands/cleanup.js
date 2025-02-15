import { Rule, Command } from 'lib/canopy/Canopy';

new Rule({
    category: 'Rules',
    identifier: 'commandCleanup',
    description: { translate: 'rules.commandCleanup' }
});

new Command({
    name: 'cleanup',
    description: { translate: 'commands.cleanup' },
    usage: 'cleanup [distance]',
    args: [
        { type: 'number', name: 'distance' },
    ],
    callback: cleanupCommand,
    contingentRules: ['commandCleanup']
});

new Command({
    name: 'k',
    description: { translate: 'commands.cleanup' },
    usage: 'k [distance]',
    args: [
        { type: 'number', name: 'distance' },
    ],
    callback: cleanupCommand,
    contingentRules: ['commandCleanup'],
    helpHidden: true
});

const TRASH_ENTITY_TYPES = ['minecraft:item', 'minecraft:xp_orb'];

function cleanupCommand(sender, args) {
    const { distance } = args;
    const removedCount = removeTrashEntities(sender, distance);
    sender.sendMessage({ translate: 'commands.cleanup.success', with: [removedCount.toString()] });
}

function removeTrashEntities(player, distance) {
    let removedCount = 0;
    for (const type of TRASH_ENTITY_TYPES) {
        let entities;
        if (distance === null)
            entities = player.dimension.getEntities({ type: type });
        else
            entities = player.dimension.getEntities({ type: type, location: player.location, maxDistance: distance });
        for (const entity of entities) {
            entity.remove();
            removedCount++;
        }
    }
    return removedCount;
}