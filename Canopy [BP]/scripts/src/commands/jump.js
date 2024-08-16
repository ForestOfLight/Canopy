import { Rule, Command } from 'lib/canopy/Canopy';
import Data from 'stickycore/data';

new Rule({
    category: 'Rules',
    identifier: 'commandJumpSurvival',
    description: 'Enables jump command in survival mode.'
});

new Command({
    name: 'jump',
    description: 'Teleport to the block you are looking at. (Alias: j)',
    usage: 'jump',
    callback: jumpCommand
});

new Command({
    name: 'j',
    description: '',
    usage: 'j',
    callback: jumpCommand,
    helpHidden: true
})

function jumpCommand(sender) {
    let blockRayResult;
    let maxDistance = 64*16;
    let jumpLocation;
    if (!Rule.getValue('commandJumpSurvival') && sender.getGameMode() === 'survival')
        return sender.sendMessage('§cThe commandJumpSurvival feature is disabled.');

    blockRayResult = Data.getLookingAtBlock(sender, maxDistance);
    if (!blockRayResult?.block) return sender.sendMessage('§cNo block found.');
    jumpLocation = getBlockLocationFromFace(blockRayResult.block, blockRayResult.face);
    sender.teleport(jumpLocation);
}

function getBlockLocationFromFace(block, face) {
    switch(face) {
        case 'Up': return { x: block.x, y: block.y + 1, z: block.z};
        case 'Down': return { x: block.x, y: block.y - 2, z: block.z};
        case 'North': return { x: block.x, y: block.y, z: block.z - 1};
        case 'South': return { x: block.x, y: block.y, z: block.z + 1};
        case 'East': return { x: block.x + 1, y: block.y, z: block.z};
        case 'West': return { x: block.x - 1, y: block.y, z: block.z};
    }
}