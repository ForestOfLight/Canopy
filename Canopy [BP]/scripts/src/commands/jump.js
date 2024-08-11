import { world } from '@minecraft/server'
import Command from 'stickycore/command'
import Data from 'stickycore/data'

new Command()
    .setName('jump')
    .setCallback(jumpCommand)
    .build()

new Command()
    .setName('j')
    .setCallback(jumpCommand)
    .build()

function jumpCommand(sender) {
    let blockRayResult;
    let maxDistance = 64*16;
    let jumpLocation;
    if (!world.getDynamicProperty('commandJumpSurvival') && sender.getGameMode() === 'survival')
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