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
    sender.sendMessage({ translate: 'commands.cleanup.success', with: [entities.length.toString()] });
}