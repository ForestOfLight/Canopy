import { Rule, Command } from 'lib/canopy/Canopy';

new Rule({
    category: 'Rules',
    identifier: 'commandJumpSurvival',
    description: { translate: 'rules.commandJumpSurvival' },
});

new Command({
    name: 'jump',
    description: { translate: 'commands.jump' },
    usage: 'jump',
    callback: jumpCommand
});

new Command({
    name: 'j',
    description: { translate: 'commands.jump' },
    usage: 'j',
    callback: jumpCommand,
    helpHidden: true
})

async function jumpCommand(sender) {
    if (!await Rule.getValue('commandJumpSurvival') && sender.getGameMode() === 'survival')
        return sender.sendMessage({ translate: 'rules.generic.blocked', with: ['commandJumpSurvival'] });
    
    const blockRayResult = sender.getBlockFromViewDirection({ includeLiquidBlocks: false, includePassableBlocks: true, maxDistance: 64*16 });
    if (!blockRayResult?.block)
        return sender.sendMessage({ translate: 'commands.jump.fail.noblock' });
    const jumpLocation = getBlockLocationFromFace(blockRayResult.block, blockRayResult.face);
    sender.teleport(jumpLocation);
}

function getBlockLocationFromFace(block, face) {
    switch(face) {
        case 'Up':
            return { x: block.x, y: block.y + 1, z: block.z};
        case 'Down':
            return { x: block.x, y: block.y - 2, z: block.z};
        case 'North':
            return { x: block.x, y: block.y, z: block.z - 1};
        case 'South':
            return { x: block.x, y: block.y, z: block.z + 1};
        case 'East':
            return { x: block.x + 1, y: block.y, z: block.z};
        case 'West':
            return { x: block.x - 1, y: block.y, z: block.z};
        default:
            throw new Error('Invalid face');
    }
}