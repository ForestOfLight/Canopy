import { Rule } from 'lib/canopy/Canopy';
import { BlockPermutation, ItemStack, world } from '@minecraft/server';
import DirectionStateFinder from 'src/classes/DirectionState';

new Rule({
    category: 'Rules',
    identifier: 'pistonBedrockBreaking',
    description: 'Allows pistons to break bedrock when facing away from a bedrock block and expanding.',
});

const insideBedrockPistonList = [];

world.afterEvents.pistonActivate.subscribe(async (event) => {
    if (!await Rule.getNativeValue('pistonBedrockBreaking') || !['Expanding', 'Retracting'].includes(event.piston.state)) return;
    const piston = event.piston;
    const block = event.block;
    let directionState = DirectionStateFinder.getDirectionState(block.permutation);
    if (directionState === undefined) return;
    directionState.value = DirectionStateFinder.getRawMirroredDirection(block);
    if (piston.state === 'Expanding') {
        const behindBlock = DirectionStateFinder.getRelativeBlock(block, directionState);
        if (behindBlock.typeId === 'minecraft:bedrock') {
            block.setPermutation(BlockPermutation.resolve(block.typeId, { [directionState.name]: directionState.value }));
            insideBedrockPistonList.push({ dimensionId: block.dimension.id, location: block.location });
        }
    } else if (piston.state === 'Retracting') {
        const oldPiston = getBlockFromPistonList(block);
        if (oldPiston !== undefined) {
            const blockType = block.typeId;
            const dropLocation = { x: block.location.x + .5, y: block.location.y + .5, z: block.location.z + .5 };
            block.setType('minecraft:air');
            event.dimension.spawnItem(new ItemStack(blockType, 1), dropLocation);
            insideBedrockPistonList.splice(insideBedrockPistonList.indexOf(oldPiston), 1);
        }
    }
});

function getBlockFromPistonList(block) {
    for (const pistonBlock of insideBedrockPistonList) {
        if (pistonBlock.dimensionId === block.dimension.id 
            && pistonBlock.location.x === block.location.x 
            && pistonBlock.location.y === block.location.y 
            && pistonBlock.location.z === block.location.z) {
            return pistonBlock;
        }
    }
    return undefined;
}