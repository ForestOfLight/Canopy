import { Rule, Command } from 'lib/canopy/Canopy';

new Rule({
    category: 'Rules',
    identifier: 'commandCleanup',
    description: 'Enables cleanup command.'
});

new Command({
    name: 'cleanup',
    description: 'Removes all items and experience orbs. (Alias: k)',
    usage: 'cleanup [distance]',
    args: [
        { type: 'number', name: 'distance' },
    ],
    callback: cleanupCommand,
    contingentRules: ['commandCleanup']
});

new Command({
    name: 'k',
    description: 'Removes all items and experience orbs.',
    usage: 'k [distance]',
    args: [
        { type: 'number', name: 'distance' },
    ],
    callback: cleanupCommand,
    contingentRules: ['commandCleanup'],
    helpHidden: true
})

function cleanupCommand(sender, args) {
    const { distance } = args;
    let entities;
    if (distance === null)
        entities = sender.dimension.getEntities({ type: 'minecraft:item' })
            .concat(sender.dimension.getEntities({ type: 'minecraft:xp_orb' }));
    else
        entities = sender.dimension.getEntities({ type: 'minecraft:item', location: sender.location, maxDistance: distance })
            .concat(sender.dimension.getEntities({ type: 'minecraft:xp_orb', location: sender.location, maxDistance: distance }));

    for (const entity of entities) {
        entity.remove();
    }
    sender.sendMessage(`§7Cleaned up ${entities.length} items & xp.`);
}